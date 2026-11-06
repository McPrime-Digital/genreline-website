/**
 * Everything the scene paints with: the theme's colours (read from the site's
 * CSS variables), the logo's tiles, the soft glow, the labels under the
 * screens, the Suite's tool chips — and, behind ONE function,
 * getScreenTexture(id), what each screen shows.
 */
import { CanvasTexture, Color, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Texture, VideoTexture } from 'three'

// ── THE THEME ───────────────────────────────────────────────────────────────

export type HeroTheme = {
  dark: boolean
  /** --background: the clear colour. */
  background: Color
  /** --primary: the brand gold. */
  primary: Color
  /** The line's core: the gold in Dark; a step deeper on Light's white canvas. */
  core: Color
  /** The glow: a lighter gold in Dark; the gold itself on Light. */
  glow: Color
  /** The hottest light on the line (its pulses). */
  hot: Color
  /** A screen's glass before its picture arrives. */
  glass: Color
  /** --foreground. */
  ink: Color
  /** CSS strings for the canvases. */
  css: { background: string; goldTop: string; goldBottom: string; gold: string; ink: string; muted: string; glass: string; edge: string }
}

/** "42 55% 55%" (the tokens' HSL triplet) → [h, s, l] in 0–1. */
function triplet(name: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const [h, s, l] = raw.split(/[\s,]+/).map((v) => parseFloat(v))
  return [(h || 0) / 360, (s || 0) / 100, (l || 0) / 100]
}
const hslCss = ([h, s, l]: [number, number, number], a = 1) =>
  `hsl(${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%${a < 1 ? ` / ${a}` : ''})`
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const make = ([h, s, l]: [number, number, number]) => new Color().setHSL(h, s, l, SRGBColorSpace)
/** A colour from CSS-style HSL numbers (three's own parser wants commas, so the scene never hands it a string). */
export const hsl = (h: number, s: number, l: number) => new Color().setHSL(h / 360, s / 100, l / 100, SRGBColorSpace)

