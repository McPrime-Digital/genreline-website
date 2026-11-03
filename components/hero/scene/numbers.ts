/**
 * THE SCENE'S NUMBERS — every position, size, speed and amount the 3D hero
 * uses, in one place (batch W-3D-1 §2). Units are scene units; the camera's
 * first shot stands at z = 3 looking down −z.
 *
 * Source of each group:
 *  · THE LINE is the Genreline logo's own centreline (owner, 2026-11-03: "the
 *    line must match the actual genreline logo"). It was traced from
 *    public/brand/genreline-mark-gold.png — the stroke's centre sampled every
 *    8–16 px — and mapped at the prototype's scale: the Crew and Suite tile
 *    centres sit 760 px apart in the logo and 8.1 units apart in the
 *    prototype, so 1 px = 8.1 / 760 units. At that scale the logo puts the
 *    Client tile 3.04 units above Crew — the prototype had 3.0 — so the
 *    prototype's node spacing was already the logo's; what changes is the
 *    curve between the nodes (the logo's deep valley before Suite, Suite level
 *    with Crew) and that the line now starts at Crew and ends at Suite, as
 *    the logo does. Depth (z) is the prototype's: each node keeps its z, and
 *    the curve's z runs between them.
 *  · THE NODES' z, the dust, the glow tubes, the fog, the pointer tilt, the
 *    damping speeds, the field of view and the slow-frame test are lifted
 *    exactly from reference/hero-prototype.html.
 *  · THE SCREENS AND THE CAMERA start from the prototype's numbers and are
 *    re-framed where the logo's line moved a node, so each space's screen
 *    sits behind its node and wholly in frame at its shot (owner,
 *    2026-11-03). Every changed number says what it was.
 */
export type Vec3 = readonly [number, number, number]

/** The logo's centreline, Crew tile centre → Client tile centre → the valley → Suite tile centre. */
export const LINE_POINTS: readonly Vec3[] = [
  [-4.2, -0.9, -10], [-3.518, -0.644, -10.602], [-3.049, -0.378, -11.015], [-2.942, -0.122, -11.109],
  [-2.846, 0.134, -11.194], [-2.729, 0.304, -11.297], [-2.617, 0.475, -11.396], [-2.532, 0.731, -11.471],
  [-2.452, 0.986, -11.541], [-1.93, 1.562, -12.002], [-1.365, 2.137, -12.5], [-0.917, 1.626, -12.405],
  [-0.587, 0.986, -12.335], [-0.464, 0.645, -12.309], [-0.363, 0.304, -12.287], [-0.273, -0.037, -12.268],
  [-0.193, -0.378, -12.251], [-0.107, -0.719, -12.233], [-0.022, -1.06, -12.215], [0.079, -1.401, -12.193],
  [0.175, -1.742, -12.173], [0.271, -2.083, -12.152], [0.378, -2.424, -12.13], [0.495, -2.765, -12.105],
  [0.649, -3.106, -12.072], [0.751, -3.277, -12.05], [1.214, -3.772, -11.952], [1.534, -3.959, -11.884],
  [1.854, -4.039, -11.816], [2.173, -4.012, -11.638], [2.493, -3.804, -11.427], [2.813, -3.378, -11.217],
  [3.079, -2.914, -11.041], [3.229, -2.616, -10.943], [3.346, -2.317, -10.865], [3.41, -2.168, -10.823],
  [3.644, -1.55, -10.669], [3.9, -0.9, -10.5],
]

/** The three nodes, at the logo's tile centres. Prototype: Client (−1.0, 2.1), Suite (3.9, 0.2). */
export const NODES = {
  crew: [-4.2, -0.9, -10],
  client: [-1.365, 2.137, -12.5],
  suite: [3.9, -0.9, -10.5],
} as const satisfies Record<string, Vec3>

/** A node tile's size (prototype 1.05; the logo's tiles are larger against the line, so a little up). */
export const NODE_SIZE = 1.3
export const NODE_GLOW_SIZE = 2.6
export const NODE_GLOW_OPACITY = { dark: 0.55, light: 0.35 }

/** The line: a core and two glow tubes. Radii, segments and opacities are the prototype's. */
export const TUBE = {
  core: { radius: 0.03, segments: 700 },
  glowA: { radius: 0.09, segments: 500, opacity: { dark: 0.32, light: 0.22 } },
  glowB: { radius: 0.24, segments: 300, opacity: { dark: 0.11, light: 0.08 } },
  radialSegments: 8,
}

/** The travelling playhead: one lap of the line every 7 s. */
export const PLAYHEAD = { seconds: 7, size: 0.9 }

/**
 * The screens, one behind each node. Width is the prototype's 4.0; height
 * follows the captures' own aspect (2248 × 1616), so nothing is stretched.
 */
