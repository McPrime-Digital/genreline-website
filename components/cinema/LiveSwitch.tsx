'use client'
/** Ambient motion starts a moment after the page has loaded — the arrival is
 *  calm, the first paint is not competing with grain and light, and the page
 *  settles before anything begins to breathe. */
import * as React from 'react'

export function LiveSwitch() {
  React.useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const go = () => { t = setTimeout(() => document.documentElement.setAttribute('data-live', 'true'), 1800) }
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
    return () => { clearTimeout(t); window.removeEventListener('load', go) }
  }, [])
  return null
}
