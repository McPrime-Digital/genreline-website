/**
 * THE SCENE'S NUMBERS — every position, size, speed and amount the 3D hero
 * uses, in one place. Plain numbers, no three.js: the director (which ships
 * with the page) reads the timeline from here too. Units are scene units;
 * +y is up, the camera looks down −z at the stations.
 *
 * THE LINE is the Genreline logo's line (owner: "the line must match the
 * actual genreline logo"), drawn as four clean cubic curves instead of a
 * trace (owner, 2026-11-03: the traced line was "very unprofessionally
 * crooked"). Its four landmarks are measured from the 1024-px mark,
 * public/brand/genreline-mark-gold.png — the Crew tile's centre (133, 417),
 * Client's (398, 130), the valley's floor (708, 712), Suite's (890, 417) —
 * and set out at 0.085 units per pixel, which makes each trip long enough to
 * be a journey (owner: "the distance between crew and client must be
 * meaningful … currently its too short"): Crew → Client is 33 units, Client
 * → the valley → Suite is 80. The curve leaves Crew climbing, rounds over the
 * top at Client, falls steeply into the valley's round floor and climbs a
 * little into Suite, as the mark does. Depth (z) bends it gently in space.
 */
export type Vec3 = readonly [number, number, number]
type V = [number, number, number]

const PX = 0.085
const fromMark = (px: number, py: number, z: number): V => [(px - 133) * PX, -(py - 417) * PX, z]

/** The three stations: each space's tile on the line. */
export const NODES = {
  crew: fromMark(133, 417, 0),
  client: fromMark(398, 130, -8),
  suite: fromMark(890, 417, -3),
} as const satisfies Record<string, Vec3>
const VALLEY = fromMark(708, 712, 4)

const norm = (v: V): V => {
  const l = Math.hypot(...v)
  return [v[0] / l, v[1] / l, v[2] / l]
}
const deg = (a: number) => (a * Math.PI) / 180

/** The landmarks with their direction of travel and how far each curve's handles reach in and out. */
const KNOTS: { at: V; dir: V; in: number; out: number }[] = [
  { at: [...NODES.crew], dir: norm([Math.cos(deg(52)), Math.sin(deg(52)), -0.12]), in: 0, out: 12 },
  { at: [...NODES.client], dir: norm([1, 0, 0.14]), in: 12.5, out: 12 },
  { at: VALLEY, dir: norm([1, 0, -0.06]), in: 11, out: 8 },
  { at: [...NODES.suite], dir: norm([Math.cos(deg(58)), Math.sin(deg(58)), -0.1]), in: 9, out: 0 },
]

/** Samples per curve: dense enough that the spline through them is the curve itself. */
const PER_CURVE = 96

function bezier(a: V, b: V, c: V, d: V, t: number): V {
  const u = 1 - t
  const w0 = u * u * u
  const w1 = 3 * u * u * t
  const w2 = 3 * u * t * t
  const w3 = t * t * t
  return [0, 1, 2].map((i) => a[i] * w0 + b[i] * w1 + c[i] * w2 + d[i] * w3) as V
}

/** The line, sampled densely along its three curves: Crew → Client → the valley → Suite. */
export const LINE_POINTS: readonly Vec3[] = (() => {
  const out: V[] = []
  for (let k = 0; k < KNOTS.length - 1; k++) {
    const A = KNOTS[k]
    const B = KNOTS[k + 1]
    const p1: V = [A.at[0] + A.dir[0] * A.out, A.at[1] + A.dir[1] * A.out, A.at[2] + A.dir[2] * A.out]
    const p2: V = [B.at[0] - B.dir[0] * B.in, B.at[1] - B.dir[1] * B.in, B.at[2] - B.dir[2] * B.in]
    for (let i = k === 0 ? 0 : 1; i <= PER_CURVE; i++) out.push(bezier(A.at, p1, p2, B.at, i / PER_CURVE))
  }
  return out
})()
/** Where each station sits in LINE_POINTS (Client ends the first curve; Suite ends the last). */
export const NODE_SAMPLE = { crew: 0, client: PER_CURVE, suite: PER_CURVE * 3 } as const

/** The logo's bounds, for the shots that show the whole line (the title and the close). */
export const LOGO_BOX = { center: [32.2, -0.35, -2] as Vec3, halfWidth: 34.5, halfHeight: 27.5 }

