/**
 * Colour arithmetic for build scripts — sRGB, linear light, OKLab/OKLCH
 * (Björn Ottosson's published matrices) and HSL. No dependency: the app uses
 * culori for this; the website needs five functions of it at build time.
 */
export type RGB = [number, number, number] // 0..1, gamma-encoded sRGB

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toGam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function rgbToOklch([r, g, b]: RGB) {
  const [R, G, B] = [toLin(r), toLin(g), toLin(b)]
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B)
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B)
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.hypot(a, bb)
  const H = ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360
  return { L, C, H }
}

export function oklchToRgb({ L, C, H }: { L: number; C: number; H: number }): RGB {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  return [clamp(toGam(R)), clamp(toGam(G)), clamp(toGam(B))]
}

export function rgbToHsl([r, g, b]: RGB) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: h * 60, s, l }
}

/** The token format the site's CSS reads: `hsl(var(--x))` takes "H S% L%". */
export const hslTriplet = (rgb: RGB) => {
  const { h, s, l } = rgbToHsl(rgb)
  const S = Math.round(s * 1000) / 10
  // An achromatic colour has no hue; print 0 rather than float noise.
  return `${S === 0 ? 0 : Math.round(h)} ${S}% ${Math.round(l * 1000) / 10}%`
}

export const hex = (rgb: RGB) => '#' + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase()

export function parseHslTriplet(t: string): RGB {
  const [h, s, l] = t.trim().split(/\s+/).map((x) => parseFloat(x))
  const S = s / 100, Lh = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = S * Math.min(Lh, 1 - Lh)
  const f = (n: number) => Lh - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/** WCAG 2.1 relative luminance and contrast. */
export const luminance = ([r, g, b]: RGB) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
export const contrast = (x: RGB, y: RGB) => {
  const [a, b] = [luminance(x), luminance(y)].sort((p, q) => q - p)
  return (a + 0.05) / (b + 0.05)
}
