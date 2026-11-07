/**
 * THE UNIVERSE — the quiet sky behind the logo, and how it changes (the owner, 2026-11-06: "i dont like
 * background outerspace that is too busy … the previous 2 or 3 backgrounds were more subtle and good i wanted
 * you to just advance them a little … no more planets at the background just the stars, sometimes shooting,
 * some pulsating, then a subtle outerspace nebular … not use one animation when background switch … many
 * and at random").
 *
 * A sky is stars and a subtle nebula, one of twelve different pictures (round 6, the owner, 2026-11-07: the
 * skies were "full of nebula smudges and nothing different"): a calm night, a Milky Way's core, fine threads,
 * a dark cloud across a star field, a faint hydrogen glow, a reflection's blue haze, a deep field, a band low
 * on the sky, silver, cyanotype, ember, twin clouds across a rift — each painted once a showing in full detail
 * (skybake.ts). Each time one shows it is drawn afresh — its clouds from a new seed, its band at a new slope
 * and place — so even a sky that returns is never the same picture. It lives while it shows (LIFE), holds
 * 40–55 s, then gives way to the next by one of ten quiet changes, slow and soft-edged,
 * across the whole sky, its stars included (the owner, 2026-11-07: "nothing noisy or loud or hard just
 * subtle like outerspace"): a crossfade, a gentle push or pull, a turn, a glide or a rise, the new clouds
 * condensing out of the old, the new sky blooming by its own light, a breath of dark, a rack focus.
 *
 * Never in a change, ever (the owner, 2026-11-07: "those types must go permanently"): a circle that opens
 * or closes across the screen (the iris), a line or lines sweeping across it (the anamorphic wipe), a flash,
 * or stars rushing into streaks (the whip pan, hyperspace).
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
/**
 * A sky's recipe: the same layers for every sky, weighted differently, so each is a different picture, not
 * a different tint (the owner, 2026-11-07: "full of nebula smudges and nothing different"). Painted once a
 * showing, per texel (skybake.ts, shaders.ts SKYBAKE_FRAG).
 */
export type Sky = {
  name: string
  /** Colours: the clouds' two and their accent, the Milky Way's core and its edges, the far glow. */
  a: HSL
  b: HSL
  accent: HSL
  band: HSL
  edge: HSL
  glow: HSL
  /** The layers (0–1): clouds (warped), threads (thin filaments), the Milky Way, dark dust, the far glow, one
   * sinuous dark cloud, fine streaks through the clouds, blue halos round the bright stars. */
  clouds: number
  threads: number
  milky: number
  dust: number
  glowing: number
  ribbon: number
  streaks: number
  halos: number
  /** How much of the sky the clouds take (0–1), their size (1 as drawn; larger is larger), and how far their
   * two colours part to either side (0 mixed through the clouds, 1 one each side of the sky). */
  cover: number
  scale: number
  split: number
  /** The fine stars' density (0–1) and how many bright stars (0–6). */
  stars: number
  bright: number
  /** The Milky Way's slope (radians), its width, and where it crosses (its height on the sky). */
  angle: number
  width: number
  low: number
  /** Its light overall, and how much its clouds churn as they live (1 as most). */
  light: number
  flow?: number
}

