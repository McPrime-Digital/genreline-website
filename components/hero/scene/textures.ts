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

// ── THE CREW'S CLAPPERBOARD ─────────────────────────────────────────────────
//
// The slate the crew marks every take with (the owner, 2026-11-06: behind the Crew's tile, something that
// is "film and movie and crew at the same time"): a chalk slate in an oiled-wood frame, its fields chalked
// in, and the sticks — black and gold — that clap. The tile covers the middle of the slate: the fields sit
// round it. Words on it are the slate's own (its fields) and the studio's name.

/** Chalk: drawn on its own sheet, worn by tiny erasures, then laid on the slate (so the slate stays whole). */
function chalk(W: number, H: number, draw: (g: CanvasRenderingContext2D) => void) {
  const [c, g] = canvas(W, H)
  g.fillStyle = 'rgba(238,234,222,0.92)'
  g.strokeStyle = 'rgba(238,234,222,0.8)'
  draw(g)
  g.globalCompositeOperation = 'destination-out'
  let seed = 9
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
  for (let i = 0; i < 9000; i++) {
    g.globalAlpha = 0.25 + rnd() * 0.5
    g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2.2, 1 + rnd() * 1.4)
  }
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
  return c
}

/** The slate and its two sticks, as textures. */
export async function clapperTextures(anisotropy: number) {
  const W = 1024
  const H = 704
  const label = await displayFont(25, 600)
  const big = await displayFont(84, 800)
  const mid = await displayFont(58, 700)
  const [c, g] = canvas(W, H)
  // the frame: oiled wood, lit from above
  const wood = g.createLinearGradient(0, 0, 0, H)
  wood.addColorStop(0, '#6a4828')
  wood.addColorStop(1, '#2c1b0e')
  g.fillStyle = wood
  g.beginPath()
  g.roundRect(0, 0, W, H, 26)
  g.fill()
  // the slate: black, its chalk dust in soft clouds
  const inset = 22
  g.fillStyle = '#111315'
  g.fillRect(inset, inset, W - inset * 2, H - inset * 2)
  let seed = 3
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
  for (let i = 0; i < 26; i++) {
    const x = inset + rnd() * (W - inset * 2)
    const y = inset + rnd() * (H - inset * 2)
    const r = 40 + rnd() * 160
    const smudge = g.createRadialGradient(x, y, 0, x, y, r)
    smudge.addColorStop(0, 'rgba(220,216,205,0.045)')
    smudge.addColorStop(1, 'rgba(220,216,205,0)')
    g.fillStyle = smudge
    g.fillRect(x - r, y - r, r * 2, r * 2)
  }
  // the light from the lamps above, falling off down the slate
  const light = g.createLinearGradient(0, 0, 0, H)
  light.addColorStop(0, 'rgba(255,214,150,0.08)')
  light.addColorStop(1, 'rgba(0,0,0,0.25)')
  g.fillStyle = light
  g.fillRect(inset, inset, W - inset * 2, H - inset * 2)
  // the fields, chalked in: the tile hides the middle, so they sit round it
  const sheet = chalk(W, H, (k) => {
    k.lineWidth = 4
    const rule = (x0: number, y0: number, x1: number, y1: number) => {
      k.beginPath()
      k.moveTo(x0, y0 + (rnd() - 0.5) * 2)
      k.lineTo(x1, y1 + (rnd() - 0.5) * 2)
      k.stroke()
    }
    rule(inset + 14, 176, W - inset - 14, 176)
    rule(inset + 14, 528, W - inset - 14, 528)
    rule(330, 176, 330, 528)
    rule(694, 176, 694, 528)
    rule(360, 528, 360, H - inset - 14)
    rule(680, 528, 680, H - inset - 14)
    k.textBaseline = 'alphabetic'
    k.font = label.font
    for (const [t, x, y] of [['PROD.', 48, 62], ['ROLL', 48, 214], ['SCENE', 48, 372], ['TAKE', 724, 214], ['SOUND', 724, 372], ['DIRECTOR', 48, 568], ['CAMERA', 390, 568], ['DATE', 710, 568]] as const) {
      k.fillText(t, x, y)
    }
    k.font = big.font
    k.fillText('GENRELINE', 48, 150)
    k.font = mid.font
    for (const [t, x, y] of [['A001', 48, 300], ['1', 48, 458], ['1', 724, 300], ['SYNC', 724, 458], ['1902', 710, 652]] as const) {
      k.fillText(t, x, y)
    }
    // the director's and the camera's names, in a hand too quick to read from here
    k.lineWidth = 5
    for (const [x0, w] of [[48, 270], [390, 260]] as const) {
      k.beginPath()
      let x = x0
      k.moveTo(x, 640)
      while (x < x0 + w) {
        x += 14 + rnd() * 16
        k.quadraticCurveTo(x - 8, 616 + rnd() * 30, x, 640 + (rnd() - 0.5) * 16)
      }
      k.stroke()
    }
  })
  g.drawImage(sheet, 0, 0)
  const board = finish(new CanvasTexture(c), anisotropy)

  // the sticks: black and gold at 45°, the two slanting opposite ways (a chevron when they meet)
  const stick = (flip: boolean) => {
    const SW = 1024
    const SH = 112
    const [sc, sg] = canvas(SW, SH)
    sg.save()
    sg.beginPath()
    sg.roundRect(0, 0, SW, SH, 10)
    sg.clip()
    sg.fillStyle = '#121212'
    sg.fillRect(0, 0, SW, SH)
    const gold = sg.createLinearGradient(0, 0, 0, SH)
    gold.addColorStop(0, '#f1d58f')
    gold.addColorStop(0.5, '#d4ad5c')
    gold.addColorStop(1, '#9c7634')
    sg.fillStyle = gold
    const step = 96
    for (let x = -SH; x < SW + SH; x += step * 2) {
      sg.beginPath()
      if (flip) {
        sg.moveTo(x, 0)
        sg.lineTo(x + step, 0)
        sg.lineTo(x + step - SH, SH)
        sg.lineTo(x - SH, SH)
      } else {
        sg.moveTo(x, 0)
        sg.lineTo(x + step, 0)
        sg.lineTo(x + step + SH, SH)
        sg.lineTo(x + SH, SH)
      }
      sg.fill()
    }
    // its edge catching the light, and its hinge at the left end
    sg.fillStyle = 'rgba(255,240,210,0.35)'
    sg.fillRect(0, 0, SW, 5)
    sg.fillStyle = 'rgba(0,0,0,0.45)'
    sg.fillRect(0, SH - 7, SW, 7)
    sg.restore()
    sg.fillStyle = '#c9ccd1'
    sg.beginPath()
    sg.arc(SH * 0.55, SH / 2, SH * 0.3, 0, Math.PI * 2)
    sg.fill()
    sg.fillStyle = '#6d7076'
    sg.beginPath()
    sg.arc(SH * 0.55, SH / 2, SH * 0.12, 0, Math.PI * 2)
    sg.fill()
    return finish(new CanvasTexture(sc), anisotropy)
  }
  return { board, arm: stick(false), base: stick(true) }
}

