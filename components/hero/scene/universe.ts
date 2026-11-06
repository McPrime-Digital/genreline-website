/**
 * THE UNIVERSE — the quiet sky behind the logo, and how it changes (the owner, 2026-11-06: "i dont like
 * background outerspace that is too busy … the previous 2 or 3 backgrounds were more subtle and good i wanted
 * you to just advance them a little … no more planets at the background just the stars, sometimes shooting,
 * some pulsating, then a subtle outerspace nebular … not use one animation when background switch … many
 * and at random").
 *
 * A sky is a subtle nebula and, very far, a faint Milky Way, in one of twelve film stocks (round 3's four,
 * and eight more in the same restraint). Each time one shows it is drawn afresh — its clouds from a new
 * seed, its band at a new slope and place — so even a sky that returns is never the same picture. It holds
 * 40–55 s, its clouds drifting, then gives way to the next by one of ten changes that run across the whole
 * sky, its stars included: push in, pull out, whip pan, spin, iris, star dissolve, light leak, anamorphic
 * wipe, fade through black, hyperspace.
 *
 * Never the same: the skies and the changes are dealt from shuffle bags — a sky returns only when all
 * twelve have shown (over ten minutes), a change never runs twice in a row.
 *
 * On the tour each space has its own sky (planned when the tour starts — the title keeps the one on screen,
 * so taking the tour never jumps), and each journey its own change, scrubbed by the scroll.
 *
 * The first sky, on landing, is always the same — the one the title's poster shows — so the live scene takes
 * over from the poster without a seam. `?sky=0–11` holds a sky, `?seed=` fixes the draw, `?drift=<s>`
 * shortens the hold, `?change=0–9` makes every change that one.
 */
import { heroState, smoothstep, type Place } from '@/components/hero/state'
import type { Shot } from '@/components/hero/scene/numbers'

type HSL = readonly [number, number, number]
export type Sky = {
  name: string
  /** The nebula's two colours and its accent; the Milky Way's core and its edges. */
  a: HSL
  b: HSL
  accent: HSL
  band: HSL
  edge: HSL
  /** The band's slope (radians) and width, how much of the band shows, how much of the nebula. */
  angle: number
  width: number
  milky: number
  nebula: number
}

export const SKIES: readonly Sky[] = [
  // the landing: a calm deep-blue night, a faint violet and teal haze, only a whisper of the Milky Way
  { name: 'night', a: [234, 58, 17], b: [262, 46, 8], accent: [188, 62, 28], band: [222, 34, 82], edge: [266, 36, 60], angle: -0.22, width: 0.9, milky: 0.45, nebula: 1.1 },
  // round 3's four (the owner: "more subtle and good")
  { name: 'today', a: [226, 52, 13], b: [252, 40, 7], accent: [36, 55, 20], band: [40, 55, 84], edge: [218, 45, 62], angle: -0.35, width: 1, milky: 0.85, nebula: 1 },
  { name: 'silver nitrate', a: [220, 7, 15], b: [230, 6, 6], accent: [38, 14, 30], band: [40, 10, 88], edge: [218, 6, 60], angle: 0.3, width: 1.25, milky: 0.8, nebula: 1 },
  { name: 'technicolor', a: [350, 50, 15], b: [188, 56, 8], accent: [44, 70, 28], band: [352, 55, 80], edge: [184, 52, 56], angle: -0.62, width: 0.85, milky: 0.7, nebula: 0.9 },
  { name: 'digital', a: [268, 48, 15], b: [198, 58, 8], accent: [190, 66, 30], band: [188, 40, 86], edge: [272, 48, 64], angle: 0.14, width: 1.1, milky: 0.75, nebula: 0.95 },
  // eight more, in the same restraint
  { name: 'eastmancolor', a: [24, 46, 13], b: [196, 50, 7], accent: [30, 64, 25], band: [34, 48, 82], edge: [192, 42, 58], angle: 0.42, width: 0.95, milky: 0.6, nebula: 0.9 },
  { name: 'cyanotype', a: [212, 56, 13], b: [224, 50, 6], accent: [198, 56, 26], band: [206, 42, 84], edge: [226, 38, 60], angle: -0.48, width: 1.05, milky: 0.7, nebula: 0.95 },
  { name: 'sepia', a: [30, 32, 12], b: [22, 26, 6], accent: [38, 50, 24], band: [38, 36, 82], edge: [28, 26, 58], angle: 0.22, width: 1.15, milky: 0.75, nebula: 0.85 },
  { name: 'fujichrome', a: [318, 34, 12], b: [164, 36, 6], accent: [146, 40, 22], band: [320, 26, 82], edge: [162, 28, 58], angle: -0.12, width: 0.9, milky: 0.5, nebula: 0.9 },
  { name: 'kodachrome', a: [8, 44, 12], b: [214, 46, 7], accent: [44, 64, 25], band: [40, 46, 84], edge: [210, 42, 62], angle: 0.55, width: 1, milky: 0.7, nebula: 0.9 },
  { name: 'bleach bypass', a: [210, 12, 12], b: [202, 10, 6], accent: [40, 18, 24], band: [210, 8, 84], edge: [205, 10, 58], angle: -0.38, width: 1.2, milky: 0.8, nebula: 0.85 },
  { name: 'dawn', a: [172, 40, 11], b: [252, 38, 6], accent: [150, 48, 22], band: [182, 32, 82], edge: [250, 32, 60], angle: 0.08, width: 0.95, milky: 0.55, nebula: 0.9 },
]

