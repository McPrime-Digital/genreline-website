/**
 * THE UNIVERSE — what is out there behind the logo, and how it changes (the owner, 2026-11-06: "all these
 * should have a random mix ups so that it cannot follow the same pattern or same background appearing more
 * than once in 10 mins … there isnt subtle change in the current universe then the next one pushes in").
 *
 * A universe is one phenomenon (phenomena.ts) in a film stock's palette, set somewhere new in the sky at
 * its own size and turn. It holds 38–55 s, changing slowly all the while (the phenomenon's own evolution),
 * then gives way to the next by one of ten changes (push in, pull out, whip pan, spin, iris, dissolve, light
 * leak, anamorphic wipe, fade through black, hyperspace), 4.5–7 s.
 *
 * Never the same: phenomena, palettes and changes are each drawn from a shuffle bag, so a phenomenon comes
 * back only once all fourteen have shown (over ten minutes at these holds), and then in another palette,
 * place and size; the same change never runs twice in a row.
 *
 * On the tour each space has its own universe (planned when the tour starts — the title keeps the one on
 * screen, so taking the tour never jumps), and each journey its own change, scrubbed by the scroll.
 *
 * The first universe, on landing, is always the same one — the one the title's poster shows — so the live
 * scene takes over from the poster without a seam. `?universe=0–13` holds a phenomenon, `?seed=` fixes the
 * draw, `?drift=<s>` shortens the hold.
 */
import { heroState, smoothstep, type Place } from '@/components/hero/state'
import { CHANGES, PHENOMENA, PHENOMENON_LOOK } from '@/components/hero/scene/phenomena'
import type { Shot } from '@/components/hero/scene/numbers'

/** Film stocks: each phenomenon's three colours (display space, 0–1). */
export const PALETTES: readonly (readonly [number, number, number][])[] = [
  [[0.95, 0.78, 0.45], [0.35, 0.5, 0.9], [1.0, 0.86, 0.6]], // today: gold and night blue
  [[0.92, 0.3, 0.35], [0.25, 0.75, 0.78], [1.0, 0.82, 0.55]], // three-strip Technicolor: crimson and teal
  [[0.95, 0.55, 0.25], [0.2, 0.6, 0.72], [1.0, 0.9, 0.6]], // Eastmancolor: orange and teal
  [[0.85, 0.82, 0.78], [0.55, 0.58, 0.64], [1.0, 0.98, 0.94]], // silver nitrate
  [[0.9, 0.62, 0.34], [0.55, 0.38, 0.22], [1.0, 0.85, 0.6]], // sepia, the silent era's amber tint
  [[0.35, 0.6, 1.0], [0.2, 0.32, 0.75], [0.8, 0.9, 1.0]], // cyanotype
  [[0.9, 0.35, 0.7], [0.35, 0.85, 0.55], [1.0, 0.85, 0.9]], // Fujichrome: magenta and green
  [[0.98, 0.42, 0.28], [0.95, 0.8, 0.35], [0.5, 0.65, 1.0]], // Kodachrome: red, yellow, a blue sky
  [[0.7, 0.72, 0.7], [0.4, 0.5, 0.55], [0.95, 0.9, 0.8]], // bleach bypass: steel
  [[0.7, 0.45, 1.0], [0.3, 0.85, 0.95], [1.0, 0.8, 0.95]], // the digital present: violet and cyan
]

export type Universe = {
  kind: number
  palette: number
  seed: number
  /** Where it stands, as a share of the frame from its middle (x, y: −1…1), its size and turn. */
  at: [number, number]
  scale: number
  rot: number
  intensity: number
  /** Its hold (seconds), and when it appeared (live time) — for its slow change while it holds. */
  hold: number
  born: number
  /** The shot whose frame it is placed in. */
  home: Shot
}

/** Where a phenomenon can stand without crowding the logo or the words: shares of the frame, wide and tall. */
const ZONES = {
  wide: [[-0.55, 0.45], [0.6, 0.52], [0.72, -0.05], [0.5, -0.55], [-0.08, 0.6], [-0.6, -0.55], [0.15, -0.6]],
  tall: [[-0.45, 0.55], [0.48, 0.58], [0.0, 0.66], [-0.5, -0.12], [0.5, -0.2]],
} as const

