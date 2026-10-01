/**
 * MATTE — the third theme, derived from the owner's reference photograph
 * (owner, 2026-10-01: "grainny matte dark copy … that is how i want the dark
 * mode to look like as a third mode … use this exactly").
 *
 *   npx tsx scripts/derive-matte.ts [design/reference/matte-surface.jpg]
 *
 * Writes three files, all generated — re-run this, never edit them:
 *   public/textures/matte-grain.webp          the photograph's own grain, as a tile
 *   public/textures/matte-grain-surface.webp  the same grain for lifted surfaces
 *   styles/matte.css                  the .matte tokens and surfaces
 *   content/matte.generated.ts        MATTE.ready + the measured facts
 *
 * WHAT COMES FROM THE PHOTOGRAPH, AND WHAT DOES NOT.
 *  · The surface colour IS the photograph's mean pixel, read in sRGB through
 *    its embedded Display P3 profile. The photograph is achromatic (R = G = B
 *    on every pixel), so the material has no hue and neither does anything
 *    derived from it.
 *  · The grain IS the photograph's own pixels: everything finer than the
 *    lighting. Rendered over the surface colour with `overlay`, whose
 *    arithmetic on a dark backdrop is 2·b·s, so encoding s = ½ + Δ/(2b)
 *    reproduces the photograph's deviations Δ on the canvas level for level.
 *    Because that gain depends on b, a lifted surface (a card is lighter)
 *    gets its own encoding of the SAME grain, so it carries the photograph's
 *    grain at the photograph's strength rather than 1.7× it — the first
 *    render, with one tile, made the icon tiles sparkle.
 *  · The lighting falloff across the photograph (±7 levels corner to corner,
 *    measured) is the room the photo was taken in, not the material; it is
 *    removed so the tile can repeat without a visible lattice. The tile is
 *    made seamless by a variance-preserving cross-fade (sin/cos weights), so
 *    the seam carries the same grain strength as the middle.
 *  · Nothing else is in the photograph. The surfaces above the page (cards,
 *    menus, borders) keep each dark-theme token's DISTANCE in OKLCH lightness
 *    from the dark canvas, on this material. Text keeps the dark theme's
 *    lightness. Every text pair is then measured against WCAG 2.1 and raised
 *    until it passes — chosen by measurement, the brand kit's rule.
 *  · Gold, the status colours and the destructive red are the product's and
 *    are not the photograph's to change.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'
import { contrast, hex, hslTriplet, oklchToRgb, parseHslTriplet, rgbToOklch, type RGB } from './lib/colour'

const SRC = process.argv[2] ?? 'design/reference/matte-surface.jpg'
const LIGHTING_SIGMA = 40 // px — removes the photograph's lighting, keeps all grain (measured: grain lives at 2–10 px)
const SEAM = 96 // px — cross-fade width that makes the tile repeat

// The dark theme, as styles/tokens.css declares it. The derivation reads
// distances from this, so it lives next to the arithmetic that uses it.
const DARK = {
  background: '228 90% 9%', foreground: '226 39% 92%', card: '225 70% 19%', popover: '225 70% 19%',
  secondary: '225 68% 25%', muted: '225 55% 22%', accent: '225 68% 25%', border: '226 45% 30%', input: '226 45% 30%',
  mutedForeground: '226 29% 69%', textFaint: '227 23% 49%', glow: '262 78% 72%', primaryForeground: '226 60% 8%',
  destructiveForeground: '226 39% 96%', primary: '42 55% 55%', deep: '228 90% 5%', shadow: '228 90% 3%',
}

async function main() {
  const bytes = readFileSync(SRC)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const { data, info } = await sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  const n = W * H
  let chroma = 0
  const luma = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2]
    chroma = Math.max(chroma, Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
    luma[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const mean = luma.reduce((p, v) => p + v, 0) / n
  const sd = (a: ArrayLike<number>) => { let m = 0; for (let i = 0; i < a.length; i++) m += a[i]; m /= a.length; let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - m) ** 2; return Math.sqrt(s / a.length) }

  // The lighting, from a mirror-padded blur so the borders are not biased.
  const pad = LIGHTING_SIGMA * 3
  // Two instances: sharp runs extract() before extend() within one pipeline.
  const padded = await sharp(bytes).removeAlpha().extend({ top: pad, bottom: pad, left: pad, right: pad, extendWith: 'mirror' }).png().toBuffer()
  const low = await sharp(await sharp(padded).blur(LIGHTING_SIGMA).png().toBuffer()).extract({ left: pad, top: pad, width: W, height: H }).raw().toBuffer()
  const grain = new Float64Array(n)
  for (let i = 0; i < n; i++) grain[i] = luma[i] - (0.2126 * low[i * C] + 0.7152 * low[i * C + 1] + 0.0722 * low[i * C + 2])

  // Seamless: wrap x, then y, with sin/cos weights (w₁² + w₂² = 1 keeps the
  // variance of independent grain constant across the seam). The tile is the
  // (cw + SEAM) × (ch + SEAM) region at the photograph's top-left.
  const seamless = (cw: number, ch: number) => {
    const A = new Float64Array(cw * (ch + SEAM))
    for (let y = 0; y < ch + SEAM; y++) for (let x = 0; x < cw; x++) {
      const own = grain[y * W + x]
      if (x >= SEAM) { A[y * cw + x] = own; continue }
      const t = ((x + 0.5) / SEAM) * (Math.PI / 2)
      A[y * cw + x] = Math.sin(t) * own + Math.cos(t) * grain[y * W + x + cw]
    }
    const T = new Float64Array(cw * ch)
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const own = A[y * cw + x]
      if (y >= SEAM) { T[y * cw + x] = own; continue }
      const t = ((y + 0.5) / SEAM) * (Math.PI / 2)
      T[y * cw + x] = Math.sin(t) * own + Math.cos(t) * A[(y + ch) * cw + x]
    }
    const m = T.reduce((p, v) => p + v, 0) / T.length
    for (let i = 0; i < T.length; i++) T[i] -= m
    return T
  }

  // Overlay-neutral encoding for a backdrop b (0..255): s = ½ + Δ/(2b).
  // Verified by decoding the WebP and applying overlay's 2·b·s to it.
  let clipped = 0
  const encode = async (T: Float64Array, cw: number, ch: number, b: number, file: string) => {
    const enc = Buffer.alloc(cw * ch)
    for (let i = 0; i < T.length; i++) {
      const s = 127.5 + (255 * T[i]) / (2 * b)
      if (s < 0 || s > 255) clipped++
      enc[i] = Math.max(0, Math.min(255, Math.round(s)))
    }
    const webp = await sharp(enc, { raw: { width: cw, height: ch, channels: 1 } }).webp({ quality: 90, smartSubsample: false, effort: 6 }).toBuffer()
    writeFileSync(file, webp)
    const back = await sharp(webp).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const sim = Array.from({ length: cw * ch }, (_, i) => 2 * b * (back.data[i * back.info.channels] / 255))
    return { kb: +(webp.length / 1024).toFixed(1), simMean: +(sim.reduce((p, v) => p + v, 0) / sim.length).toFixed(2), simSd: +sd(sim).toFixed(2) }
  }
  const base = Math.round(mean * 10) / 10
  const tw = W - SEAM, th = H - SEAM
  const canvasTile = await encode(seamless(tw, th), tw, th, base, 'public/textures/matte-grain.webp')

  // Tokens.
  const surface: RGB = [base / 255, base / 255, base / 255]
  const Lb = rgbToOklch(surface).L
  const Ld = (t: string) => rgbToOklch(parseHslTriplet(t)).L
  const darkBg = Ld(DARK.background)
  const neutral = (L: number): RGB => oklchToRgb({ L: Math.min(1, Math.max(0, L)), C: 0, H: 0 })
  const lift = (t: string) => neutral(Lb + (Ld(t) - darkBg)) // a surface: the same distance from the canvas
  const ink = (t: string) => neutral(Ld(t)) // text: the same lightness
  const tokens: Record<string, RGB> = {
    background: surface,
    card: lift(DARK.card), popover: lift(DARK.popover), secondary: lift(DARK.secondary), muted: lift(DARK.muted), accent: lift(DARK.accent),
    border: lift(DARK.border), input: lift(DARK.input), deep: lift(DARK.deep), shadow: lift(DARK.shadow),
    foreground: ink(DARK.foreground), mutedForeground: ink(DARK.mutedForeground), textFaint: ink(DARK.textFaint),
    glow: ink(DARK.glow), primaryForeground: ink(DARK.primaryForeground), destructiveForeground: ink(DARK.destructiveForeground),
  }
  // Measured, not assumed: raise a text colour until it passes on every surface it sits on.
  const raise = (key: string, min: number, on: string[]) => {
    let L = rgbToOklch(tokens[key]).L, moved = false
    while (on.some((s) => contrast(tokens[key], tokens[s]) < min) && L < 1) { L += 0.005; tokens[key] = neutral(L); moved = true }
    return moved
  }
  // Lifted surfaces: the same grain encoded for the card's level. A 384 px
  // tile — surfaces are small, and repetition at 384 px does not read.
  const cardLevel = tokens.card[0] * 255
  const surfaceTile = await encode(seamless(384, 384), 384, 384, cardLevel, 'public/textures/matte-grain-surface.webp')
  const raisedFg = raise('foreground', 7, ['background', 'card', 'secondary', 'popover'])
  const raisedMuted = raise('mutedForeground', 4.5, ['background', 'card', 'secondary', 'popover'])
  const gold = parseHslTriplet(DARK.primary)
  const report = {
    foreground: contrast(tokens.foreground, surface), foregroundOnCard: contrast(tokens.foreground, tokens.card),
    muted: contrast(tokens.mutedForeground, surface), mutedOnCard: contrast(tokens.mutedForeground, tokens.card), mutedOnSecondary: contrast(tokens.mutedForeground, tokens.secondary),
    gold: contrast(gold, surface), goldOnCard: contrast(gold, tokens.card), onGold: contrast(tokens.primaryForeground, gold),
  }

  const t = (k: string) => hslTriplet(tokens[k])
  const css = `/* GENERATED by scripts/derive-matte.ts from ${SRC}
   (sha256 ${sha256.slice(0, 16)}…). Do not edit — re-run the script.
   Measured: ${W}×${H}, achromatic (max channel spread ${chroma}), mean ${base}/255 = ${hex(surface)},
   grain σ ${sd(grain).toFixed(2)} levels after removing the lighting (whole photograph σ ${sd(luma).toFixed(2)}).
   Contrast (WCAG 2.1): text ${report.foreground.toFixed(1)}:1, muted ${report.muted.toFixed(1)}:1 (on cards ${report.mutedOnCard.toFixed(1)}:1), gold ${report.gold.toFixed(1)}:1, on-gold ${report.onGold.toFixed(1)}:1. */

