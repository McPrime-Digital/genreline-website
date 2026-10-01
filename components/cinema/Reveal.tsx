'use client'
/** Rises into place once, when it enters the view. */
import * as React from 'react'

export function Reveal({ children, delay = 0, className = '', as: Comp = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const ref = React.useRef<HTMLElement>(null)
  const [inView, setIn] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect() } }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Comp ref={ref as React.Ref<never>} data-in={inView} className={`reveal ${className}`} style={{ ['--delay' as string]: `${delay}ms` }}>
      {children}
    </Comp>
  )
}
