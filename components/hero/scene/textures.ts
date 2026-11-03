/**
 * Everything the scene paints with: the theme's colours (read from the site's
 * CSS variables), the logo's three tiles, the soft glow, the glass sheen, and
 * — behind ONE function, getScreenTexture(slot) — what each screen shows.
 */
import { CanvasTexture, Color, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace, Texture, VideoTexture } from 'three'
import type { HeroNodeId } from '@/content/home'

// ── THE THEME ───────────────────────────────────────────────────────────────

export type HeroTheme = {
  dark: boolean
  /** --background: the clear colour and the fog. */
  background: Color
  /** --primary: the brand gold. */
  primary: Color
  /** The line's core: the gold in Dark; a step deeper on Light's white canvas. */
  core: Color
  /** The glow around the line: a lighter gold in Dark; the gold itself on Light. */
  glow: Color
  /** CSS strings of the same, for the canvases below. */
  css: { background: string; goldTop: string; goldBottom: string }
}

/** "42 55% 55%" (the tokens' HSL triplet) → [h, s, l] in 0–1. */
function triplet(name: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const [h, s, l] = raw.split(/[\s,]+/).map((v) => parseFloat(v))
  return [(h || 0) / 360, (s || 0) / 100, (l || 0) / 100]
}
const hslCss = ([h, s, l]: [number, number, number]) => `hsl(${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%)`
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function readTheme(): HeroTheme {
  const dark = document.documentElement.classList.contains('dark')
  const bg = triplet('--background')
  const gold = triplet('--primary')
  const make = ([h, s, l]: [number, number, number]) => new Color().setHSL(h, s, l, SRGBColorSpace)
  const coreHsl: [number, number, number] = dark ? gold : [gold[0], gold[1], clamp01(gold[2] - 0.08)]
  const glowHsl: [number, number, number] = dark ? [gold[0], clamp01(gold[1] + 0.1), clamp01(gold[2] + 0.12)] : gold
  return {
    dark,
    background: make(bg),
    primary: make(gold),
    core: make(coreHsl),
    glow: make(glowHsl),
    css: {
      background: hslCss(bg),
      goldTop: hslCss([gold[0], gold[1], clamp01(gold[2] + 0.1)]),
      goldBottom: hslCss([gold[0], gold[1], clamp01(gold[2] - 0.07)]),
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

/** A soft round light for the node glows and the travelling playhead (the prototype's stops). */
export function softTexture() {
  const [c, g] = canvas(128, 128)
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,240,200,1)')
  grd.addColorStop(0.25, 'rgba(227,196,122,.65)')
  grd.addColorStop(1, 'rgba(227,196,122,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

/** The glass sheen: one soft diagonal band of light, swept across a screen by moving the texture's offset. */
export function sheenTexture() {
  const [c, g] = canvas(512, 256)
  const grd = g.createLinearGradient(0, 0, 512, 0)
  grd.addColorStop(0, 'rgba(255,255,255,0)')
  grd.addColorStop(0.42, 'rgba(255,255,255,0)')
  grd.addColorStop(0.5, 'rgba(255,255,255,1)')
  grd.addColorStop(0.58, 'rgba(255,255,255,0)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.setTransform(1, 0, -0.45, 1, 58, 0) // lean the band
  g.fillStyle = grd
  g.fillRect(-64, 0, 640, 256)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  return t
}

// ── THE NODES: THE LOGO'S THREE TILES ───────────────────────────────────────
//
// Drawn as vectors at 512 px so a node stays sharp in a close shot. Every
// proportion is measured from the logo (public/brand/genreline-mark-gold.png
// and genreline-white-gold-1024.png), as a fraction of the tile's width:
//  · the tile is a squircle (superellipse, exponent ≈ 3.45);
//  · Crew and Suite are rings 0.166 thick (the opening is 0.668 wide), Client is solid;
//  · Crew (left): three dots r 0.064 at (0, −0.126), (∓0.15, −0.043) over a bar 0.444 × 0.137 at y +0.112;
//  · Client (top): a head r 0.093 at y −0.115 over a body 0.357 × 0.184 at y +0.124, cut out of the gold;
//  · Suite (right): four rounded squares 0.137 wide at (±0.096, ±0.096).
// The canvas is the canvas colour wherever the logo has none, so a tile reads
// as the logo does on its own tile.

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

export function nodeTexture(kind: HeroNodeId, theme: HeroTheme, anisotropy: number) {
  const SIZE = 512
  const [c, g] = canvas(SIZE, SIZE)
  const S = 452 // the tile's width on the canvas (room left for antialiasing)
  const cx = SIZE / 2
  const cy = SIZE / 2
  const gold = g.createLinearGradient(0, cy - S / 2, 0, cy + S / 2)
  gold.addColorStop(0, theme.css.goldTop)
  gold.addColorStop(1, theme.css.goldBottom)

  squircle(g, cx, cy, S / 2, 3.45)
  g.fillStyle = gold
  g.fill()

  const ink = theme.css.background
  if (kind === 'client') {
    // the person, cut out of the solid tile
    g.fillStyle = ink
    g.beginPath()
    g.arc(cx, cy - 0.115 * S, 0.093 * S, 0, Math.PI * 2)
    g.fill()
    pill(g, cx, cy + 0.124 * S, 0.357 * S, 0.184 * S)
    g.fill()
  } else {
    // the ring's opening, then the glyph in gold
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

// ── THE SCREENS ─────────────────────────────────────────────────────────────

export type ScreenSlot = HeroNodeId
/** What a slot can show, resolved on the server: the space's capture in each theme, and footage if the owner has added it. */
export type ScreenSource = { light: string | null; dark: string | null; video: string | null }
export type ScreenSources = Record<ScreenSlot, ScreenSource>

/**
 * The procedural placeholder frame (the prototype's three looks: a tungsten
 * set, a room, a monitor). It shows only until the real picture has loaded,
 * or if it cannot load.
 */
function placeholderFrame(slot: ScreenSlot) {
  const W = 768
  const H = 552
  const [c, g] = canvas(W, H)
  const look = { crew: 'tungsten', client: 'room', suite: 'monitor' }[slot]
  const palette = {
    tungsten: { top: '#2A160A', bottom: '#0A080E', lights: ['255,170,80', '255,210,140', '255,140,60'] },
    room: { top: '#1A1626', bottom: '#08080F', lights: ['200,170,255', '255,200,140', '120,160,255'] },
    monitor: { top: '#0A1530', bottom: '#06060E', lights: ['90,150,255', '150,200,255', '255,190,120'] },
  }[look]!
  let seed = { crew: 3, client: 7, suite: 11 }[slot]
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, palette.top)
  bg.addColorStop(1, palette.bottom)
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  for (let i = 0; i < 28; i++) {
    const x = rnd() * W
    const y = rnd() * H * 0.74
    const r = (6 + rnd() * 16) * 2
    const col = palette.lights[Math.floor(rnd() * 3)]
    const a = 0.15 + rnd() * 0.4
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, `rgba(${col},${a})`)
    grd.addColorStop(1, `rgba(${col},0)`)
    g.fillStyle = grd
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  const vg = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 460)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,.55)')
  g.fillStyle = vg
  g.fillRect(0, 0, W, H)
  return c
}

const videos = new Set<HTMLVideoElement>()
/** Footage plays only while Motion is on (batch W-3D-1 §4: no screen animation when off). */
export function setFootagePlaying(on: boolean) {
  for (const v of videos) {
    if (on) v.play().catch(() => {})
    else v.pause()
  }
}

/**
 * THE ONE PLACE A SCREEN'S PICTURE COMES FROM. The scene asks for a slot and
 * gets a texture now (the placeholder frame) and the real one when it is
 * ready: the owner's footage if `public/media/hero-screen-<slot>.mp4` exists,
 * otherwise the space's own product capture in the visitor's theme. Swapping
 * what a screen shows — real footage, a different capture, a live feed — is a
 * change to this function only, never to the scene.
 */
export function getScreenTexture(slot: ScreenSlot, dark: boolean, sources: ScreenSources, anisotropy: number, playing: boolean) {
  const placeholder = finish(new CanvasTexture(placeholderFrame(slot)), anisotropy)
  const src = sources[slot]
  const ready = new Promise<Texture>((resolve) => {
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
      v.addEventListener('error', () => resolve(placeholder), { once: true })
      return
    }
    const url = dark ? src.dark ?? src.light : src.light ?? src.dark
    if (!url) return resolve(placeholder)
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    img
      .decode()
      .then(() => {
        // No wider than the screen can show: a phone gets a 1024 px picture,
        // a laptop up to the capture's own 2248 — less to upload, less memory.
        const want = Math.round(Math.min(img.naturalWidth, Math.max(1024, window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5) * 0.9)))
        if (want >= img.naturalWidth) return resolve(finish(new Texture(img), anisotropy))
        const [c, g] = canvas(want, Math.round((img.naturalHeight * want) / img.naturalWidth))
        g.imageSmoothingQuality = 'high'
        g.drawImage(img, 0, 0, c.width, c.height)
        resolve(finish(new CanvasTexture(c), anisotropy))
      })
      .catch(() => resolve(placeholder))
  })
  return { placeholder, ready }
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
