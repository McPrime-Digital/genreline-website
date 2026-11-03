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
import { FOV, LINE_POINTS, LOGO_BOX, NODES, NODE_SAMPLE, VIEW, type Shot, type Vec3 } from '@/components/hero/scene/numbers'
import { smoothstep, type Place } from '@/components/hero/state'

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
}

export type View = { pos: Vector3; look: Vector3; fov: number; shift: [number, number] }
export const makeView = (): View => ({ pos: new Vector3(), look: new Vector3(), fov: FOV.wide, shift: [0, 0] })

const tmp = new Vector3()
const tmp2 = new Vector3()

function lensFor(tall: boolean) {
  return tall ? FOV.tall : FOV.wide
}

/** A station, straight on. `creep` 0–1 moves the camera in by VIEW.creep of its distance. */
function stationView(shot: 1 | 2 | 3, tall: boolean, aspect: number, creep: number, out: View) {
  const c = NODES[STATION_OF[shot]]
  const fov = lensFor(tall)
  const tanH = Math.tan(((fov / 2) * Math.PI) / 180)
  let d: number
  let lift: number
  if (tall) {
    d = VIEW.station.tall.distance
    lift = VIEW.station.tall.lift
  } else {
    // far enough back that the ring's right edge clears the frame, whatever the frame's shape
    const rightRoom = (0.5 - VIEW.shift.wide.station[0]) * 2 * tanH * aspect
    d = Math.max(VIEW.station.wide.distance, VIEW.station.wide.fitHalfWidth / rightRoom)
    lift = VIEW.station.wide.lift
  }
  d *= 1 - VIEW.creep * creep
  out.pos.set(c[0], c[1] + lift, c[2] + d)
  out.look.set(c[0], c[1] + lift * 0.4, c[2])
  out.fov = fov
  const s = tall ? VIEW.shift.tall.station : VIEW.shift.wide.station
  out.shift[0] = s[0]
  out.shift[1] = s[1]
}

/** The whole line, the logo: for the title (room for the words on the left) or the close (centred, the words below). */
function wholeView(kind: 'title' | 'close', tall: boolean, aspect: number, creep: number, out: View) {
  const fov = lensFor(tall)
  const tanH = Math.tan(((fov / 2) * Math.PI) / 180)
  const [cx, cy, cz] = LOGO_BOX.center
  const w = LOGO_BOX.halfWidth * VIEW.whole.margin
  const h = LOGO_BOX.halfHeight * VIEW.whole.margin
  let d: number
  if (tall) {
    d = w / (0.94 * tanH * aspect)
  } else {
    // the title gives the logo the right 58% of the frame; the close, 80%
    const share = kind === 'title' ? 0.58 : 0.8
    d = Math.max(h / (kind === 'title' ? 0.72 : 0.64) / tanH, w / (share * tanH * aspect))
  }
  d *= 1 - VIEW.creep * 0.6 * creep
  out.pos.set(cx, cy + d * 0.05, cz + d)
  out.look.set(cx, cy, cz)
  out.fov = fov
  const s = (tall ? VIEW.shift.tall : VIEW.shift.wide)[kind]
  out.shift[0] = s[0]
  out.shift[1] = s[1]
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
  out.fov = lensFor(tall) + FOV.ride
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