// ── THE LINE'S LOOK ─────────────────────────────────────────────────────────

export const TUBE = {
  segments: 1400,
  radialSegments: 10,
  /** The bright core, and the soft halo around it. Both grow with distance so the line holds a minimum width on screen. */
  core: { radius: 0.075, perDistance: 0.0024 },
  halo: { radius: 0.5, perDistance: 0.011 },
  /** Light flowing along the line: one pulse every `spacing` units, moving at `speed` units a second. */
  pulse: { spacing: 14, speed: 7 },
} as const

/** The tiles: the logo's three glyphs (and the Stakeholders face), as camera-facing cards. */
export const TILE = { size: 3.4, glow: 9, minScreen: 0.07 } as const

/** Particles streaming along the line, and the stars around it (the most any quality draws; QUALITY sets how many). */
export const FLOW = { count: 3400, radius: 2.6, size: 0.075, speed: [0.006, 0.016] as const } as const
export const STARS = { count: 4200, box: { min: [-70, -60, -110] as Vec3, max: [135, 60, 40] as Vec3 }, size: 0.16, streaks: 900 } as const

// ── THE STATIONS ────────────────────────────────────────────────────────────

/** A screen's size (the captures are 2248 × 1616). */
export const PANEL = { width: 5.6, aspect: 1616 / 2248, label: 0.95, toolWidth: 4.9, tallWidth: 6.6 } as const

/**
 * Where the screens hang around their station's tile, relative to the tile.
 * Wide frames ring the tile and leave its lower left clear for the caption;
 * tall frames stack two above and two below.
 */
export const SLOTS: Record<'crew' | 'client' | 'suite', { wide: Vec3[]; tall: Vec3[] }> = {
  crew: {
    wide: [[-11.4, 3.0, -1.2], [-4.6, 6.4, -3.4], [4.6, 6.2, -2.4], [11.6, 1.6, -0.8], [8.3, -5.0, 0.6], [-0.6, -6.3, -1.6]],
    tall: [[-3.55, 8.3, -1.6], [3.55, 7.9, -0.8], [-3.55, -5.8, -0.8], [3.55, -6.2, -1.6]],
  },
  client: {
    wide: [[-11.2, 2.4, -0.8], [-5.0, 6.3, -2.6], [4.2, 6.4, -3.4], [11.6, 2.4, -1.2], [8.6, -4.8, 0.4], [-0.2, -6.3, -1.4]],
    tall: [[-3.55, 7.9, -0.8], [3.55, 8.3, -1.6], [-3.55, -6.2, -1.6], [3.55, -5.8, -0.8]],
  },
  suite: {
    wide: [[-11.6, 3.4, -1.0], [-5.6, 6.8, -3.0], [1.8, 7.2, -3.6], [8.8, 4.8, -1.8], [12.2, -1.0, -0.6], [7.8, -6.0, 0.6], [-1.4, -6.4, -1.4]],
    tall: [[-3.55, 8.0, -1.6], [3.55, 8.4, -0.8], [-3.55, -5.8, -0.8], [3.55, -6.2, -1.6]],
  },
}
/** Which of a station's screens the tall frame keeps (indexes into its list). */
export const TALL_KEEP = { crew: [0, 1, 2, 3], client: [0, 1, 2, 3], suite: [0, 4, 3, 6] } as const

/** The Suite's tool chips: small tiles circling its tile on a tilted ring. */
export const CHIPS = { radius: 4.6, size: 1.15, tilt: 0.42, period: 38 } as const
/** The rings round every tile. */
export const RINGS = [{ radius: 2.75, tilt: [1.2, 0.2] }, { radius: 3.55, tilt: [1.35, -0.5] }] as const

/** Client ↔ Stakeholders: the face turns every three seconds (owner, 2026-11-03), the turn itself takes 0.7 s. */
export const FACE = { every: 3000, turn: 0.7 } as const

// ── THE CAMERA ──────────────────────────────────────────────────────────────

export const FOV = { wide: 46, tall: 62, tallBelowAspect: 0.8, ride: 7 } as const

