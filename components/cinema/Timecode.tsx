'use client'
/** A running SMPTE timecode at 24 fps — the slate's clock. */
import * as React from 'react'

const pad = (n: number) => String(n).padStart(2, '0')
export function Timecode({ className = '' }: { className?: string }) {
  const [t, setT] = React.useState('00:00:00:00')
  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const start = performance.now() - 41 * 1000 - 12 * 1000 * 60
    let raf = 0
    const tick = () => {
      const ms = performance.now() - start
      const f = Math.floor((ms % 1000) / (1000 / 24))
      const s = Math.floor(ms / 1000)
      setT(`${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <span className={`tabular-nums ${className}`} aria-hidden>{t}</span>
}
