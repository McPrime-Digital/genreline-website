/**
 * THE CAMERA'S PATH — where the camera stands and looks for any moment of the
 * timeline, and the per-frame values the rest of the scene reads (`live`).
 *
 *  · At a station it stands straight in front of the tile, far enough back
 *    for the ring of screens, and keeps creeping in while the shot holds.
 *  · Between two stations it rides the line: lifted above it and in front of
 *    it, looking a little way down it (its pitch softened, so the drop into
 *    the valley never looks straight down), the lens opening a few degrees
 *    with the speed. It eases out of the station's framing into the ride and
 *    back into the next station's.
 *  · The title and the close frame the whole line — the logo — in space.
 * Every frame is computed fresh from the scroll; nothing accumulates, so the
 * visitor can stop, reverse or jump anywhere.
 */
import { CatmullRomCurve3, Vector3 } from 'three'
import { CHIPS, FOV, LINE_POINTS, NODES, NODE_SAMPLE, PANEL, RINGS, SLOTS, TALL_KEEP, TILE, VIEW, type Shot, type Vec3 } from '@/components/hero/scene/numbers'
import { clampBand, distanceFor, LOGO_Z, wholeFrame, type Band, type Box } from '@/components/hero/frame'
import { heroState, smoothstep, type Place } from '@/components/hero/state'

export const v3 = (p: Vec3) => new Vector3(p[0], p[1], p[2])

/** The line as a curve, walked by arc length. */
export const LINE = new CatmullRomCurve3(LINE_POINTS.map(v3), false, 'centripetal')
LINE.arcLengthDivisions = (LINE_POINTS.length - 1) * 8
const LENGTHS = LINE.getLengths(LINE.arcLengthDivisions)
export const LINE_LENGTH = LENGTHS[LENGTHS.length - 1]
/** Each station's place on the line, as arc length 0–1. */
export const NODE_U = {
  crew: 0,
  client: LENGTHS[NODE_SAMPLE.client * 8] / LINE_LENGTH,
  suite: 1,
} as const

const STATION_OF: Record<1 | 2 | 3, keyof typeof NODES> = { 1: 'crew', 2: 'client', 3: 'suite' }

/** The per-frame state the scene shares (written by the camera rig, read by everything else). */
export const live = {
  place: null as Place | null,
  tall: false,
  /** Where the bright light on the line sits (arc length 0–1), and how bright. */
  head: 0,
  headOn: 0,
  /** The camera's velocity, world units a second (for the warp streaks). */
  velocity: new Vector3(),
  /** Seconds of ambient time (frozen under reduced motion). */
  time: 0,
  /** The pointer over the stage, −1…1 (y up), and whether it is there at all. */
  pointer: { x: 0, y: 0, on: 0 },
  /** Every shader is built and the first frame is up (HeroCanvas). */
  ready: false,
  /** Until this moment (performance.now()) a frame may carry a picture's upload: the governor looks away. */
  busyUntil: 0,
}

export type View = { pos: Vector3; look: Vector3; fov: number; shift: [number, number] }
export const makeView = (): View => ({ pos: new Vector3(), look: new Vector3(), fov: FOV.wide, shift: [0, 0] })

const tmp = new Vector3()
const tmp2 = new Vector3()

// ── FITTING EACH SHOT INTO THE ROOM THE WORDS LEAVE ─────────────────────────
//
// A shot is a box of scene (its extent around a point, in scene units) and a
// band of the frame (fractions, 0 = top or left) that the words leave clear,
// measured from the page (heroState.layout). The camera stands back just far
// enough for the box to fill the band, and the lens is shifted so the box
// sits in it. So every shot fits whatever the screen's size and shape, its
// text size, or how the page's words wrap.

// The line's extent and the logo's framing live in frame.ts (no three.js), shared with the page.

/** A station's extent: its ring of screens with their labels, the tile, its rings (and the Suite's chips). */
function stationBox(id: keyof typeof NODES, tall: boolean): Box {
  const w = tall ? PANEL.tallWidth : id === 'suite' ? PANEL.toolWidth : PANEL.width
  const h = w * PANEL.aspect
  const label = PANEL.label * (w / PANEL.width)
  const core = Math.max(TILE.size / 2, RINGS[RINGS.length - 1].radius, id === 'suite' ? CHIPS.radius + CHIPS.size / 2 : 0)
  const box: Box = { xMin: -core, xMax: core, yMin: -core, yMax: core }
  const slots = tall ? SLOTS[id].tall.slice(0, TALL_KEEP[id].length) : SLOTS[id].wide
  for (const [x, y] of slots) {
    box.xMin = Math.min(box.xMin, x - w / 2)
    box.xMax = Math.max(box.xMax, x + w / 2)
    box.yMax = Math.max(box.yMax, y + h / 2)
    box.yMin = Math.min(box.yMin, y - h / 2 - label)
  }
  // room for the float, the lift under the hand, and the creep of a held shot
  const m = 0.7
  return { xMin: box.xMin - m, xMax: box.xMax + m, yMin: box.yMin - m, yMax: box.yMax + m }
}
const STATION_BOX = {
  crew: { wide: stationBox('crew', false), tall: stationBox('crew', true) },
  client: { wide: stationBox('client', false), tall: stationBox('client', true) },
  suite: { wide: stationBox('suite', false), tall: stationBox('suite', true) },
}