export const VIEW = {
  /** On the way: riding above and in front of the line, looking down it. */
  ride: { wide: [0, 2.7, 10.5] as Vec3, tall: [0, 2.7, 15] as Vec3, lookAhead: 0.05, pitch: 0.5 },
  /** While holding a shot the camera keeps creeping forward, so the scene never freezes. */
  creep: 0.05,
  /** The camera leans with the pointer, a little (scaled by its distance). */
  pointer: { x: 0.9, y: 0.5, damping: 2.6 },
} as const
// Every held shot is framed by rig.ts: its box of scene fitted into the room the words leave, measured from the page.

// ── THE TIMELINE ────────────────────────────────────────────────────────────
//
// The hero is a sticky stage scrolled through `SCROLL_VH` of page. The
// visitor's scroll runs this timeline: five shots (title, Crew, Client, the
// Suite, the close) held in place, and four journeys between them. A hold
// keeps the camera creeping; a journey rides the line.

export type Shot = 0 | 1 | 2 | 3 | 4
export type Segment = { kind: 'hold'; shot: Shot; vh: number } | { kind: 'travel'; from: Shot; to: Shot; vh: number }

export const STORY: readonly Segment[] = [
  { kind: 'hold', shot: 0, vh: 30 },
  { kind: 'travel', from: 0, to: 1, vh: 85 },
  { kind: 'hold', shot: 1, vh: 90 },
  { kind: 'travel', from: 1, to: 2, vh: 140 },
  { kind: 'hold', shot: 2, vh: 110 },
  { kind: 'travel', from: 2, to: 3, vh: 150 },
  { kind: 'hold', shot: 3, vh: 90 },
  { kind: 'travel', from: 3, to: 4, vh: 100 },
  { kind: 'hold', shot: 4, vh: 60 },
]
export const SCROLL_VH = STORY.reduce((s, x) => s + x.vh, 0)
export const SHOTS = 5

/** How fast the camera catches up with the scroll (per second). */
export const SCROLL_DAMPING = 3.2
/** The slate line's clock: the shots land on 0, 4, 8, 12 and 16 seconds, at 24 fps. */
export const TIMECODE = { seconds: 16, fps: 24 } as const

// ── QUALITY: ONE SCENE, FITTED TO EVERY DEVICE ──────────────────────────────
//
// Three qualities. A device starts at the one its GPU's benchmark suggests
// (HeroDirector) and the governor (HeroCanvas) moves it on the frame rate it
// actually gets. Resolution is held to a pixel budget as well as a ratio, so
// a 4K monitor or a 3× phone draws no more pixels than its GPU can fill.

export type Quality = 0 | 1 | 2

export const QUALITY = [
  // 0 — modest graphics: budget phones and tablets, older integrated graphics on big screens
  { dpr: 1, pixels: 1.5e6, stars: 1800, flow: 1300, streaks: false, antialias: false, texture: 720 },
  // 1 — the middle: most laptops' integrated graphics, mid-range phones, any GPU the browser will not name
  { dpr: 1.25, pixels: 2.6e6, stars: 3000, flow: 2400, streaks: true, antialias: true, texture: 1024 },
  // 2 — strong graphics: Apple silicon, recent phones, discrete GPUs
  { dpr: 1.5, pixels: 3.8e6, stars: 4200, flow: 3400, streaks: true, antialias: true, texture: 1400 },
] as const

/** The governor's ladder, lowest first: quality 0 at reduced resolution, then each quality at full. */
export const LEVELS = [
  { quality: 0, scale: 0.7 },
  { quality: 0, scale: 0.85 },
  { quality: 0, scale: 1 },
  { quality: 1, scale: 1 },
  { quality: 2, scale: 1 },
] as const
/** Where each starting quality enters the ladder. */
export const LEVEL_OF_QUALITY = [2, 3, 4] as const

/**
 * The governor: frames are averaged over `window` seconds (after `settle`
 * seconds to warm up). Below `slow` fps it steps down a level; at the bottom,
 * below `floor` fps twice running, the hero plays as stills. A steady frame
 * rate that is merely capped (30 Hz in a battery saver or Low Power Mode) is
 * not slowness. Stepping up needs `climb` good windows in a row, at most one
 * level above the start, and never back above a level it had to leave.
 */
export const GOVERNOR = { window: 1.2, settle: 2.5, slow: 40, floor: 25, good: 55, climb: 5 } as const