/* The material. Every rule here is anchored on :root.matte, so it outranks
   the dark rules it inherits from (:is(.dark, .matte) …, one class lighter)
   AND the unlayered rules globals.css declares after its imports — the
   first build lost to exactly that, and the canvas rendered flat. */
:root.matte {
  color-scheme: dark;
  --background: ${t('background')};        /* ${hex(surface)} — the photograph's mean pixel */
  --foreground: ${t('foreground')};
  --card: ${t('card')};
  --card-foreground: ${t('foreground')};
  --popover: ${t('popover')};
  --popover-foreground: ${t('foreground')};
  --primary-foreground: ${t('primaryForeground')};
  --secondary: ${t('secondary')};
  --secondary-foreground: ${t('foreground')};
  --muted: ${t('muted')};
  --muted-foreground: ${t('mutedForeground')};
  --accent: ${t('accent')};
  --accent-foreground: ${t('foreground')};
  --destructive-foreground: ${t('destructiveForeground')};
  --border: ${t('border')};
  --input: ${t('input')};
  --text-faint: ${t('textFaint')};
  --glow: ${t('glow')};                    /* matte emits no coloured light: hairlines are neutral */
  --matte-deep: ${t('deep')};
  --matte-shadow: ${t('shadow')};
  --matte-grain: url('/textures/matte-grain.webp');
  --matte-grain-surface: url('/textures/matte-grain-surface.webp');
  background-color: hsl(var(--background));
  background-image: var(--matte-grain);
  background-blend-mode: overlay;
}

