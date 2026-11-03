/**
 * THE MOTION SWITCH'S STATE (batch W-3D-1 §4) — one boolean, shared by the
 * header's Motion button and the home hero.
 *
 *  · stored in localStorage under "genreline-motion" as "on" / "off" once the
 *    visitor has pressed the button;
 *  · until then it follows the system: off when the system asks for reduced
 *    motion, and it changes when that setting changes;
 *  · while the home page is open, <html data-motion="on|off"> mirrors it, so
 *    CSS can stop the page's ambient motion too (globals.css).
 *
 * Browser-only: the server cannot know it, so `useMotion()` is null until the
 * page has hydrated, and anything that renders from it renders after mount.
 */
import * as React from 'react'

const KEY = 'genreline-motion'
const REDUCE = '(prefers-reduced-motion: reduce)'

let value: boolean | null = null
const listeners = new Set<() => void>()

function stored(): boolean | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'on' ? true : v === 'off' ? false : null
  } catch {
    return null
  }
}

export function getMotion(): boolean {
  if (value === null) value = stored() ?? !window.matchMedia(REDUCE).matches
  return value
}

function emit() {
  for (const l of listeners) l()
}

/** The button: flips the state and remembers the visitor's choice. */
export function setMotion(on: boolean) {
  value = on
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {}
  emit()
}

let systemWatch: (() => void) | null = null
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!systemWatch) {
    const q = window.matchMedia(REDUCE)
    // A visitor who has never pressed the button follows the system live.
    const onChange = () => {
      if (stored() === null) {
        value = !q.matches
        emit()
      }
    }
    q.addEventListener('change', onChange)
    systemWatch = () => q.removeEventListener('change', onChange)
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && systemWatch) {
      systemWatch()
      systemWatch = null
    }
  }
}

/** True / false once hydrated; null on the server and in the first render. */
export function useMotion(): boolean | null {
  return React.useSyncExternalStore(subscribe, getMotion, () => null)
}

/** Subscribe outside React (the scene's frame loop reads it directly). */
export function onMotionChange(listener: () => void) {
  return subscribe(listener)
}