/** The camera for `box` (around the point x, y, z) in `band`, `creep` 0–1 moving it in by VIEW.creep. */
function fit(box: Box, band: Band, x: number, y: number, z: number, tall: boolean, aspect: number, creep: number, out: View) {
  const fov = tall ? FOV.tall : FOV.wide
  const tanH = Math.tan(((fov / 2) * Math.PI) / 180)
  const d = distanceFor(box, band, aspect, tanH) * (1 - VIEW.creep * creep)
  const cx = x + (box.xMin + box.xMax) / 2
  const cy = y + (box.yMin + box.yMax) / 2
  out.look.set(cx, cy, z)
  out.pos.set(cx, cy, z + d)
  out.fov = fov
  out.shift[0] = (band.x0 + band.x1) / 2 - 0.5
  out.shift[1] = 0.5 - (band.y0 + band.y1) / 2
}

/** A station, straight on, its ring of screens in the room the caption leaves. */
function stationView(shot: 1 | 2 | 3, tall: boolean, aspect: number, creep: number, out: View) {
  const id = STATION_OF[shot]
  const c = NODES[id]
  const L = heroState.layout
  const cap = L.captions[shot - 1] ?? { top: L.captionTop, right: L.captionRight }
  const box = STATION_BOX[id][tall ? 'tall' : 'wide']
  let band: Band
  if (tall) band = { x0: 0.03, x1: 0.97, y0: L.top, y1: cap.top - 0.025 }
  else {
    // the ring leaves its lower left open for the caption: shift the ring right just enough that the
    // nearest screen to the caption (the bottom one) clears the caption's widest line
    const bottomLeft = Math.min(...SLOTS[id].wide.filter((p) => p[1] < 0).map((p) => p[0] - (id === 'suite' ? PANEL.toolWidth : PANEL.width) / 2))
    const r = (bottomLeft - box.xMin) / (box.xMax - box.xMin)
    const x1 = 0.97
    const x0 = Math.min(0.38, Math.max(0.04, (cap.right + 0.015 - r * x1) / (1 - r)))
    band = { x0, x1, y0: L.top, y1: L.bottom }
  }
  fit(box, clampBand(band), c[0], c[1], c[2], tall, aspect, creep, out)
}

/** The whole line, the logo — for the title and the close (frame.ts wholeFrame picks the band). */
function wholeView(kind: 'title' | 'close', tall: boolean, aspect: number, creep: number, out: View) {
  const { band, box } = wholeFrame(kind, tall, aspect, heroState.layout)
  fit(box, band, 0, 0, LOGO_Z, tall, aspect, creep * 0.6, out)
}

function shotView(shot: Shot, tall: boolean, aspect: number, creep: number, out: View) {
  if (shot === 0) wholeView('title', tall, aspect, creep, out)
  else if (shot === 4) wholeView('close', tall, aspect, creep, out)
  else stationView(shot, tall, aspect, creep, out)
}

/** Riding the line at arc length u. */
function rideView(u: number, tall: boolean, out: View) {
  const off = tall ? VIEW.ride.tall : VIEW.ride.wide
  LINE.getPointAt(Math.min(1, Math.max(0, u)), tmp)
  out.pos.set(tmp.x + off[0], tmp.y + off[1], tmp.z + off[2])
  LINE.getPointAt(Math.min(1, u + VIEW.ride.lookAhead), tmp2)
  out.look.copy(tmp2)
  out.look.y = out.pos.y + (tmp2.y - out.pos.y) * VIEW.ride.pitch
  out.fov = (tall ? FOV.tall : FOV.wide) + FOV.ride
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const A = makeView()
const B = makeView()
const R = makeView()

/** The camera for a moment of the timeline. Writes `out`, and the line's light into `live`. */
export function cameraAt(place: Place, tall: boolean, aspect: number, out: View) {
  const { seg, t } = place
  if (seg.kind === 'hold') {
    shotView(seg.shot, tall, aspect, t, out)
    if (seg.shot >= 1 && seg.shot <= 3) {
      live.head = NODE_U[STATION_OF[seg.shot as 1 | 2 | 3]]
    }
    live.headOn = 0
    return
  }
  shotView(seg.from, tall, aspect, 1, A)
  shotView(seg.to, tall, aspect, 0, B)
  const e = ease(t)
  out.pos.lerpVectors(A.pos, B.pos, e)
  out.look.lerpVectors(A.look, B.look, e)
  out.fov = A.fov + (B.fov - A.fov) * e
  out.shift[0] = A.shift[0] + (B.shift[0] - A.shift[0]) * e
  out.shift[1] = A.shift[1] + (B.shift[1] - A.shift[1]) * e
  live.headOn = 0
  // between two stations: ride the line
  if (seg.from >= 1 && seg.to <= 3) {
    const ua = NODE_U[STATION_OF[seg.from as 1 | 2 | 3]]
    const ub = NODE_U[STATION_OF[seg.to as 1 | 2 | 3]]
    const ride = smoothstep(0, 0.32, t) * (1 - smoothstep(0.68, 1, t))
    const u = ua + (ub - ua) * smoothstep(0.04, 0.96, t)
    rideView(u, tall, R)
    out.pos.lerp(R.pos, ride)
    out.look.lerp(R.look, ride)
    out.fov += (R.fov - out.fov) * ride
    live.head = Math.min(1, u + 0.035)
    live.headOn = ride
  }
}
