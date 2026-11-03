/**
 * The hero's live state, shared by the director (scroll, text, timecode) and
 * the scene (camera, motion). Plain mutable values read every frame — never
 * React state, so scrolling re-renders nothing.
 */
import { SHOTS, TIMECODE } from '@/components/hero/scene/numbers'

export const heroState = {
  /** Scroll progress through the hero, 0–1, as ScrollTrigger reports it. */
  target: 0,
  /** The progress the camera and the words follow: damped when Motion is on, cut to the nearest shot when off. */
  current: 0,
  /** Motion on (flying, drifting) or off (cuts, nothing moves on its own). */
  motion: true,
  /** The scene asks for one frame (demand mode); a no-op until the scene mounts. */
  invalidate: () => {},
  /** Scroll the page to a shot (0–4); set by the director. */
  goToShot: (shot: number) => void shot,
}

/** Progress → the nearest shot's progress (0, ¼, ½, ¾, 1): the cut. */
export const cut = (p: number) => Math.round(p * (SHOTS - 1)) / (SHOTS - 1)

const pad = (n: number) => String(n).padStart(2, '0')
/** Progress → SMPTE timecode on the scene's 16-second clock. */
export function timecode(p: number) {
  const frames = Math.round(p * TIMECODE.seconds * TIMECODE.fps)
  const s = Math.floor(frames / TIMECODE.fps)
  return `00:00:${pad(s)}:${pad(frames % TIMECODE.fps)}`
}