/* The page IS the material: the root paints it, so it scrolls with the
   document like a surface rather than sitting over it like a filter. */
:root.matte body, :root.matte .site-canvas { background: transparent; }
:root.matte .grain::after { display: none; }

/* Every OPAQUE surface carries the grain. Only the opaque ones: overlay on a
   translucent colour would mix mid-grey into it; translucent surfaces show
   the page's grain through them, which is the same material. Surfaces at the
   canvas's level take the canvas tile; lifted ones take the tile encoded for
   their level, so the grain is the photograph's strength on both.
   ATTRIBUTE selectors, never .bg-background: Tailwind's @apply copies every
   rule that names the applied class, so 'body { @apply bg-background }'
   cloned this rule onto <body> at higher specificity and the page painted
   the raw mid-grey tile (found by measuring the render: canvas mean 128). */
:root.matte :is([class~='bg-background'], .main-panel, .header-surface) {
  background-image: var(--matte-grain);
  background-blend-mode: overlay;
}
:root.matte :is([class~='bg-card'], [class~='bg-popover'], [class~='bg-secondary'], [class~='bg-muted'], [class~='bg-accent']) {
  background-image: var(--matte-grain-surface);
  background-blend-mode: overlay;
}

/* Scrims. In the other themes a scrim paints flat colour over the stage; on
   a material that would leave a smooth band with no grain (the first render
   did exactly that under the hero). Here a scrim IS the material, faded by a
   mask with the same stops, so it is continuous with the canvas around it. */
