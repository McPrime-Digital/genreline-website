'use client'
/**
 * A panel that leans toward the pointer and is lit where the pointer is.
 * rAF-throttled, transform-only, and inert on touch and under reduced motion.
 */
import * as React from 'react'

export function Tilt({ children, className = '', max = 8, style }: { children: React.ReactNode; className?: string; max?: number; style?: React.CSSProperties }) {
  const ref = React.useRef<HTMLDivElement>(null)
  const frame = React.useRef(0)
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--mx', `${x * 100}%`)
      el.style.setProperty('--my', `${y * 100}%`)
      el.style.setProperty('--spot', '1')
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.style.transform = `rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg)`
      }
    })
  }
  const onLeave = () => {
    const el = ref.current
    if (!el) return
    cancelAnimationFrame(frame.current)
    el.style.transform = ''
    el.style.setProperty('--spot', '0')
  }
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={`tilt spotlight spot-border ${className}`} style={style}>
      {children}
    </div>
  )
}
