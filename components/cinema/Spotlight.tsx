'use client'
/** A surface lit where the pointer is — no tilt. */
import * as React from 'react'

export function Spotlight({ children, className = '', as: Comp = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'li' | 'article' }) {
  const ref = React.useRef<HTMLElement>(null)
  return (
    <Comp
      ref={ref as React.Ref<never>}
      onPointerMove={(e: React.PointerEvent) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${e.clientX - r.left}px`)
        el.style.setProperty('--my', `${e.clientY - r.top}px`)
        el.style.setProperty('--spot', '1')
      }}
      onPointerLeave={() => ref.current?.style.setProperty('--spot', '0')}
      className={`spotlight spot-border ${className}`}
    >
      {children}
    </Comp>
  )
}
