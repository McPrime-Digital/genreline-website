'use client'
/**
 * THE MOTION BUTTON (batch W-3D-1 §4) — in the header on the home page, where
 * the 3D hero is. Pressed: the camera flies, the dust drifts, the playhead
 * travels. Not pressed: the camera cuts between the five shots and nothing
 * moves on its own. Remembered under "genreline-motion"; starts off when the
 * system asks for reduced motion (lib/motion.ts).
 *
 * Its name never changes — the pressed state carries on/off, so a screen
 * reader hears "Motion, toggle button, pressed".
 */
import { setMotion, useMotion } from '@/lib/motion'
import { hero } from '@/content/home'

export function MotionToggle() {
  const motion = useMotion()
  // Before hydration the visitor's choice is unknown; render the default, the same on server and client.
  const on = motion ?? true
  return (
    <button type="button" aria-pressed={on} onClick={() => setMotion(!on)} className="motion-toggle" title={hero.motionLabel}>
      <span aria-hidden className="motion-icon" />
      <span className="max-sm:sr-only">{hero.motionLabel}</span>
    </button>
  )
}