export function readTheme(): HeroTheme {
  const dark = document.documentElement.classList.contains('dark')
  const bg = triplet('--background')
  const gold = triplet('--primary')
  const fg = triplet('--foreground')
  const muted = triplet('--muted-foreground')
  const coreHsl: [number, number, number] = dark ? gold : [gold[0], gold[1], clamp01(gold[2] - 0.08)]
  const glowHsl: [number, number, number] = dark ? [gold[0], clamp01(gold[1] + 0.1), clamp01(gold[2] + 0.12)] : gold
  const hotHsl: [number, number, number] = dark ? [gold[0], 0.72, 0.8] : [gold[0], clamp01(gold[1] + 0.1), clamp01(gold[2] - 0.02)]
  const glassHsl: [number, number, number] = dark ? [bg[0], clamp01(bg[1] + 0.05), clamp01(bg[2] + 0.07)] : [bg[0], bg[1], clamp01(bg[2] - 0.05)]
  return {
    dark,
    background: make(bg),
    primary: make(gold),
    core: make(coreHsl),
    glow: make(glowHsl),
    hot: make(hotHsl),
    glass: make(glassHsl),
    ink: make(fg),
    css: {
      background: hslCss(bg),
      goldTop: hslCss([gold[0], gold[1], clamp01(gold[2] + 0.1)]),
      goldBottom: hslCss([gold[0], gold[1], clamp01(gold[2] - 0.07)]),
      gold: hslCss(coreHsl),
      ink: hslCss(fg),
      muted: hslCss(muted),
      glass: hslCss(glassHsl, dark ? 0.72 : 0.82),
      edge: hslCss(gold, dark ? 0.35 : 0.45),
    },
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

function finish<T extends Texture>(t: T, anisotropy: number): T {
  t.colorSpace = SRGBColorSpace
  t.anisotropy = anisotropy
  t.minFilter = LinearMipmapLinearFilter
  t.magFilter = LinearFilter
  t.generateMipmaps = true
  t.needsUpdate = true
  return t
}

// ── THE GLOW ────────────────────────────────────────────────────────────────

/** A soft round light for the tiles' glows and the rings' beads. */
export function softTexture() {
  const [c, g] = canvas(128, 128)
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,240,200,1)')
  grd.addColorStop(0.22, 'rgba(227,196,122,.55)')
  grd.addColorStop(0.55, 'rgba(227,196,122,.12)')
  grd.addColorStop(1, 'rgba(227,196,122,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// ── THE FAR WORLDS ──────────────────────────────────────────────────────────
//
// Very far off, behind everything, faint as a matte painting (the owner, 2026-11-06: "distant milkyway
// planets in a very distant with film related things around it"): a planet whose ring is a strip of
// 35 mm film, its moon a film reel, and a small cool planet beyond. Drawn once, on canvases.

/** A planet lit from the upper left: its night side falls into the sky, its rim keeps a thread of light. */
function drawPlanet(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, day: string, night: string, rim: string) {
  const body = g.createRadialGradient(cx - r * 0.45, cy - r * 0.5, r * 0.05, cx, cy, r)
  body.addColorStop(0, day)
  body.addColorStop(0.55, night)
  body.addColorStop(1, 'rgba(4,5,12,1)')
  g.fillStyle = body
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  // bands of weather, faint
  g.save()
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.clip()
  g.globalAlpha = 0.12
  for (let i = -4; i <= 4; i++) {
    g.fillStyle = i % 2 ? 'rgba(255,230,190,1)' : 'rgba(0,0,0,1)'
    g.fillRect(cx - r, cy + i * r * 0.2 - r * 0.04, r * 2, r * 0.07)
  }
  g.restore()
  // the terminator's rim light
  g.strokeStyle = rim
  g.lineWidth = r * 0.03
  g.beginPath()
  g.arc(cx, cy, r * 0.985, Math.PI * 0.85, Math.PI * 1.6)
  g.stroke()
}

/** The ringed planet: its ring a strip of film — perforations along both edges, frames between them. */
export function filmPlanetTexture() {
  const W = 1024
  const H = 640
  const [c, g] = canvas(W, H)
  const cx = W / 2
  const cy = H / 2
  const r = 140
  const tilt = 0.34
  const ring = (front: boolean) => {
    g.save()
    g.translate(cx, cy)
    g.rotate(-0.22)
    g.scale(1, tilt)
    const R0 = 268
    const R1 = 396
    const from = front ? 0 : Math.PI
    const to = front ? Math.PI : Math.PI * 2
    // the film: a dark strip (the back half fainter, behind the planet)
    g.globalAlpha = front ? 1 : 0.55
    g.beginPath()
    g.arc(0, 0, R1, from, to)
    g.arc(0, 0, R0, to, from, true)
    g.closePath()
    g.fillStyle = 'rgba(34,24,16,0.9)'
    g.fill()
    // the picture area between the perforations, warmer, and its frame lines
    g.beginPath()
    g.arc(0, 0, R1 - 30, from, to)
    g.arc(0, 0, R0 + 30, to, from, true)
    g.closePath()
    g.fillStyle = 'rgba(120,80,40,0.55)'
    g.fill()
    const n = 56
    for (let i = 0; i < n; i++) {
      const a = from + ((i + 0.5) / n) * (to - from)
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      // the perforations, lit as if a projector's lamp shone through them
      for (const R of [R0 + 15, R1 - 15]) {
        g.save()
        g.translate(ca * R, sa * R)
        g.rotate(a + Math.PI / 2)
        g.fillStyle = 'rgba(255,214,150,0.85)'
        g.beginPath()
        g.roundRect(-8, -6, 16, 12, 3)
        g.fill()
        g.restore()
      }
      if (i % 3 === 0) {
        const b = from + (i / n) * (to - from)
        g.strokeStyle = 'rgba(20,12,6,0.85)'
        g.lineWidth = 3
        g.beginPath()
        g.moveTo(Math.cos(b) * (R0 + 30), Math.sin(b) * (R0 + 30))
        g.lineTo(Math.cos(b) * (R1 - 30), Math.sin(b) * (R1 - 30))
        g.stroke()
      }
    }
    // a thread of light along its outer edge
    g.strokeStyle = 'rgba(255,214,150,0.6)'
    g.lineWidth = 3
    g.beginPath()
    g.arc(0, 0, R1, from, to)
    g.stroke()
    g.restore()
  }
  ring(false)
  drawPlanet(g, cx, cy, r, 'rgba(196,150,108,1)', 'rgba(52,38,64,1)', 'rgba(255,220,170,0.55)')
  ring(true)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** A film reel, its moon: the rim, five windows round the hub. */
export function reelTexture() {
  const [c, g] = canvas(256, 256)
  const cx = 128
  const r = 118
  const grd = g.createRadialGradient(cx - 40, cx - 46, 8, cx, cx, r)
  grd.addColorStop(0, 'rgba(226,220,206,1)')
  grd.addColorStop(1, 'rgba(92,90,98,1)')
  g.fillStyle = grd
  g.beginPath()
  g.arc(cx, cx, r, 0, Math.PI * 2)
  g.fill()
  g.globalCompositeOperation = 'destination-out'
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    g.beginPath()
    g.arc(cx + Math.cos(a) * r * 0.55, cx + Math.sin(a) * r * 0.55, r * 0.26, 0, Math.PI * 2)
    g.fill()
  }
  g.beginPath()
  g.arc(cx, cx, r * 0.1, 0, Math.PI * 2)
  g.fill()
  g.globalCompositeOperation = 'source-over'
  g.strokeStyle = 'rgba(255,240,215,0.6)'
  g.lineWidth = 3
  g.beginPath()
  g.arc(cx, cx, r - 2, Math.PI * 0.95, Math.PI * 1.55)
  g.stroke()
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** A small cool planet, beyond. */
export function farPlanetTexture() {
  const [c, g] = canvas(256, 256)
  drawPlanet(g, 128, 128, 112, 'rgba(150,182,214,1)', 'rgba(28,40,70,1)', 'rgba(200,225,255,0.5)')
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// ── THE CREW'S REEL ─────────────────────────────────────────────────────────

/**
 * A 35 mm reel in gold, behind the Crew's tile (in place of the rings that read as science — the owner,
 * 2026-11-06): its flange with six windows round the hub, the spokes between them, a bright rim. The
 * tile covers the hub; what shows round it is the reel turning.
 */
export function crewReelTexture(theme: HeroTheme) {
  const S = 1024
  const [c, g] = canvas(S, S)
  const m = S / 2
  const R = S * 0.47
  // the flange: brushed gold, translucent
  const plate = g.createRadialGradient(m - R * 0.3, m - R * 0.35, R * 0.1, m, m, R)
  plate.addColorStop(0, theme.css.goldTop)
  plate.addColorStop(1, theme.css.goldBottom)
  g.globalAlpha = 0.16
  g.fillStyle = plate
  g.beginPath()
  g.arc(m, m, R, 0, Math.PI * 2)
  g.fill()
  g.globalAlpha = 1
  // the windows, cut through
  const windows = (draw: () => void) => {
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI * 2 + 0.16
      const a1 = a0 + (Math.PI * 2) / 6 - 0.32
      g.beginPath()
      g.arc(m, m, R * 0.86, a0, a1)
      g.arc(m, m, R * 0.36, a1, a0, true)
      g.closePath()
      draw()
    }
  }
  g.globalCompositeOperation = 'destination-out'
  windows(() => g.fill())
  g.globalCompositeOperation = 'source-over'
  // their edges, the rim, the hub: lines of light
  g.strokeStyle = theme.css.goldTop
  g.lineWidth = 3
  windows(() => g.stroke())
  g.lineWidth = 6
  g.beginPath()
  g.arc(m, m, R - 3, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = 2
  g.globalAlpha = 0.6
  g.beginPath()
  g.arc(m, m, R * 0.93, 0, Math.PI * 2)
  g.stroke()
  // the rim's knurling: fine ticks round the edge, the way a reel's flange is pressed
  g.globalAlpha = 0.5
  g.lineWidth = 2
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2
    g.beginPath()
    g.moveTo(m + Math.cos(a) * R * 0.94, m + Math.sin(a) * R * 0.94)
    g.lineTo(m + Math.cos(a) * R * 0.975, m + Math.sin(a) * R * 0.975)
    g.stroke()
  }
  g.globalAlpha = 1
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// ── THE CLIENT'S HALO ───────────────────────────────────────────────────────

/**
 * An art-deco sunburst in gold, round the Client's tile (in place of the rings): fine rays between two
 * stepped circles, a diamond at each quarter — the ornament of a picture palace's ceiling.
 */
export function decoHaloTexture(theme: HeroTheme) {
  const S = 1024
  const [c, g] = canvas(S, S)
  const m = S / 2
  g.strokeStyle = theme.css.goldTop
  g.fillStyle = theme.css.goldTop
  // the rays, long and short in turn
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2
    const long = i % 2 === 0
    g.globalAlpha = long ? 0.75 : 0.4
    g.lineWidth = long ? 3 : 2
    g.beginPath()
    g.moveTo(m + Math.cos(a) * S * 0.3, m + Math.sin(a) * S * 0.3)
    g.lineTo(m + Math.cos(a) * S * (long ? 0.46 : 0.41), m + Math.sin(a) * S * (long ? 0.46 : 0.41))
    g.stroke()
  }
  // the stepped circles
  g.globalAlpha = 0.9
  for (const [r, w] of [[0.29, 4], [0.275, 1.5], [0.47, 3], [0.485, 1.5]] as const) {
    g.lineWidth = w
    g.beginPath()
    g.arc(m, m, S * r, 0, Math.PI * 2)
    g.stroke()
  }
  // a diamond at each quarter
  g.globalAlpha = 1
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const x = m + Math.cos(a) * S * 0.47
    const y = m + Math.sin(a) * S * 0.47
    g.beginPath()
    g.moveTo(x, y - 18)
    g.lineTo(x + 12, y)
    g.lineTo(x, y + 18)
    g.lineTo(x - 12, y)
    g.closePath()
    g.fill()
  }
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// ── THE SUITE'S LENS ────────────────────────────────────────────────────────

/**
 * A cine lens's focus ring, seen face on: the distance scale engraved round it (feet, ∞ to 3), fine ticks
 * between, and the witness mark the focus puller reads. It turns back and forth round the iris — a focus
 * pull — so the numbers pass the mark.
 */
export function focusRingTexture(theme: HeroTheme) {
  const S = 1024
  const [c, g] = canvas(S, S)
  const m = S / 2
  const R0 = S * 0.4
  const R1 = S * 0.49
  // the ring itself: a dark band with a bright edge either side
  g.fillStyle = 'rgba(12,12,18,0.55)'
  g.beginPath()
  g.arc(m, m, R1, 0, Math.PI * 2)
  g.arc(m, m, R0, 0, Math.PI * 2, true)
  g.fill()
  g.strokeStyle = theme.css.goldTop
  for (const [r, w, a] of [[R0, 2.5, 0.8], [R1 - 2, 3, 0.9]] as const) {
    g.globalAlpha = a
    g.lineWidth = w
    g.beginPath()
    g.arc(m, m, r, 0, Math.PI * 2)
    g.stroke()
  }
  // the scale: ticks all round, longer at each engraved distance
  const marks = ['∞', '30', '15', '10', '7', '5', '4', '3']
  const span = Math.PI * 1.25
  const start = -Math.PI / 2 - span / 2
  g.globalAlpha = 0.75
  g.lineWidth = 2
  for (let i = 0; i <= 56; i++) {
    const a = start + (i / 56) * span
    const long = i % 8 === 0
    g.beginPath()
    g.moveTo(m + Math.cos(a) * (R1 - 8), m + Math.sin(a) * (R1 - 8))
    g.lineTo(m + Math.cos(a) * (R1 - (long ? 26 : 16)), m + Math.sin(a) * (R1 - (long ? 26 : 16)))
    g.stroke()
  }
  g.globalAlpha = 0.9
  g.fillStyle = theme.css.goldTop
  g.font = `600 ${Math.round(S * 0.03)}px ${getComputedStyle(document.body).getPropertyValue('--font-display').trim() || 'ui-sans-serif, system-ui, sans-serif'}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  marks.forEach((t, i) => {
    const a = start + (i / (marks.length - 1)) * span
    const rr = (R0 + R1) / 2 - 6
    g.save()
    g.translate(m + Math.cos(a) * rr, m + Math.sin(a) * rr)
    g.rotate(a + Math.PI / 2)
    g.fillText(t, 0, 0)
    g.restore()
  })
  g.globalAlpha = 1
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** An anamorphic flare: a long, thin horizontal streak, blue-white at its heart. */
export function anamorphicTexture() {
  const [c, g] = canvas(1024, 64)
  const v = g.createLinearGradient(0, 0, 0, 64)
  v.addColorStop(0, 'rgba(120,170,255,0)')
  v.addColorStop(0.5, 'rgba(190,220,255,1)')
  v.addColorStop(1, 'rgba(120,170,255,0)')
  g.fillStyle = v
  g.fillRect(0, 0, 1024, 64)
  g.globalCompositeOperation = 'destination-in'
  const h = g.createLinearGradient(0, 0, 1024, 0)
  h.addColorStop(0, 'rgba(0,0,0,0)')
  h.addColorStop(0.35, 'rgba(0,0,0,0.5)')
  h.addColorStop(0.5, 'rgba(0,0,0,1)')
  h.addColorStop(0.65, 'rgba(0,0,0,0.5)')
  h.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = h
  g.fillRect(0, 0, 1024, 64)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// ── THE TILES: THE LOGO'S GLYPHS ────────────────────────────────────────────
//
// Drawn as vectors at 512 px so a tile stays sharp in a close shot. Every
// proportion is measured from the logo (public/brand/genreline-mark-gold.png),
// as a fraction of the tile's width:
//  · the tile is a squircle (superellipse, exponent ≈ 3.45);
//  · Crew and Suite are rings 0.166 thick (the opening is 0.668 wide), Client is solid;
//  · Crew: three dots r 0.064 at (0, −0.126), (∓0.15, −0.043) over a bar 0.444 × 0.137 at y +0.112;
//  · Client: a head r 0.093 at y −0.115 over a body 0.357 × 0.184 at y +0.124, cut out of the gold;
//  · Suite: four rounded squares 0.137 wide at (±0.096, ±0.096).
// The Stakeholders face has no tile in the logo; it is drawn in Client's
// family — the solid tile, Client's figure — with the seal of an approval
// beside the figure: the people a portal per department asks to approve.

export type TileKind = 'crew' | 'client' | 'suite' | 'stakeholders'

function squircle(g: CanvasRenderingContext2D, cx: number, cy: number, half: number, n: number) {
  g.beginPath()
  const steps = 160
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    const x = cx + half * Math.sign(c) * Math.abs(c) ** (2 / n)
    const y = cy + half * Math.sign(s) * Math.abs(s) ** (2 / n)
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.closePath()
}
function pill(g: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, r = h / 2) {
  g.beginPath()
  g.roundRect(cx - w / 2, cy - h / 2, w, h, r)
}

export function tileTexture(kind: TileKind, theme: HeroTheme, anisotropy: number) {
  const SIZE = 512
  const [c, g] = canvas(SIZE, SIZE)
  const S = 452
  const cx = SIZE / 2
  const cy = SIZE / 2
  const gold = g.createLinearGradient(0, cy - S / 2, 0, cy + S / 2)
  gold.addColorStop(0, theme.css.goldTop)
  gold.addColorStop(1, theme.css.goldBottom)

  squircle(g, cx, cy, S / 2, 3.45)
  g.fillStyle = gold
  g.fill()

  const ink = theme.css.background
  if (kind === 'client' || kind === 'stakeholders') {
    g.fillStyle = ink
    const figure = (dx: number, k: number) => {
      g.beginPath()
      g.arc(cx + dx * S, cy - 0.115 * S * k, 0.093 * S * k, 0, Math.PI * 2)
      g.fill()
      pill(g, cx + dx * S, cy + 0.124 * S * k, 0.357 * S * k, 0.184 * S * k)
      g.fill()
    }
    if (kind === 'client') figure(0, 1)
    else {
      // a stakeholder: Client's figure, and the seal of an approval beside it
      figure(-0.075, 0.9)
      const bx = cx + 0.175 * S
      const by = cy + 0.15 * S
      g.beginPath()
      g.arc(bx, by, 0.125 * S, 0, Math.PI * 2)
      g.fill()
      g.strokeStyle = gold
      g.lineWidth = 0.034 * S
      g.lineCap = 'round'
      g.lineJoin = 'round'
      g.beginPath()
      g.moveTo(bx - 0.055 * S, by + 0.002 * S)
      g.lineTo(bx - 0.012 * S, by + 0.045 * S)
      g.lineTo(bx + 0.06 * S, by - 0.042 * S)
      g.stroke()
    }
  } else {
    squircle(g, cx, cy, (0.668 * S) / 2, 3.1)
    g.fillStyle = ink
    g.fill()
    g.fillStyle = gold
    if (kind === 'crew') {
      for (const [dx, dy] of [[0, -0.126], [-0.15, -0.043], [0.15, -0.043]]) {
        g.beginPath()
        g.arc(cx + dx * S, cy + dy * S, 0.064 * S, 0, Math.PI * 2)
        g.fill()
      }
      pill(g, cx, cy + 0.112 * S, 0.444 * S, 0.137 * S)
      g.fill()
    } else {
      const q = 0.137 * S
      for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.beginPath()
        g.roundRect(cx + dx * 0.096 * S - q / 2, cy + dy * 0.096 * S - q / 2, q, q, 0.035 * S)
        g.fill()
      }
    }
  }
  return finish(new CanvasTexture(c), anisotropy)
}

// ── ICONS, LABELS AND CHIPS ─────────────────────────────────────────────────

/** A lucide icon (its SVG, handed over by the server), drawn in a colour at a size. */
async function iconImage(svg: string | undefined, color: string, px: number): Promise<HTMLImageElement | null> {
  if (!svg) return null
  const coloured = svg
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/width="24"/, `width="${px}"`)
    .replace(/height="24"/, `height="${px}"`)
  const url = URL.createObjectURL(new Blob([coloured], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** The site's display face (Schibsted Grotesk), loaded before any label is drawn with it. */
async function displayFont(px: number, weight = 600) {
  const family = getComputedStyle(document.body).getPropertyValue('--font-display').trim() || 'ui-sans-serif, system-ui, sans-serif'
  const font = `${weight} ${px}px ${family}`
  try {
    await document.fonts.load(font)
  } catch {}
  return { font, family }
}

/**
 * A screen's label: the feature's icon on a small gold-edged chip, and its
 * words in the site's display face. Sized to the strip under the screen.
 */
export async function labelTexture(text: string, svg: string | undefined, theme: HeroTheme, aspect: number, anisotropy: number) {
  const W = 1024
  const H = Math.round(W / aspect)
  const [c, g] = canvas(W, H)
  const chip = Math.round(H * 0.62)
  const top = Math.round(H * 0.3)
  // the chip
  g.beginPath()
  g.roundRect(4, top, chip, chip, chip * 0.28)
  g.fillStyle = theme.css.glass
  g.fill()
  g.lineWidth = 2.5
  g.strokeStyle = theme.css.edge
  g.stroke()
  const icon = await iconImage(svg, theme.css.gold, Math.round(chip * 0.56))
  if (icon) g.drawImage(icon, 4 + (chip - icon.width) / 2, top + (chip - icon.height) / 2)
  // the words
  let px = Math.round(H * 0.34)
  const { family } = await displayFont(px)
  const room = W - chip - 40
  g.font = `600 ${px}px ${family}`
  while (g.measureText(text).width > room && px > 18) {
    px -= 1
    g.font = `600 ${px}px ${family}`
  }
  g.fillStyle = theme.css.ink
  g.textBaseline = 'middle'
  if (theme.dark) {
    g.shadowColor = 'rgba(0,0,0,.6)'
    g.shadowBlur = 12
  }
  g.fillText(text, chip + 26, top + chip / 2 + 1)
  return finish(new CanvasTexture(c), anisotropy)
}

/** A Suite tool's chip: its icon in gold on a small tile of glass. */
export async function chipTexture(svg: string | undefined, theme: HeroTheme, anisotropy: number) {
  const S = 256
  const [c, g] = canvas(S, S)
  squircle(g, S / 2, S / 2, S / 2 - 6, 3.2)
  g.fillStyle = theme.css.glass
  g.fill()
  g.lineWidth = 4
  g.strokeStyle = theme.css.edge
  g.stroke()
  const icon = await iconImage(svg, theme.css.gold, 120)
  if (icon) g.drawImage(icon, (S - icon.width) / 2, (S - icon.height) / 2)
  return finish(new CanvasTexture(c), anisotropy)
}

// ── THE SCREENS ─────────────────────────────────────────────────────────────

/** What a screen can show, resolved on the server: its capture in each theme (and its size), and footage if the owner has added it. */
export type ScreenSource = { light: string | null; dark: string | null; video: string | null; width: number; height: number }
/** Everything the scene needs from the server: each screen's pictures, and the drawings of its icons. */
export type HeroSources = { screens: Record<string, ScreenSource>; icons: Record<string, string> }

const videos = new Set<HTMLVideoElement>()
/** Footage stops under reduced motion (nothing moves on its own). */
export function setFootagePlaying(on: boolean) {
  for (const v of videos) {
    if (on) v.play().catch(() => {})
    else v.pause()
  }
}

/**
 * THE ONE PLACE A SCREEN'S PICTURE COMES FROM. The scene asks for a screen by
 * its capture's id and gets the picture when it is ready (until then the
 * screen shows its skeleton): the owner's footage if
 * `public/media/hero-<id>.mp4` exists, otherwise the product capture in the
 * visitor's theme, no wider than the screen can show. Swapping what a screen
 * shows is a change to this function only, never to the scene.
 */
export function getScreenTexture(id: string, dark: boolean, sources: HeroSources, anisotropy: number, maxWidth: number, playing: boolean): Promise<Texture | null> {
  const src = sources.screens[id]
  return new Promise((resolve) => {
    if (!src) return resolve(null)
    if (src.video) {
      const v = document.createElement('video')
      v.muted = true
      v.loop = true
      v.playsInline = true
      v.preload = 'auto'
      v.src = src.video
      v.addEventListener('loadeddata', () => {
        videos.add(v)
        if (playing) v.play().catch(() => {})
        const t = new VideoTexture(v)
        t.colorSpace = SRGBColorSpace
        resolve(t)
      }, { once: true })
      v.addEventListener('error', () => resolve(null), { once: true })
      return
    }
    const url = dark ? src.dark ?? src.light : src.light ?? src.dark
    if (!url) return resolve(null)
    const want = Math.min(src.width || maxWidth, maxWidth)
    const tall = Math.round((want * (src.height || 1616)) / (src.width || 2248))
    // Decoded and resized off the main thread where the browser can (createImageBitmap), so a
    // picture arriving mid-journey never stalls a frame; drawn through a canvas where it cannot.
    fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => createImageBitmap(blob, { resizeWidth: want, resizeHeight: tall, resizeQuality: 'high', imageOrientation: 'flipY' }))
      .then((bitmap) => {
        const t = finish(new Texture(bitmap as unknown as HTMLImageElement), anisotropy)
        t.flipY = false // already flipped while decoding
        resolve(t)
      })
      .catch(() => {
        const img = new Image()
        img.decoding = 'async'
        img.src = url
        img
          .decode()
          .then(() => {
            const [c, g] = canvas(want, tall)
            g.imageSmoothingQuality = 'high'
            g.drawImage(img, 0, 0, c.width, c.height)
            resolve(finish(new CanvasTexture(c), anisotropy))
          })
          .catch(() => resolve(null))
      })
  })
}

// ── UPLOADS, ONE A FRAME ────────────────────────────────────────────────────
//
// Handing a picture to the GPU (and building its mipmaps) takes a slice of a
// frame — on some GPUs a large one. The scene's pictures queue here and the
// Uploader (HeroScene) hands over one a frame, so no frame carries more than
// one; the governor ignores the frames they touch.

type Upload = { texture: Texture; done: () => void }
export const uploads = { queue: [] as Upload[], wake: () => {} }

/** Resolves once `texture` is on the GPU (or at once if there is none). */
export function uploadSoon(texture: Texture | null): Promise<void> {
  if (!texture) return Promise.resolve()
  return new Promise((done) => {
    uploads.queue.push({ texture, done })
    uploads.wake()
  })
}

/** Stop and forget any footage (the scene is going away). */
export function releaseFootage() {
  for (const v of videos) {
    v.pause()
    v.removeAttribute('src')
    v.load()
  }
  videos.clear()
}