:root.matte :is(.scrim-x, .scrim-t, .scrim-b, .scrim-reel) {
  background: var(--matte-grain) hsl(var(--background));
  background-blend-mode: overlay;
}
:root.matte .scrim-x { -webkit-mask-image: linear-gradient(90deg, #000 0%, rgb(0 0 0 / 0.96) 34%, rgb(0 0 0 / 0.55) 58%, rgb(0 0 0 / 0.25) 80%, rgb(0 0 0 / 0.45) 100%); mask-image: linear-gradient(90deg, #000 0%, rgb(0 0 0 / 0.96) 34%, rgb(0 0 0 / 0.55) 58%, rgb(0 0 0 / 0.25) 80%, rgb(0 0 0 / 0.45) 100%); }
:root.matte .scrim-t { -webkit-mask-image: linear-gradient(to bottom, #000, transparent); mask-image: linear-gradient(to bottom, #000, transparent); }
:root.matte .scrim-b { -webkit-mask-image: linear-gradient(to bottom, transparent, #000); mask-image: linear-gradient(to bottom, transparent, #000); }
:root.matte .scrim-reel { -webkit-mask-image: linear-gradient(to bottom, rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.6), #000); mask-image: linear-gradient(to bottom, rgb(0 0 0 / 0.4), rgb(0 0 0 / 0.6), #000); }

/* Matte reflects; it does not glow. Light washes go, shadows fall dark. */
:root.matte .aurora { background: none; }
:root.matte .aurora::before, :root.matte .aurora::after { display: none; }
:root.matte .glass-panel {
  background: hsl(var(--card) / 0.55);
  border-color: hsl(var(--glow) / 0.14);
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 18px 40px -26px hsl(var(--matte-shadow) / 0.7);
}
:root.matte .glass-inset { background: hsl(0 0% 100% / 0.03); border-color: hsl(var(--glow) / 0.12); box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.04); }
:root.matte .main-panel { border-color: hsl(var(--glow) / 0.14); box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.04); }
:root.matte .capture-frame {
  border-color: hsl(var(--glow) / 0.16);
  box-shadow: 0 24px 60px -36px hsl(var(--matte-shadow) / 0.85), inset 0 1px 0 hsl(0 0% 100% / 0.05);
}
:root.matte .screen { border-color: hsl(var(--foreground) / 0.12); box-shadow: 0 30px 80px -40px hsl(var(--matte-shadow) / 0.9); }
:root.matte .filmstrip { background: hsl(var(--matte-deep)); }
:root.matte .header-surface { background-color: hsl(var(--background)); -webkit-backdrop-filter: none; backdrop-filter: none; }
`
  writeFileSync('styles/matte.css', css)
  writeFileSync('content/matte.generated.ts', `// GENERATED by scripts/derive-matte.ts — do not edit; re-run the script.
export const MATTE = {
  ready: true,
  source: '${SRC}',
  sha256: '${sha256}',
  surface: '${hex(surface)}',
  grainSigma: ${sd(grain).toFixed(2)},
} as const
`)
  console.log({ W, H, chroma, mean: mean.toFixed(2), base, surface: hex(surface), grainSd: sd(grain).toFixed(2), wholeSd: sd(luma).toFixed(2), tile: `${tw}×${th}`, clipped, canvasTile, surfaceTile: { ...surfaceTile, level: cardLevel.toFixed(1), targetSd: sd(grain).toFixed(2) }, raisedFg, raisedMuted })
  console.log(Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, `${hex(v)}  ${hslTriplet(v)}`])))
  console.log(Object.fromEntries(Object.entries(report).map(([k, v]) => [k, v.toFixed(2)])))
}
main().catch((e) => { console.error(e); process.exit(1) })