const NO = { clouds: 0, threads: 0, milky: 0, dust: 0, glowing: 0, ribbon: 0, streaks: 0, halos: 0, split: 0, low: 0 }
export const SKIES: readonly Sky[] = [
  // 0 · night — the landing: deep blue, a faint violet and teal haze, a whisper of a band, sparse stars
  { ...NO, name: 'night', a: [228, 62, 50], b: [262, 48, 40], accent: [186, 64, 56], band: [222, 30, 82], edge: [262, 34, 62], glow: [228, 60, 42],
    clouds: 0.7, threads: 0.12, milky: 0.45, dust: 0.25, glowing: 0.6, cover: 0.42, scale: 1.2, stars: 0.32, bright: 3, angle: -0.42, width: 0.9, light: 1 },
  // 1 · milky way — the galaxy's core: a warm band, crisp dust lanes, dense star clouds, cool edges
  { ...NO, name: 'milky way', a: [32, 40, 56], b: [218, 40, 44], accent: [40, 70, 70], band: [40, 46, 84], edge: [214, 40, 66], glow: [30, 40, 42],
    clouds: 0.1, milky: 1, dust: 0.3, glowing: 0.25, cover: 0.3, scale: 1, stars: 0.62, bright: 4, angle: 0.5, width: 1.15, light: 1 },
  // 2 · veil — fine teal and rose threads arcing across the dark
  { ...NO, name: 'veil', a: [178, 60, 54], b: [336, 56, 56], accent: [200, 70, 70], band: [200, 30, 80], edge: [300, 30, 60], glow: [262, 40, 40],
    clouds: 0.2, threads: 1, dust: 0.1, glowing: 0.2, cover: 0.48, scale: 1.1, split: 0.5, stars: 0.26, bright: 2, angle: 0.2, width: 1, light: 1 },
  // 3 · dark cloud — a rich star field crossed by one sinuous cloud of dust, its edge faintly lit
  { ...NO, name: 'dark cloud', a: [28, 44, 50], b: [220, 30, 44], accent: [36, 70, 64], band: [40, 30, 82], edge: [220, 30, 62], glow: [30, 30, 40],
    clouds: 0.5, milky: 0.6, dust: 0.15, glowing: 0.35, ribbon: 1, cover: 0.6, scale: 1, stars: 1, bright: 3, angle: -0.3, width: 1.8, light: 1 },
  // 4 · hydrogen — a wide, very faint rose-red glow with a fine bubbled texture
  { ...NO, name: 'hydrogen', a: [352, 62, 50], b: [328, 50, 36], accent: [12, 70, 62], band: [350, 30, 80], edge: [330, 30, 60], glow: [350, 50, 40],
    clouds: 0.75, threads: 0.35, dust: 0.2, glowing: 0.2, cover: 0.72, scale: 1.6, stars: 0.36, bright: 2, angle: 0.3, width: 1, light: 0.85 },
  // 5 · reflection — a soft blue haze streaked with fine dust round a loose group of brighter stars
  { ...NO, name: 'reflection', a: [212, 70, 60], b: [226, 60, 42], accent: [200, 80, 74], band: [214, 30, 82], edge: [230, 30, 62], glow: [220, 60, 42],
    clouds: 0.72, dust: 0.3, glowing: 0.2, streaks: 1, halos: 1, cover: 0.4, scale: 0.9, stars: 0.42, bright: 6, angle: -0.5, width: 1, light: 1 },
  // 6 · deep field — nearly void: countless faint stars and a cool whisper of light
  { ...NO, name: 'deep field', a: [222, 30, 52], b: [250, 30, 38], accent: [200, 40, 62], band: [222, 20, 82], edge: [240, 20, 62], glow: [224, 50, 42],
    clouds: 0.12, glowing: 0.4, cover: 0.3, scale: 1.4, stars: 1, bright: 2, angle: 0.1, width: 1, light: 1 },
  // 7 · edge-on — the band low and wide near the bottom, a violet-to-teal glow under open sky
  { ...NO, name: 'edge-on', a: [268, 40, 48], b: [182, 45, 42], accent: [190, 60, 62], band: [262, 30, 80], edge: [186, 40, 60], glow: [262, 50, 40],
    clouds: 0.3, milky: 0.75, dust: 0.25, glowing: 0.7, cover: 0.3, scale: 1.2, split: 0.6, stars: 0.5, bright: 3, angle: 0.06, width: 1.5, low: 1, light: 1 },
  // 8 · silver — round 3's silver nitrate, refined: a monochrome nebula cut by dust
  { ...NO, name: 'silver', a: [220, 7, 64], b: [230, 6, 44], accent: [40, 14, 78], band: [40, 8, 86], edge: [218, 6, 64], glow: [220, 8, 44],
    clouds: 0.8, milky: 0.25, dust: 0.45, glowing: 0.2, cover: 0.5, scale: 1.2, stars: 0.45, bright: 3, angle: 0.3, width: 1.2, light: 0.9 },
  // 9 · cyanotype — blue clouds laced with fine threads
  { ...NO, name: 'cyanotype', a: [208, 70, 54], b: [222, 60, 38], accent: [196, 70, 68], band: [206, 40, 84], edge: [226, 36, 62], glow: [214, 60, 40],
    clouds: 0.55, threads: 0.6, dust: 0.2, glowing: 0.2, cover: 0.5, scale: 1.1, stars: 0.4, bright: 2, angle: -0.48, width: 1, light: 0.95 },
  // 10 · ember — faint amber and umber clouds cut by lanes of dust
  { ...NO, name: 'ember', a: [32, 56, 50], b: [14, 46, 36], accent: [42, 76, 64], band: [38, 40, 82], edge: [24, 30, 60], glow: [28, 50, 40],
    clouds: 0.6, milky: 0.2, dust: 0.55, glowing: 0.2, cover: 0.5, scale: 1.3, stars: 0.42, bright: 3, angle: 0.22, width: 1.1, light: 0.9 },
  // 11 · twin — teal and violet clouds facing across a dark rift
  { ...NO, name: 'twin', a: [182, 55, 48], b: [276, 46, 50], accent: [196, 60, 66], band: [200, 30, 80], edge: [270, 30, 60], glow: [230, 40, 40],
    clouds: 0.8, dust: 0.3, glowing: 0.15, ribbon: 0.6, cover: 0.62, scale: 1.1, split: 1, stars: 0.4, bright: 2, angle: 0.1, width: 1, light: 0.82 },
  // 12 · the Suite's own (the tour only, never dealt): a violet and rose veil, its threads slowly flowing (the
  // owner, 2026-11-07, of the ride from the Client to the Suite: "use another subtle and different animated
  // outerspace universe")
  { ...NO, name: 'suite veil', a: [276, 52, 60], b: [330, 52, 60], accent: [300, 62, 74], band: [280, 30, 82], edge: [320, 30, 62], glow: [272, 50, 42],
    clouds: 0.32, threads: 0.62, dust: 0.12, glowing: 0.3, cover: 0.55, scale: 1.05, split: 0.45, stars: 0.3, bright: 3, angle: -0.2, width: 1, light: 0.9, flow: 1.7 },
]
/** The skies dealt off the tour (the bag): all but the Suite's own. */
const DEALT = 12