export const CHANGES = ['push', 'pull', 'whip', 'spin', 'iris', 'dissolve', 'leak', 'wipe', 'black', 'hyperspace'] as const

export type Universe = {
  sky: number
  /** This showing's own draw: its clouds' seed, its band's slope and width, where its nebula and band sit (uv). */
  seed: number
  angle: number
  width: number
  nebAt: [number, number]
  bandAt: [number, number]
  /** How far the star field has turned (a spin turns it), and which of the stars are its own (a seed). */
  roll: number
  stars: number
  /** Its hold (seconds), and when it appeared (live time). */
  hold: number
  born: number
  home: Shot
}

/** Off the tour: how long each holds, and how long a change takes (seconds). */
export const DRIFT = { hold: [40, 55] as const, change: [4.5, 6.5] as const }
/** How fast the stars stream at the height of a change that travels (units a second). */
export const WARP = { speed: 22, tour: 0.4 } as const
/** How far a spin turns the sky (radians). */
const SPIN = 1.1

// ── a seeded draw, and bags that never repeat until they empty ───────────────
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
class Bag {
  private left: number[] = []
  private last = -1
  constructor(
    private n: number,
    private r: () => number,
  ) {}
  next() {
    if (!this.left.length) {
      this.left = Array.from({ length: this.n }, (_, i) => i)
      for (let i = this.left.length - 1; i > 0; i--) {
        const j = Math.floor(this.r() * (i + 1))
        ;[this.left[i], this.left[j]] = [this.left[j], this.left[i]]
      }
      // a new round never begins with what the last one ended on
      const end = this.left.length - 1
      if (this.left[end] === this.last && this.n > 1) [this.left[0], this.left[end]] = [this.left[end], this.left[0]]
    }
    this.last = this.left.pop()!
    return this.last
  }
}

