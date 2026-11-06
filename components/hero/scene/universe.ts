/**
 * THE UNIVERSE — four galaxies, one for each era of a century of cinema, and
 * the journey from one to the next (the owner, 2026-11-06: "when the universe
 * phenomena changes the background, it should have a subtle animation like
 * outer space movement to a new galaxy").
 *
 *  · The title's galaxy: today — the deep blue night and a cream-gold Milky Way.
 *  · Crew's: the silent era — silver nitrate, the first films' black and white.
 *  · Client's: the golden age — three-strip Technicolor, crimson against teal.
 *  · The Suite's: the digital present — violet and cyan.
 *
 * On the tour the scroll carries the visitor from galaxy to galaxy with the
 * camera (each space is its own galaxy, the close returns to the title's); on
 * the one-screen hero the universe travels on its own, about every forty
 * seconds. A travel: the stars stream past, the old sky swells past the camera
 * and fades, the new one grows in from far away.
 *
 * Plain numbers and one driver, read every frame by the sky, the stars and the
 * far worlds. `?galaxy=0–3` holds one, for checking by hand.
 */
import { heroState, smoothstep, type Place } from '@/components/hero/state'

type HSL = readonly [number, number, number]
export type Galaxy = {
  name: string
  /** The nebula's two colours and its accent. */
  a: HSL
  b: HSL
  accent: HSL
  /** The Milky Way's core and its edges. */
  band: HSL
  edge: HSL
  /** The band's slope across the sky (radians), its width, and the seeds of its clouds and of the nebula. */
  angle: number
  width: number
  seed: number
}

export const GALAXIES: readonly Galaxy[] = [
  { name: 'today', a: [226, 52, 13], b: [252, 40, 7], accent: [36, 55, 20], band: [40, 55, 84], edge: [218, 45, 62], angle: -0.35, width: 1, seed: 3.3 },
  { name: 'silent', a: [220, 7, 15], b: [230, 6, 6], accent: [38, 14, 30], band: [40, 10, 88], edge: [218, 6, 60], angle: 0.3, width: 1.25, seed: 7.9 },
  { name: 'technicolor', a: [350, 56, 16], b: [188, 60, 8], accent: [44, 74, 30], band: [352, 60, 80], edge: [184, 58, 56], angle: -0.62, width: 0.85, seed: 12.4 },
  { name: 'digital', a: [268, 50, 16], b: [198, 62, 8], accent: [190, 72, 32], band: [188, 44, 86], edge: [272, 52, 64], angle: 0.14, width: 1.1, seed: 18.6 },
]

/** Off the tour: how long each galaxy holds, and how long a journey takes (seconds). */
export const DRIFT = { hold: 40, travel: 6 } as const
/** A jump between galaxies the scroll didn't make (the tour starting) travels over this long. */
const HANDOFF = 3.2
/** Each shot's galaxy: the title and the close, today's; Crew, Client and the Suite their own. */
const SHOT_GALAXY = [0, 1, 2, 3, 0] as const
/** How fast the stars stream at the height of a journey (units a second), and how much of that the tour keeps (the camera is travelling too). */
export const WARP = { speed: 22, tour: 0.4 } as const

/** Where the universe is: travelling from one galaxy to another, `k` of the way (0–1, eased). */
export const universe = {
  from: 0,
  to: 0,
  k: 0,
  /** How hard the stars stream (0–1), and how far they have streamed. */
  warp: 0,
  travelled: 0,
  /** Off the tour: the drift's own clock. */
  clock: 0,
  /** A handoff in progress: from → to over HANDOFF seconds (`at` < 0 when none). */
  hand: { from: 0, to: 0, at: -1 },
  /** The galaxy the visitor is in (the nearer end of a journey). */
  get here() {
    return this.k < 0.5 ? this.from : this.to
  },
}

const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

/** The galaxy the scroll is in on the tour: a hold is its shot's galaxy; a journey between two shots travels between theirs. */
function onTour(place: Place) {
  const { seg, t } = place
  if (seg.kind === 'hold') return { from: SHOT_GALAXY[seg.shot], to: SHOT_GALAXY[seg.shot], k: 0 }
  return { from: SHOT_GALAXY[seg.from], to: SHOT_GALAXY[seg.to], k: ease(smoothstep(0.12, 0.88, t)) }
}

/** `?drift=<seconds>` shortens the hold, for watching a journey by hand. */
let hold = -1
function holdFor() {
  if (hold < 0) {
    const d = typeof window === 'undefined' ? NaN : Number(new URLSearchParams(window.location.search).get('drift'))
    hold = Number.isFinite(d) && d > 0 ? d : DRIFT.hold
  }
  return hold
}

/** Off the tour: the drift, by its own clock. */
function adrift(clock: number) {
  const H = holdFor()
  const cycle = H + DRIFT.travel
  const n = Math.floor(clock / cycle)
  const x = clock - n * cycle
  const from = ((n % GALAXIES.length) + GALAXIES.length) % GALAXIES.length
  if (x < H) return { from, to: from, k: 0 }
  return { from, to: (from + 1) % GALAXIES.length, k: ease((x - H) / DRIFT.travel) }
}

let held = -2
function heldGalaxy() {
  if (held === -2) {
    held = -1
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search)
      const g = Number(q.get('galaxy'))
      if (q.has('galaxy') && Number.isInteger(g) && g >= 0 && g < GALAXIES.length) held = g
    }
  }
  return held
}

let wasTour = false
/** Moves the universe on by `dt` seconds (called once a frame, before anything reads it). */
export function updateUniverse(place: Place | null, dt: number) {
  const u = universe
  const h = heldGalaxy()
  if (h >= 0 || !place) {
    u.from = u.to = Math.max(0, h)
    u.k = 0
    u.warp = 0
    return
  }
  const reduced = heroState.reduced
  // anywhere but the title the scroll (or a held shot — a poster, `?shot=`) says which galaxy: only the
  // one-screen hero drifts on its own
  const touring = heroState.tour || place.seg.kind !== 'hold' || place.seg.shot !== 0
  // leaving the tour: the drift picks up from the galaxy the visitor is in, at the start of its hold
  if (wasTour && !touring) u.clock = u.here * (holdFor() + DRIFT.travel)
  if (!touring && !reduced) u.clock += dt
  const want = touring ? onTour(place) : reduced ? { from: 0, to: 0, k: 0 } : adrift(u.clock)
  // the tour starting in another galaxy than the title's: the click carries the visitor there
  const wantHere = want.k < 0.5 ? want.from : want.to
  if (touring && !wasTour && u.here !== wantHere && !reduced) u.hand = { from: u.here, to: wantHere, at: 0 }
  wasTour = touring
  if (u.hand.at >= 0) {
    u.hand.at += dt
    const k = Math.min(1, u.hand.at / HANDOFF)
    // the scroll has moved on to a journey of its own: hand over to it
    if (k >= 1 || want.k > 0) u.hand.at = -1
    else {
      u.from = u.hand.from
      u.to = u.hand.to
      u.k = ease(k)
    }
  }
  if (u.hand.at < 0) {
    u.from = want.from
    u.to = want.to
    u.k = want.k
  }
  // the stars stream through the middle of a journey (on the tour, only while the visitor is moving)
  const mid = u.from === u.to ? 0 : Math.sin(Math.PI * u.k)
  const moving = touring && u.hand.at < 0 ? Math.min(1, Math.abs(heroState.speed) * 6) * WARP.tour : 1
  u.warp = reduced ? 0 : mid * moving
  u.travelled += u.warp * WARP.speed * dt
}