/**
 * On the tour each space has its own sky, a fresh draw of its kind every visit: the Crew a Milky Way's core,
 * the Client a reflection's blue haze, the Suite its own violet veil, the close the night it began on. The
 * title keeps whichever sky was showing; if that was the Crew's kind, the Crew takes the dark cloud. The ride
 * from the Client to the Suite turns slowly into the Suite's sky.
 */
export const TOUR = { skies: [-1, 1, 5, 12, 0] as const, crewElse: 3, suiteChange: 'turn' } as const

export const CHANGES = ['crossfade', 'push', 'pull', 'turn', 'glide', 'rise', 'condense', 'bloom', 'dim', 'focus'] as const

export type Universe = {
  /** Which showing this is (the bake's key). */
  id: number
  sky: number
  /** This showing's own draw: its clouds' seed, its band's slope and width, where its clouds and band sit
   * (the sky's own frame: x across −0.84…0.84, y up −0.5…0.5), the far glow's bearing, its bright stars
   * (uv x, y, brightness, halo — six). */
  seed: number
  angle: number
  width: number
  nebAt: [number, number]
  bandAt: [number, number]
  glow: number
  glints: number[]
  /** Its slow life while it shows: the way it drifts (x, y) and where in its drift it starts (a phase). */
  life: [number, number, number]
  /** How far the sky has turned when this one is square (a turn turns it), and which of the stars are its own (a seed). */
  roll: number
  stars: number
  /** Its hold (seconds), and when it appeared (live time). */
  hold: number
  born: number
  home: Shot
}

