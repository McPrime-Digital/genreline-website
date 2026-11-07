/**
 * THE FRAMING MATH, shared by the camera (rig.ts) and the page (HeroDirector):
 * how a shot's box of scene is fitted into the band of the frame the words
 * leave, and where the whole logo lands on screen. No three.js, so the page
 * can place things over the logo (the play control) with the very numbers the
 * camera uses — on the poster before the 3D loads, and on the live scene.
 *
 * A box is in scene units around a point; a band is fractions of the stage
 * (0 = top or left), measured from the page (heroState.layout).
 */
import { FOV, LINE_POINTS, LOGO_BOX, TILE } from '@/components/hero/scene/numbers'

export type Box = { xMin: number; xMax: number; yMin: number; yMax: number }
export type Band = { x0: number; x1: number; y0: number; y1: number }

/** Where the page's words sit, as fractions of the stage — measured by HeroDirector. */
export type Layout = {
  /** Under the slate line (and the Exit button, on the tour), and above the track; the slate line's own foot. */
  top: number
  bottom: number
  slate: number
  /** The title card: its right edge and its top. */
  titleRight: number
  titleTop: number
  /** The left edge the words keep (--hero-edge): the logo keeps the same margin on the right. */
  edge: number
  /** The room the play control takes under the logo (its height and the gap above it). */
  play: number
  /** A space's caption (the first space's, as a default), and each space's own (Crew, Client, the Suite). */
  captionTop: number
  captionRight: number
  captions: { top: number; right: number }[]
  closeTop: number
  closeRight: number
}

/** The gap between the logo's lowest point and the play control under it, and below the control (px). */
export const PLAY_GAP = 18

/** The whole logo: the line's extent. */
export const LINE_BOX: Box = (() => {
  const xs = LINE_POINTS.map((p) => p[0])
  const ys = LINE_POINTS.map((p) => p[1])
  return { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) }
})()
export const LOGO_Z = LOGO_BOX.center[2]

export const grow = (b: Box, m: number): Box => ({ xMin: b.xMin - m, xMax: b.xMax + m, yMin: b.yMin - m, yMax: b.yMax + m })
/** The tiles' size in the whole logo (numbers.ts TILE.logo), and the room they need round the line. */
export const logoTile = (tall: boolean) => TILE.logo[tall ? 'tall' : 'wide']
const logoRoom = (tall: boolean) => logoTile(tall) / 2 + 0.8
export const clampBand = (b: Band): Band => ({ x0: b.x0, x1: Math.max(b.x1, b.x0 + 0.12), y0: b.y0, y1: Math.max(b.y1, b.y0 + 0.12) })
export const lensTan = (tall: boolean) => Math.tan((((tall ? FOV.tall : FOV.wide) / 2) * Math.PI) / 180)

/** How far back the camera stands for `box` to fill `band`. */
export function distanceFor(box: Box, band: Band, aspect: number, tanH: number) {
  const bw = Math.max(0.12, band.x1 - band.x0)
  const bh = Math.max(0.12, band.y1 - band.y0)
  return Math.max((box.yMax - box.yMin) / (2 * tanH * bh), (box.xMax - box.xMin) / (2 * tanH * aspect * bw))
}

/** The distance at which the logo, its tiles included, fills a band. */
export function logoDistance(band: Band, aspect: number, tanH: number, tall: boolean) {
  return distanceFor(grow(LINE_BOX, logoRoom(tall)), band, aspect, tanH)
}

/**
 * The whole line, the logo — for the title and the close: the band it is fitted into and the
 * camera's distance. Two places are tried, beside the words and above them, and the one that
 * shows the logo larger is used. The title's logo keeps the words' edge as its right margin and
 * leaves room under itself for the play control.
 */
export function wholeFrame(kind: 'title' | 'close', tall: boolean, aspect: number, L: Layout) {
  const tanH = lensTan(tall)
  const right = kind === 'title' ? 1 - L.edge : 0.96
  const room = kind === 'title' ? L.play : 0
  const wordsTop = kind === 'title' ? L.titleTop : L.closeTop
  const bands: Band[] = [{ x0: Math.max(0.04, L.edge), x1: right, y0: L.top, y1: wordsTop - 0.03 - room }]
  if (!tall) {
    if (kind === 'title') bands.push({ x0: L.titleRight + 0.04, x1: right, y0: L.top, y1: L.bottom - room })
    else {
      // the close sits in the room the logo leaves below Crew: the whole frame, if the words stay clear of
      // the valley (right of 41% of the logo's width) and below Crew's tile (61% of its height)
      const full: Band = { x0: 0.05, x1: 0.96, y0: L.top, y1: L.bottom }
      const clearX = full.x0 + 0.41 * (full.x1 - full.x0)
      const clearY = full.y0 + 0.61 * (full.y1 - full.y0)
      if (L.closeRight <= clearX && L.closeTop >= clearY) bands.push(full)
    }
  }
  let band = clampBand(bands[0])
  let d = logoDistance(band, aspect, tanH, tall)
  for (const b of bands.slice(1)) {
    const c = clampBand(b)
    const cd = logoDistance(c, aspect, tanH, tall)
    if (cd < d) {
      band = c
      d = cd
    }
  }
  return { band, d, box: grow(LINE_BOX, logoRoom(tall)) }
}

/**
 * The title's layout on the tour, its words away (they step aside as the tour starts): the logo has the
 * whole stage between the slate line and the track, its room for the cue kept under it.
 */
export function tourLayout(L: Layout): Layout {
  return { ...L, titleTop: L.bottom + 0.03, titleRight: L.edge - 0.04 }
}

/**
 * Where the logo's line lands on the stage, as fractions (0 = top or left), for the title shot at
 * rest: its extent (the valley is its lowest point) and its horizontal middle. The camera
 * looks at the box's centre with its lens shifted to the band's centre, so each point of the line
 * projects at its own depth.
 */
export function logoOnStage(tall: boolean, aspect: number, L: Layout) {
  const { band, d, box } = wholeFrame('title', tall, aspect, L)
  const tanH = lensTan(tall)
  const cx = (box.xMin + box.xMax) / 2
  const cy = (box.yMin + box.yMax) / 2
  const sx0 = (band.x0 + band.x1) / 2
  const sy0 = (band.y0 + band.y1) / 2
  let left = 1
  let right = 0
  let top = 1
  let bottom = 0
  for (const [x, y, z] of LINE_POINTS) {
    const depth = d - (z - LOGO_Z)
    const sx = sx0 + (x - cx) / (2 * depth * tanH * aspect)
    const sy = sy0 - (y - cy) / (2 * depth * tanH)
    left = Math.min(left, sx)
    right = Math.max(right, sx)
    top = Math.min(top, sy)
    bottom = Math.max(bottom, sy)
  }
  return { left, right, top, bottom, centerX: (left + right) / 2 }
}
