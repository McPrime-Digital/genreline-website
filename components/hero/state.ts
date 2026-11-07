/**
 * The hero's live state and its timeline, shared by the director (scroll,
 * words, timecode) and the scene (camera, stations). Plain mutable values read
 * every frame — never React state, so scrolling re-renders nothing. No
 * three.js here: this ships with the page.
 */
import { SCROLL_VH, STORY, TIMECODE, type Segment, type Shot } from '@/components/hero/scene/numbers'
import type { Layout } from '@/components/hero/frame'

export const heroState = {
  /** Scroll progress through the hero, 0–1, as ScrollTrigger reports it. */
  target: 0,
  /** The progress the camera and the words follow: damped, or cut to the nearest shot under reduced motion. */
  current: 0,
  /** How fast `current` is moving (progress per second) — the particles stream harder with it. */
  speed: 0,
  /** The visitor has taken the tour: the hero runs its journey with the scroll. Off, it is one screen at the title. */
  tour: false,
  /** The pointer is on the play control: the line's light quickens. */
  playHover: 0,
  /** The visitor's system asks for reduced motion: cuts instead of flights, nothing drifting on its own. */
  reduced: false,
  /** The Client station's face: 0 Client, 1 Stakeholders — and when it last turned (performance.now()). */
  face: 0 as 0 | 1,
  faceAt: -1e9,
  /** The pointer is on one of the Client station's screens: the face waits. */
  holdFace: false,
  /**
   * Where the words sit on the stage, measured from the page (fractions of the stage, 0 = top or
   * left): the camera fits every shot into the room they leave, at any screen size, shape or text
   * size (rig.ts, frame.ts). `top` is under the slate line, `bottom` above the track; `edge` the
   * margin the words keep (the logo keeps it on the right); `play` the room the play control takes
   * under the logo; the rest are the edges of the title card, a space's caption and the close.
   */
  layout: { top: 0.15, bottom: 0.93, slate: 0.12, titleRight: 0.5, titleTop: 0.6, edge: 0.03, play: 0.1, captionTop: 0.74, captionRight: 0.42, captions: [], closeTop: 0.74, closeRight: 0.5 } as Layout,
  /**
   * How the title's poster is laid over the stage (HeroDirector places it): a point of the poster, in the
   * poster's own stage pixels (pw × ph, posters.json), lands at x0 + x·k, y0 + y·k on this stage (w × h).
   * The title's projector lamp stands by it, so the scene takes over from the poster without a jump.
   */
  posterMap: null as null | { tall: boolean; k: number; x0: number; y0: number; w: number; h: number; pw: number; ph: number; s: number },
  /** The scene asks for one frame (demand mode); a no-op until the scene mounts. */
  invalidate: () => {},
  /** Scroll the page to a shot (0–4); set by the director. */
  goToShot: (() => {}) as (shot: number) => void,
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const smoothstep = (a: number, b: number, v: number) => {
  const x = clamp01((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}

/** Where each segment starts, as progress 0–1. */
const STARTS = (() => {
  let at = 0
  return STORY.map((s) => {
    const start = at / SCROLL_VH
    at += s.vh
    return start
  })
})()

export type Place = { index: number; seg: Segment; t: number }

/** Progress → the segment it falls in and how far through it (0–1). */
export function storyAt(p: number): Place {
  const x = clamp01(p)
  let index = STORY.length - 1
  for (let i = 0; i < STORY.length; i++) {
    const end = i + 1 < STORY.length ? STARTS[i + 1] : 1
    if (x < end) {
      index = i
      break
    }
  }
  const start = STARTS[index]
  const end = index + 1 < STORY.length ? STARTS[index + 1] : 1
  return { index, seg: STORY[index], t: clamp01((x - start) / (end - start)) }
}

/** Each shot's own moment in the scroll: the title at the very start, the close at the very end, the stations mid-hold. */
export const SHOT_AT: readonly number[] = ([0, 1, 2, 3, 4] as Shot[]).map((shot) => {
  if (shot === 0) return 0
  if (shot === 4) return 1
  const i = STORY.findIndex((s) => s.kind === 'hold' && s.shot === shot)
  const end = i + 1 < STORY.length ? STARTS[i + 1] : 1
  return (STARTS[i] + end) / 2
})

/** How present a shot's words are (0–1): full through its hold, fading in as the camera arrives and out as it leaves. */
export function shotWeight(place: Place, shot: Shot) {
  const { seg, t } = place
  if (seg.kind === 'hold') return seg.shot === shot ? 1 : 0
  if (seg.from === shot) return 1 - smoothstep(0, shot === 0 ? 0.42 : 0.24, t)
  if (seg.to === shot) return smoothstep(shot === 4 ? 0.55 : 0.7, 1, t)
  return 0
}

/** How assembled a station's screens are (0–1): they gather as the camera arrives and scatter as it leaves. */
export function presence(place: Place, shot: Shot) {
  const { seg, t } = place
  if (seg.kind === 'hold') return seg.shot === shot ? 1 : 0
  if (seg.to === shot) return smoothstep(0.4, 0.97, t)
  if (seg.from === shot) return 1 - smoothstep(0.06, 0.5, t)
  return 0
}

/** How much of a station's own sky shows (0–1): wider than the screens, so each space arrives in its own light. */
export function skyWeight(place: Place, shot: Shot) {
  const { seg, t } = place
  if (seg.kind === 'hold') return seg.shot === shot ? 1 : 0
  if (seg.to === shot) return smoothstep(0.12, 0.85, t)
  if (seg.from === shot) return 1 - smoothstep(0.12, 0.8, t)
  return 0
}

/**
 * How much of a space's cinema shows (0–1): only as its space arrives, late in the journey, and gone early
 * as it leaves — so the ride between spaces is space itself (the owner, 2026-11-06: the journey "even
 * previews whats playing in the client space to early … so that we can see the outerspace during that ride").
 */
export function cinemaWeight(place: Place, shot: Shot) {
  const { seg, t } = place
  if (seg.kind === 'hold') return seg.shot === shot ? 1 : 0
  if (seg.to === shot) return smoothstep(0.62, 0.95, t)
  if (seg.from === shot) return 1 - smoothstep(0.04, 0.32, t)
  return 0
}

/** Reduced motion: progress → the nearest shot's own moment (a cut). */
export function cut(p: number) {
  const { seg, t } = storyAt(p)
  const shot = seg.kind === 'hold' ? seg.shot : t < 0.5 ? seg.from : seg.to
  return SHOT_AT[shot]
}

/** The shot nearest to a progress (for the track's marks and the keyboard). */
export function nearestShot(p: number): Shot {
  const { seg, t } = storyAt(p)
  return seg.kind === 'hold' ? seg.shot : t < 0.5 ? seg.from : seg.to
}

const pad = (n: number) => String(n).padStart(2, '0')
/** Progress → SMPTE timecode: the shots land on 00, 04, 08, 12 and 16 seconds. */
export function timecode(p: number) {
  const x = clamp01(p)
  let i = 0
  while (i < SHOT_AT.length - 2 && x > SHOT_AT[i + 1]) i++
  const span = SHOT_AT[i + 1] - SHOT_AT[i]
  const seconds = ((i + (span > 0 ? (x - SHOT_AT[i]) / span : 0)) * TIMECODE.seconds) / (SHOT_AT.length - 1)
  const frames = Math.round(seconds * TIMECODE.fps)
  const s = Math.floor(frames / TIMECODE.fps)
  return `00:00:${pad(s)}:${pad(frames % TIMECODE.fps)}`
}
