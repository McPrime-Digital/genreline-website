/**
 * REDUCED MOTION — the one motion setting the site follows: the visitor's
 * system preference (`prefers-reduced-motion`), live. There is no switch on
 * the site (the owner, 2026-11-03: the Motion play/pause "must go").
 *
 * Browser-only: the server cannot know it, so `useReducedMotion()` is null
 * until the page has hydrated, and anything that renders from it renders
 * after mount.
 */
import * as React from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(listener: () => void) {
  const q = window.matchMedia(QUERY)
  q.addEventListener('change', listener)
  return () => q.removeEventListener('change', listener)
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia(QUERY).matches
}

/** True / false once hydrated; null on the server and in the first render. */
export function useReducedMotion(): boolean | null {
  return React.useSyncExternalStore(subscribe, prefersReducedMotion, () => null)
}