/** Off the tour: how long each holds, and how long a change takes (seconds). */
export const DRIFT = { hold: [40, 55] as const, change: [7, 10] as const }
/** How fast the stars drift at the height of a push or a pull (units a second: slow enough never to streak). */
export const WARP = { speed: 22, push: 0.22, pull: -0.2, tour: 0.4 } as const
/** How far a turn turns the sky (radians), and how far a glide or a rise carries it (a share of the sky). */
const TURN = 0.32
const GLIDE = 0.045

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
  skies = new Bag(DEALT, draw)
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

let nextId = 1
/** A held shot (a poster, `?shot=`) shows the sky at its first moment, as the live scene takes over from it. */
let heldShot: boolean | null = null
export const skyHeld = () => (heldShot ??= q().has('shot'))
/**
 * A sky lives while it shows (the owner, 2026-11-07: the backgrounds must "have a very slight subtle changes
 * smooth during its stay … nothing noisy or loud"): the whole sky turns slowly one way and back (the stars, the
 * clouds and the bright stars together; bounded, so the sky's edge never shows), each showing drifts and grows a
 * little, as a slow camera would (its fine stars with it, against the near stars), and its clouds churn and
 * their light wanders (shaders.ts GALAXY_VERT). All of it still under reduced motion.
 */
export const LIFE = { spin: 0.08, spinPeriod: 240, drift: 0.016, driftPeriod: 170, zoom: 0.035, zoomPeriod: 130 } as const
const lifeFor = (r: () => number): [number, number, number] => {
  const a = r() * Math.PI * 2
  return [Math.cos(a), Math.sin(a) * 0.6, r() * Math.PI * 2]
}
/** The sky's own frame: its width over its height (HeroScene's SKY plane, 640 × 380). */
export const SKY_ASPECT = 640 / 380

/** Six bright stars for a showing: a loose group round its clouds (a reflection), or scattered over the view. */
function glintsFor(s: Sky, at: [number, number], r: () => number) {
  const out: number[] = []
  for (let i = 0; i < 6; i++) {
    const on = i < s.bright
    const grouped = s.halos > 0
    const x = grouped ? at[0] + (r() - 0.5) * 0.26 : (r() - 0.5) * 0.8
    const y = grouped ? at[1] + (r() - 0.5) * 0.18 : (r() - 0.5) * 0.46
    out.push(0.5 + x / SKY_ASPECT, 0.5 + y, on ? 0.35 + r() * 0.65 : 0, grouped ? 0.6 + r() * 0.4 : 0)
  }
  return out
}

/** A new showing of a sky (from the bag, or the one asked for): drawn afresh, so no two are the same picture. */
function make(home: Shot, born: number, prev: Universe, pick = -1): Universe {
  begin()
  if (heldSky === -2) heldSky = fromQuery('sky', SKIES.length)
  const sky = heldSky >= 0 ? heldSky : pick >= 0 ? pick : skies!.next()
  const s = SKIES[sky]
  const nebAt: [number, number] = [(draw() - 0.5) * 0.36, (draw() - 0.5) * 0.2]
  return {
    id: nextId++,
    sky,
    seed: 1 + draw() * 40,
    angle: s.angle + (draw() - 0.5) * 0.5,
    width: s.width * (0.85 + draw() * 0.3),
    nebAt,
    bandAt: [(draw() - 0.5) * 0.2, s.low ? -0.2 - draw() * 0.06 : (draw() - 0.5) * 0.16],
    glow: s.low ? -Math.PI / 2 + (draw() - 0.5) * 0.4 : draw() * Math.PI * 2,
    glints: glintsFor(s, nebAt, draw),
    life: lifeFor(draw),
    roll: prev.roll,
    stars: 1 + Math.floor(draw() * 97),
    hold: holdFor(),
    born,
    home,
  }
}

/** The landing sky: always the same — the one the title's poster shows. */
function landing(): Universe {
  const h = fromQuery('sky', SKIES.length)
  const sky = h > 0 ? h : 0
  const s = SKIES[sky]
  const nebAt: [number, number] = [0.16, 0.06]
  return {
    id: nextId++, sky, seed: 5.7, angle: s.angle, width: s.width, nebAt, bandAt: [0.02, s.low ? -0.22 : 0.04], glow: s.low ? -Math.PI / 2 : -2.4,
    glints: glintsFor(s, nebAt, rng(57)), life: [0.8, 0.6, 0.4], roll: 0, stars: 11, hold: 0, born: 0, home: 0,
  }
}