const q = () => (typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search))
const fromQuery = (name: string, n: number) => {
  const v = Number(q().get(name))
  return q().has(name) && Number.isInteger(v) && v >= 0 && v < n ? v : -1
}
let draw: () => number = Math.random
let skies: Bag | null = null
let changes: Bag | null = null
function begin() {
  if (skies) return
  const fixed = Number(q().get('seed'))
  // a held shot (a poster, `?shot=`) always draws the same; a visit, its own
  const seed = Number.isFinite(fixed) && q().has('seed') ? fixed : q().has('shot') ? 7 : (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0
  draw = rng(seed)
  skies = new Bag(SKIES.length, draw)
  // the landing sky is the first of the first round: the bag never deals it again straight away
  skies.next()
  changes = new Bag(CHANGES.length, draw)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

let heldSky = -2
let heldChange = -2
let holdOverride = -2
function holdFor() {
  if (holdOverride === -2) {
    const d = Number(q().get('drift'))
    holdOverride = Number.isFinite(d) && d > 0 ? d : -1
  }
  return holdOverride > 0 ? holdOverride : lerp(DRIFT.hold[0], DRIFT.hold[1], draw())
}

/** A new showing of a sky from the bag: drawn afresh, so no two are the same picture. */
function make(home: Shot, born: number, prev: Universe, style: number): Universe {
  begin()
  if (heldSky === -2) heldSky = fromQuery('sky', SKIES.length)
  const sky = heldSky >= 0 ? heldSky : skies!.next()
  const s = SKIES[sky]
  return {
    sky,
    seed: 1 + draw() * 40,
    angle: s.angle + (draw() - 0.5) * 0.5,
    width: s.width * (0.85 + draw() * 0.3),
    nebAt: [(draw() - 0.5) * 0.2, (draw() - 0.5) * 0.12],
    bandAt: [(draw() - 0.5) * 0.12, (draw() - 0.5) * 0.14],
    roll: prev.roll + (CHANGES[style] === 'spin' ? SPIN : 0),
    stars: 1 + Math.floor(draw() * 97),
    hold: holdFor(),
    born,
    home,
  }
}

/** The landing sky: always the same — the one the title's poster shows. */
function landing(): Universe {
  const h = fromQuery('sky', SKIES.length)
  const s = SKIES[h > 0 ? h : 0]
  return { sky: h > 0 ? h : 0, seed: 5.7, angle: s.angle, width: s.width, nebAt: [0.02, -0.02], bandAt: [0, 0], roll: 0, stars: 11, hold: 0, born: 0, home: 0 }
}

/** A change: which of the ten, the direction it runs (the pans, the leak, the wipe), and its length. */
function change() {
  begin()
  if (heldChange === -2) heldChange = fromQuery('change', CHANGES.length)
  const a = Math.floor(draw() * 4) * (Math.PI / 2)
  return { style: heldChange >= 0 ? heldChange : changes!.next(), dir: [Math.round(Math.cos(a)), Math.round(Math.sin(a))] as [number, number], length: lerp(DRIFT.change[0], DRIFT.change[1], draw()) }
}

/** Where the universe is: one sky showing (`from`), or a change under way to the next (`to`, `k` of the way). */
export const universe = {
  from: landing() as Universe,
  to: null as Universe | null,
  k: 0,
  style: 0,
  dir: [1, 0] as [number, number],
  /** How hard the stars stream (forward, or back for a pull), and how far they have streamed. */
  warp: 0,
  travelled: 0,
  /** A whip pan's sideways rush, for the stars' streaks. */
  sweep: [0, 0] as [number, number],
  /** A change is near, under way or just past (0–1): the line's light hurries with it. */
  hurry: 0,
  // off the tour: when the current change began (live time; < 0 none), and its length
  changeAt: -1,
  changeLength: 6,
  /** When the last change ended (live time): the line keeps hurrying a while after. */
  endedAt: -100,
  /** The tour's plan: a sky for each shot, a change for each journey. */
  plan: null as null | { at: Universe[]; changes: { style: number; dir: [number, number] }[] },
}

const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)
let wasTouring = false

/** Moves the universe on to `now` (live time, seconds) — once a frame, before anything reads it. */
export function updateUniverse(place: Place | null, now: number, dt: number) {
  const u = universe
  if (!place) return
  const reduced = heroState.reduced
  // anywhere but the title, the scroll (or a held shot — a poster, `?shot=`) says which sky
  const touring = heroState.tour || place.seg.kind !== 'hold' || place.seg.shot !== 0
  if (touring) {
    if (!u.plan) {
      // the tour's plan: the title keeps the one showing; each space and the close a new one; each journey its change
      const at: Universe[] = [u.to && u.k > 0.5 ? u.to : u.from]
      const changes = [change(), change(), change(), change()]
      for (const shot of [1, 2, 3, 4] as Shot[]) at.push(make(shot, now, at[at.length - 1], changes[shot - 1].style))
      u.plan = { at, changes }
      u.changeAt = -1
    }
    const { seg, t } = place
    if (seg.kind === 'hold') {
      u.from = u.plan.at[seg.shot]
      u.to = null
      u.k = 0
    } else {
      const c = u.plan.changes[Math.min(seg.from, seg.to)]
      u.from = u.plan.at[seg.from]
      u.to = u.plan.at[seg.to]
      u.k = ease(smoothstep(0.12, 0.88, t))
      u.style = c.style
      u.dir = c.dir
    }
    u.hurry = 0
  } else {
    if (wasTouring && u.plan) {
      // back on the one-screen hero: the sky it left on, holding afresh before it moves on
      u.from = u.plan.at[0]
      u.from.born = now
      u.from.hold = holdFor()
      u.plan = null
      u.to = null
      u.k = 0
      u.changeAt = -1
    }
    if (u.from.hold === 0) {
      // the landing sky holds as long as any
      begin()
      u.from.hold = holdFor()
      u.from.born = now
    }
    if (heldSky === -2) heldSky = fromQuery('sky', SKIES.length)
    if (!reduced && heldSky < 0 && u.changeAt < 0 && now - u.from.born > u.from.hold) {
      const c = change()
      u.to = make(0, now, u.from, c.style)
      u.style = c.style
      u.dir = c.dir
      u.changeLength = c.length
      u.changeAt = now
    }
    if (u.changeAt >= 0) {
      const k = (now - u.changeAt) / u.changeLength
      if (k >= 1) {
        u.from = u.to!
        u.to = null
        u.k = 0
        u.changeAt = -1
        u.endedAt = now
      } else u.k = ease(k)
    }
    // the line hurries as a change nears (4 s ahead), through it, and for 5 s after
    const before = u.changeAt >= 0 ? 1 : smoothstep(u.from.hold - 4, u.from.hold - 0.5, now - u.from.born)
    const after = 1 - smoothstep(1, 5, now - u.endedAt)
    u.hurry = reduced || heldSky >= 0 ? 0 : Math.max(before, after)
  }
  wasTouring = touring
  // the stars: forward on a push or hyperspace, back on a pull; sideways streaks on a whip pan
  const mid = u.to ? Math.sin(Math.PI * u.k) : 0
  const moving = touring ? Math.min(1, Math.abs(heroState.speed) * 6) * WARP.tour : 1
  const name = CHANGES[u.style]
  const forward = name === 'push' ? 1 : name === 'hyperspace' ? 2.6 : name === 'pull' ? -1 : 0
  u.warp = reduced ? 0 : mid * moving * forward
  u.travelled += u.warp * WARP.speed * dt
  const side = name === 'whip' && !reduced ? mid * (touring ? moving : 1) : 0
  u.sweep = [u.dir[0] * side, u.dir[1] * side]
}

export type SkyMotion = { a: [number, number, number, number]; b: [number, number, number, number]; wa: number; wb: number }

/**
 * How each of the two skies moves during a change (uv: offset x, y, zoom, turn), and how much of each shows.
 * The masked changes (iris, dissolve, leak, wipe, black) show both whole: the shaders' mask decides.
 */
export function skyMotion(out: SkyMotion) {
  const u = universe
  const k = u.to ? u.k : 0
  out.a = [0, 0, 1, 0]
  out.b = [0, 0, 1, 0]
  out.wa = 1
  out.wb = 0
  if (!u.to) return out
  const name = CHANGES[u.style]
  const [dx, dy] = u.dir
  out.wb = 1
  if (name === 'push') {
    // the old swells past the camera, the new grows in from far away
    out.a[2] = 1 + 1.4 * k
    out.b[2] = 0.45 + 0.55 * k
    out.wa = Math.pow(1 - k, 1.4)
    out.wb = Math.pow(k, 1.1)
  } else if (name === 'pull') {
    // the old falls away into the distance, the new comes in from beyond the camera
    out.a[2] = 1 / (1 + 1.3 * k)
    out.b[2] = 1.9 - 0.9 * k
    out.wa = Math.pow(1 - k, 1.4)
    out.wb = Math.pow(k, 1.1)
  } else if (name === 'whip') {
    // the old flies out to one side, the new in from the other
    out.a[0] = dx * 0.6 * k * k
    out.a[1] = dy * 0.36 * k * k
    out.b[0] = -dx * 0.6 * (1 - k) * (1 - k)
    out.b[1] = -dy * 0.36 * (1 - k) * (1 - k)
    out.wa = 1 - smoothstep(0.25, 0.75, k)
    out.wb = smoothstep(0.25, 0.75, k)
  } else if (name === 'spin') {
    // the old twists away, the new untwists into place (the stars turn with it)
    out.a[3] = SPIN * k
    out.a[2] = 1 + 0.25 * k
    out.b[3] = -SPIN * (1 - k)
    out.b[2] = 1.25 - 0.25 * k
    out.wa = 1 - k
    out.wb = k
  } else if (name === 'hyperspace') {
    // the old rushes at the camera and is gone, the new swells out of a point
    out.a[2] = 1 + 5 * k * k
    out.b[2] = 0.15 + 0.85 * Math.pow(k, 0.7)
    out.wa = Math.pow(1 - k, 2)
    out.wb = Math.pow(k, 1.5)
  }
  return out
}