export const SCREEN_WIDTH = 4.0
export const SCREENS = {
  // prototype (−6.1, 1.0, −12.5), rotation y 0.35
  crew: { position: [-6.1, 1.0, -12.5], rotationY: 0.35 },
  // prototype (1.6, 3.3, −15.0), rotation y −0.1
  client: { position: [1.6, 3.3, -15.0], rotationY: -0.1 },
  // prototype (6.3, −1.1, −12.5), rotation y −0.4
  suite: { position: [6.3, -1.1, -12.5], rotationY: -0.4 },
} as const satisfies Record<string, { position: Vec3; rotationY: number }>

/**
 * The camera's five shots: the title, Crew, Client, the Suite, the closing
 * line. The prototype's path framed each node so close (a third of the frame)
 * that its screen fell out of frame — Crew's cut at the top, Client's and the
 * Suite's off the right edge — and on a phone Crew left the opening frame.
 * Re-framed (owner, 2026-11-03: the screens "at the back very well and in
 * frame"): each node shot stands back far enough to hold the node and its
 * whole screen, in the part of the frame the words leave open. Prototype:
 *   camera (0.6, 0.4, 3.0) (−2.6, −0.4, −6.6) (−2.4, 2.7, −9.3) (2.3, 0.8, −7.1) (1.5, 1.2, 5.5)
 *   look   (0.3, 0.2, −12) (−5.4, −1.2, −10) (−2.3, 1.7, −12.5) (2.6, −0.1, −10.5) (0.5, 0.3, −13)
 * A tall frame (a phone) has its own path: the same shots, further back.
 */
export const CAMERA_PATH: readonly Vec3[] = [
  [0.6, 0.4, 10.5], [-1.2, 0.0, -3.4], [0.6, 2.3, -5.4], [5.2, 0.4, -4.4], [1.5, 1.2, 11.5],
]
export const LOOK_PATH: readonly Vec3[] = [
  [-1.6, 0.0, -12], [-4.7, 0.1, -11.5], [-0.2, 2.6, -13.6], [5.0, -0.4, -11.3], [-0.4, -2.2, -13],
]
export const CAMERA_PATH_TALL: readonly Vec3[] = [
  [0.4, 0.6, 15.5], [-3.6, 0.6, -1.2], [0.4, 3.4, 0.8], [5.8, 0.0, 1.6], [0.6, 0.8, 17.0],
]
export const LOOK_PATH_TALL: readonly Vec3[] = [
  [0.0, 0.2, -12], [-5.1, 0.8, -11.5], [0.3, 2.6, -13.6], [5.5, -0.6, -11.3], [0.3, 0.3, -13],
]

/** Field of view: 50°, widened to 66° when the frame is taller than it is wide (aspect < 0.8). */
export const FOV = { wide: 50, tall: 66, tallBelowAspect: 0.8 }

/**
 * Dust: 1,400 points in a 30 × 16 × 32 box whose near face is at z = 4. Each
 * point is drawn as a soft round speck rather than the prototype's square, at
 * 1.6 × the prototype's size, since a soft speck's visible core is smaller.
 */
export const DUST = { count: 1400, spread: [30, 16, 32] as Vec3, nearZ: 4, size: 0.05, opacity: { dark: 0.75, light: 0.45 }, lowered: 600 }

export const FOG_DENSITY = { dark: 0.034, light: 0.026 }

/** Pointer tilt: how far the camera leans toward the pointer, and how fast it follows. */
export const POINTER = { x: 0.35, y: 0.22, damping: 3 }

/** How fast the camera catches up with the scroll (per second). */
export const SCROLL_DAMPING = 4.5

/** Device pixel ratio cap, and the ratio a slow device drops to. */
export const DPR = { cap: 1.5, lowered: 1 }

/** The slow-frame test: 150 frames after the first second; slower than 28 ms on average lowers the scene. */
export const SLOW_FRAMES = { samples: 150, seconds: 0.028 }

/** The scene's clock: the whole scroll is 16 seconds of timecode at 24 frames a second. */
export const TIMECODE = { seconds: 16, fps: 24 }

/** The number of shots, and the progress each one sits at (0, ¼, ½, ¾, 1). */
export const SHOTS = 5

/**
 * The lens shift, as a fraction of the frame: [right, up]. The words sit on
 * the left of a wide frame and at the foot of a tall one, so the picture is
 * moved into the space they leave — the camera's path is unchanged. A wide
 * frame shifts more the wider it is (a squarer frame has less room to give).
 */
export function viewShift(aspect: number): readonly [number, number] {
  if (aspect < FOV.tallBelowAspect) return [0, 0.25]
  return [Math.min(0.17, Math.max(0, (aspect - 1.3) * 0.56)), 0]
}