/** A change: which of the ten, the way it runs (a glide's or a rise's), and its length. */
function change() {
  begin()
  if (heldChange === -2) heldChange = fromQuery('change', CHANGES.length)
  const dir: [number, number] = [draw() < 0.5 ? -1 : 1, draw() < 0.5 ? -1 : 1]
  return { style: heldChange >= 0 ? heldChange : changes!.next(), dir, length: lerp(DRIFT.change[0], DRIFT.change[1], draw()) }
}

/** Where the universe is: one sky showing (`from`), or a change under way to the next (`to`, `k` of the way). */
export const universe = {
  from: landing() as Universe,
  to: null as Universe | null,
  /** Off the tour: the sky that comes next, drawn early so it can be painted during this one's hold. */
  next: null as Universe | null,
  k: 0,
  style: 0,
  dir: [1, 0] as [number, number],
  /** How hard the stars drift (forward on a push, back on a pull), and how far they have drifted. */
  warp: 0,
  travelled: 0,
  /** How far the sky has turned now (the stars and the clouds turn together), and the time it is (live). */
  roll: 0,
  now: 0,
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
/** Where a sky after `prev` sits square: a turn turns it, a little either way. */
const turned = (prev: Universe, style: number) => prev.roll + (CHANGES[style] === 'turn' ? TURN * (draw() < 0.5 ? -1 : 1) : 0)
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
      changes[2].style = CHANGES.indexOf(TOUR.suiteChange)
      for (const shot of [1, 2, 3, 4] as Shot[]) {
        const prev = at[at.length - 1]
        const kind = shot === 1 && at[0].sky === TOUR.skies[1] ? TOUR.crewElse : TOUR.skies[shot]
        const next = make(shot, now, prev, kind)
        next.roll = turned(prev, changes[shot - 1].style)
        at.push(next)
      }
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
    const drifting = !reduced && heldSky < 0
    // the next sky is drawn as soon as this one settles, so it is painted long before it is needed
    if (drifting && !u.next && !u.to) u.next = make(0, now, u.from)
    if (drifting && u.changeAt < 0 && now - u.from.born > u.from.hold) {
      const c = change()
      u.to = u.next ?? make(0, now, u.from)
      u.next = null
      u.to.born = now
      u.to.hold = holdFor()
      u.to.roll = turned(u.from, c.style)
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
  // the stars drift gently forward on a push, back on a pull — never fast enough to streak
  const mid = u.to ? Math.sin(Math.PI * u.k) : 0
  const moving = touring ? Math.min(1, Math.abs(heroState.speed) * 6) * WARP.tour : 1
  const name = CHANGES[u.style]
  const forward = name === 'push' ? WARP.push : name === 'pull' ? WARP.pull : 0
  u.warp = reduced ? 0 : mid * moving * forward
  u.travelled += u.warp * WARP.speed * dt
  const spin = reduced || skyHeld() ? 0 : LIFE.spin * Math.sin((2 * Math.PI * now) / LIFE.spinPeriod)
  u.roll = spin + (u.to ? u.from.roll + (u.to.roll - u.from.roll) * u.k : u.from.roll)
  u.now = now
}

/** A showing's own slow drift (uv offset x, y) and growth (zoom) at `now`: nothing at its birth, bounded after. */
function lived(sky: Universe, now: number, out: V4) {
  if (heroState.reduced || skyHeld()) return out
  const age = Math.max(0, now - sky.born)
  const [dx, dy, ph] = sky.life
  const w = (2 * Math.PI) / LIFE.driftPeriod
  const d = LIFE.drift * (Math.sin(age * w + ph) - Math.sin(ph))
  out[0] += dx * d
  out[1] += dy * d
  out[2] *= 1 + LIFE.zoom * 0.5 * (1 - Math.cos((age * 2 * Math.PI) / LIFE.zoomPeriod))
  return out
}

type V4 = [number, number, number, number]
export type SkyMotion = {
  /** Each sky's move (uv offset x, y, zoom, turn about the gaze): the leaving one, the arriving one. */
  a: V4
  b: V4
  /** How much of each sky's clouds show, and of each sky's own stars. */
  fade: [number, number]
  stars: [number, number]
  /** Each sky's softness (a rack focus, in mip levels). */
  blur: [number, number]
  /** A condense or a bloom under way (0 or 1: the shaders' masks), and how far it has gone (0–1). */
  cond: number
  bloom: number
  t: number
}

const sm = smoothstep
/**
 * How each of the two skies moves and shows during a change. Every change is slow and soft: the skies move
 * a little (a zoom of a fifth at most, a turn of under twenty degrees, a glide of a tenth of the screen) and
 * cross with long, soft weights; a condense or a bloom hands its mask to the shaders (CHANGE).
 */
export function skyMotion(out: SkyMotion) {
  const u = universe
  const k = u.to ? u.k : 0
  out.a = [0, 0, 1, u.roll - u.from.roll]
  out.b = [0, 0, 1, u.to ? u.roll - u.to.roll : 0]
  out.fade = [1, 0]
  out.stars = [1, 0]
  out.blur = [0, 0]
  out.cond = 0
  out.bloom = 0
  out.t = k
  if (!u.to) {
    lived(u.from, u.now, out.a)
    return out
  }
  const name = CHANGES[u.style]
  const cross = (a: number, b: number) => {
    out.fade = [1 - sm(a, b, k), sm(a, b, k)]
    out.stars = [out.fade[0], out.fade[1]]
  }
  cross(0.1, 0.9)
  if (name === 'crossfade') {
    // both drift a touch forward as they cross
    out.a[2] = 1 + 0.05 * k
    out.b[2] = 0.96 + 0.04 * k
  } else if (name === 'push') {
    // the old swells gently past, the new settles in from a little further
    out.a[2] = 1 + 0.22 * k
    out.b[2] = 0.84 + 0.16 * k
    cross(0.15, 0.85)
  } else if (name === 'pull') {
    out.a[2] = 1 / (1 + 0.2 * k)
    out.b[2] = 1.18 - 0.18 * k
    cross(0.15, 0.85)
  } else if (name === 'glide' || name === 'rise') {
    // the clouds glide on one way: the old out, the new in from behind it (the stars cross where they are)
    const [dx, dy] = name === 'glide' ? [u.dir[0] || 1, 0] : [0, u.dir[1] || 1]
    const g = name === 'glide' ? GLIDE : GLIDE * 0.75
    out.a[0] = dx * g * k
    out.a[1] = dy * g * k
    out.b[0] = -dx * g * (1 - k)
    out.b[1] = -dy * g * (1 - k)
    cross(0.2, 0.8)
  } else if (name === 'condense') {
    out.fade = [1, 1]
    out.stars = [1, 1]
    out.cond = 1
  } else if (name === 'bloom') {
    out.fade = [1, 1]
    out.stars = [1, 1]
    out.bloom = 1
  } else if (name === 'dim') {
    // a slow breath of dark: the old dims to a quarter, the new rises from there
    const down = 1 - 0.75 * sm(0, 0.5, k)
    const up = 0.25 + 0.75 * sm(0.5, 1, k)
    const x = sm(0.42, 0.58, k)
    out.fade = [down * (1 - x), up * x]
    out.stars = [(0.4 + 0.6 * down) * (1 - x), (0.4 + 0.6 * up) * x]
  } else if (name === 'focus') {
    // a rack focus: the old goes soft as it leaves, the new comes up from soft to sharp
    out.blur = [5 * sm(0, 0.6, k), 5 * (1 - sm(0.4, 1, k))]
    cross(0.2, 0.8)
    out.fade = [1 - sm(0.3, 0.75, k), sm(0.25, 0.7, k)]
  }
  lived(u.from, u.now, out.a)
  lived(u.to, u.now, out.b)
  return out
}
