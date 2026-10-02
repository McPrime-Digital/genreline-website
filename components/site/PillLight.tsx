'use client'
/** The light under the hand: one delegated listener for every liquid pill on
 *  the page, writing the pointer's position into --px/--py so the highlight in
 *  globals.css (THE PILL ANSWERS THE HAND) pools where the cursor is. Only on a
 *  fine pointer that can hover — a touch screen presses, it does not hover. */
import * as React from 'react'

export function PillLight() {
  React.useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const onMove = (e: PointerEvent) => {
      const target = e.target
      if (!(target instanceof Element)) return
      const pill = target.closest<HTMLElement>('.liquid-pill, .liquid-pill-gold')
      if (!pill) return
      const r = pill.getBoundingClientRect()
      pill.style.setProperty('--px', `${e.clientX - r.left}px`)
      pill.style.setProperty('--py', `${e.clientY - r.top}px`)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => document.removeEventListener('pointermove', onMove)
  }, [])
  return null
}