/** Off the tour: how long each holds, and how long a change takes (seconds). */
export const DRIFT = { hold: [38, 55] as const, change: [4.5, 7] as const }
/** How fast the stars stream at the height of a change that travels (units a second). */
export const WARP = { speed: 22, tour: 0.4 } as const

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
let draw: () => number = Math.random
let kinds: Bag | null = null
let palettes: Bag | null = null
let changes: Bag | null = null
function begin() {
  if (kinds) return
  const fixed = Number(q().get('seed'))
  // a held shot (a poster, `?shot=`) always draws the same; a visit, its own
  const seed = Number.isFinite(fixed) && q().has('seed') ? fixed : q().has('shot') ? 7 : (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0
  draw = rng(seed)
  kinds = new Bag(PHENOMENA.length, draw)
  // the landing universe is the first of the first round: the bag never deals it again straight away
  kinds.next()
  palettes = new Bag(PALETTES.length, draw)
  changes = new Bag(CHANGES.length, draw)
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

let held = -2
function heldKind() {
  if (held === -2) {
    const v = Number(q().get('universe'))
    held = q().has('universe') && Number.isInteger(v) && v >= 0 && v < PHENOMENA.length ? v : -1
  }
  return held
}
let holdOverride = -2
function holdFor() {
  if (holdOverride === -2) {
    const d = Number(q().get('drift'))
    holdOverride = Number.isFinite(d) && d > 0 ? d : -1
  }
  return holdOverride > 0 ? holdOverride : lerp(DRIFT.hold[0], DRIFT.hold[1], draw())
}

/** A new universe from the bags, placed for a shot's frame. */
function make(home: Shot, born: number, tall: boolean): Universe {
  begin()
  const h = heldKind()
  const kind = h >= 0 ? h : kinds!.next()
  const look = PHENOMENON_LOOK[kind]
  const zones = tall ? ZONES.tall : ZONES.wide
  const zone = look.field ? [(draw() - 0.5) * 0.4, (draw() - 0.5) * 0.3] : zones[Math.floor(draw() * zones.length)]
  return {
    kind,
    palette: palettes!.next(),
    seed: Math.floor(draw() * 97),
    at: [zone[0] + (draw() - 0.5) * 0.12, zone[1] + (draw() - 0.5) * 0.1],
    scale: lerp(look.scale[0], look.scale[1], draw()) * (tall ? 0.85 : 1),
    rot: kind === 0 ? (draw() - 0.5) * 0.9 : (draw() - 0.5) * 2.2,
    intensity: 0.8 + draw() * 0.25,
    hold: holdFor(),
    born,
    home,
  }
}

/** The landing universe: always the same — the one the title's poster shows. */
function landing(): Universe {
  const h = heldKind()
  // a phenomenon held by hand (`?universe=`) stands at its own size, high on the right
  if (h > 0) {
    const look = PHENOMENON_LOOK[h]
    const at: [number, number] = look.field ? [0, 0] : [0.55, 0.42]
    return { kind: h, palette: h % PALETTES.length, seed: 11, at, scale: (look.scale[0] + look.scale[1]) / 2, rot: -0.3, intensity: 0.95, hold: 0, born: 0, home: 0 }
  }
  return { kind: 0, palette: 0, seed: 11, at: [0.05, 0.08], scale: 0.28, rot: -0.28, intensity: 0.95, hold: 0, born: 0, home: 0 }
}

/** A change: which of the ten, the direction it runs (the pans, the leak, the wipe), and its length. */
function change() {
  begin()
  const a = Math.floor(draw() * 4) * (Math.PI / 2)
  return { style: changes!.next(), dir: [Math.round(Math.cos(a)), Math.round(Math.sin(a))] as [number, number], length: lerp(DRIFT.change[0], DRIFT.change[1], draw()) }
}

/** Where the universe is: one showing (`from`), or a change under way to the next (`to`, `k` of the way). */
export const universe = {
  from: landing() as Universe,
  to: null as Universe | null,
  k: 0,
  style: 0,
  dir: [1, 0] as [number, number],
  /** The next universe, chosen early (its program is built ahead, so the change never stutters). */
  next: null as Universe | null,
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
  /** The tour's plan: a universe for each shot, a change for each journey. */
  plan: null as null | { at: Universe[]; changes: { style: number; dir: [number, number] }[] },
}

const ease = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)
let wasTouring = false

/** Moves the universe on to `now` (live time, seconds) — once a frame, before anything reads it. */
export function updateUniverse(place: Place | null, now: number, dt: number, tall: boolean) {
  const u = universe
  if (!place) return
  const reduced = heroState.reduced
  // anywhere but the title, the scroll (or a held shot — a poster, `?shot=`) says which universe
  const touring = heroState.tour || place.seg.kind !== 'hold' || place.seg.shot !== 0
  if (touring) {
    if (!u.plan) {
      // the tour's plan: the title keeps the one showing; each space and the close a new one; each journey its change
      const at: Universe[] = [u.to && u.k > 0.5 ? u.to : u.from]
      for (const shot of [1, 2, 3, 4] as Shot[]) at.push(make(shot, now, tall))
      u.plan = { at, changes: [change(), change(), change(), change()] }
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
      // back on the one-screen hero: the universe it left on, holding afresh before it moves on
      u.from = u.plan.at[0]
      u.from.born = now
      u.from.hold = holdFor()
      u.plan = null
      u.to = null
      u.k = 0
      u.changeAt = -1
    }
    if (u.from.hold === 0) {
      // the landing universe holds as long as any
      begin()
      u.from.hold = holdFor()
      u.from.born = now
    }
    if (!u.next && heldKind() < 0) u.next = make(0, now, tall)
    if (!reduced && u.changeAt < 0 && u.next && now - u.from.born > u.from.hold) {
      const c = change()
      u.to = u.next
      u.next = null
      u.to.born = now
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
    u.hurry = reduced || heldKind() >= 0 ? 0 : Math.max(before, after)
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

/** Every universe that may soon show (for building their programs ahead). */
export function upcoming(): Universe[] {
  const u = universe
  const list = [u.from]
  if (u.to) list.push(u.to)
  if (u.next) list.push(u.next)
  if (u.plan) list.push(...u.plan.at)
  return list
}