// ── THE CLIENT'S HALO ───────────────────────────────────────────────────────

/**
 * THE CLIENT'S TICKET, THE STAKEHOLDERS' PASS — behind the Client station's tile, turning with it (the owner,
 * 2026-11-06: something "very much related to client space or stakeholders space and must change when it
 * changes"): the client is admitted to their own room — a cinema ticket, ADMIT ONE, its stub perforated —
 * and the stakeholders hold a premiere pass, ALL ACCESS, for the departments the portal serves (the
 * In-house segment's words: marketing, legal, the exec office). The tile hides the middle: the words sit
 * either side of it. Both 14.2 × 6.4 (the stub, the last 17%).
 */
export async function ticketTextures(anisotropy: number) {
  const W = 1024
  const H = 462
  const stubX = Math.round(W * 0.83)
  const huge = await displayFont(84, 800)
  const small = await displayFont(24, 700)
  const tiny = await displayFont(19, 700)
  const foil = (g: CanvasRenderingContext2D, y0: number, y1: number) => {
    const f = g.createLinearGradient(0, y0, 0, y1)
    f.addColorStop(0, '#fbe6a8')
    f.addColorStop(0.5, '#d9b162')
    f.addColorStop(1, '#a37a33')
    return f
  }
  const spaced = (g: CanvasRenderingContext2D, text: string, cx: number, y: number, spacing: number) => {
    const widths = [...text].map((ch) => g.measureText(ch).width)
    const total = widths.reduce((a, b) => a + b, 0) + spacing * (text.length - 1)
    let x = cx - total / 2
    ;[...text].forEach((ch, i) => {
      g.fillText(ch, x, y)
      x += widths[i] + spacing
    })
  }
  const notch = (g: CanvasRenderingContext2D) => {
    // the semicircle notches at either end of the perforation, and the perforation itself
    g.save()
    g.globalCompositeOperation = 'destination-out'
    for (const y of [0, H]) {
      g.beginPath()
      g.arc(stubX, y, 22, 0, Math.PI * 2)
      g.fill()
    }
    for (let y = 40; y < H - 30; y += 22) {
      g.beginPath()
      g.arc(stubX, y, 4.2, 0, Math.PI * 2)
      g.fill()
    }
    g.restore()
  }

  // the ticket: deep crimson, gold foil
  const [tc, t] = canvas(W, H)
  const red = t.createLinearGradient(0, 0, W, H)
  red.addColorStop(0, '#8c1a26')
  red.addColorStop(1, '#4a0b13')
  t.fillStyle = red
  t.beginPath()
  t.roundRect(0, 0, W, H, 18)
  t.fill()
  // a fine engraved pattern, as a ticket's security print
  t.strokeStyle = 'rgba(255,210,150,0.07)'
  t.lineWidth = 1
  for (let i = -H; i < W; i += 9) {
    t.beginPath()
    t.moveTo(i, 0)
    t.lineTo(i + H * 0.6, H)
    t.stroke()
  }
  t.strokeStyle = foil(t, 0, H)
  t.lineWidth = 4
  t.strokeRect(20, 20, stubX - 34, H - 40)
  t.lineWidth = 1.5
  t.strokeRect(30, 30, stubX - 54, H - 60)
  t.strokeRect(stubX + 16, 20, W - stubX - 36, H - 40)
  t.fillStyle = foil(t, 150, 330)
  t.font = huge.font
  t.textBaseline = 'middle'
  t.textAlign = 'center'
  t.fillText('ADMIT', W * 0.2, H / 2 + 4)
  t.fillText('ONE', W * 0.728, H / 2 + 4)
  t.font = small.font
  t.fillStyle = foil(t, 60, 100)
  spaced(t, 'GENRELINE', stubX / 2, 78, 9)
  spaced(t, 'NO 001939', stubX / 2, H - 76, 6)
  // the stub: ADMIT ONE up its length, and its number
  t.save()
  t.translate(stubX + (W - stubX) / 2, H / 2)
  t.rotate(-Math.PI / 2)
  t.font = small.font
  t.fillStyle = foil(t, -40, 40)
  spaced(t, 'ADMIT ONE', 0, -22, 7)
  t.font = tiny.font
  spaced(t, 'NO 001939', 0, 26, 5)
  t.restore()
  notch(t)

  // the pass: black, a holographic strip, gold foil
  const [pc, pg] = canvas(W, H)
  pg.fillStyle = '#0d0d12'
  pg.beginPath()
  pg.roundRect(0, 0, W, H, 18)
  pg.fill()
  const holo = pg.createLinearGradient(0, 0, W, 0)
  ;['#ff6ec7', '#7ee8fa', '#c3f584', '#ffd36e', '#b38bff', '#7ee8fa'].forEach((c, i, a) => holo.addColorStop(i / (a.length - 1), c))
  pg.globalAlpha = 0.55
  pg.fillStyle = holo
  pg.fillRect(0, 34, W, 22)
  pg.globalAlpha = 1
  pg.strokeStyle = foil(pg, 0, H)
  pg.lineWidth = 3
  pg.strokeRect(20, 20, W - 40, H - 40)
  // its lanyard slot
  pg.save()
  pg.globalCompositeOperation = 'destination-out'
  pg.beginPath()
  pg.roundRect(W / 2 - 60, 74, 120, 18, 9)
  pg.fill()
  pg.restore()
  pg.fillStyle = foil(pg, 150, 330)
  pg.font = huge.font
  pg.textBaseline = 'middle'
  pg.textAlign = 'center'
  pg.fillText('ALL', W * 0.2, H / 2 + 4)
  pg.fillText('ACCESS', W * 0.8, H / 2 + 4)
  pg.font = small.font
  pg.fillStyle = foil(pg, 100, 140)
  spaced(pg, 'PREMIERE', W / 2, 122, 10)
  pg.font = tiny.font
  pg.fillStyle = 'rgba(232,214,170,0.85)'
  spaced(pg, 'MARKETING · LEGAL · THE EXEC OFFICE', W / 2, H - 70, 4)

  return { ticket: finish(new CanvasTexture(tc), anisotropy), pass: finish(new CanvasTexture(pc), anisotropy) }
}

// ── THE SUITE'S LENS ────────────────────────────────────────────────────────



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
