'use client'
/**
 * Everyone on a production on one through-line — the brand's own mark (three
 * nodes on a line) grown into the roster. Hover or focus a person to see
 * exactly what they can reach.
 */
import * as React from 'react'
import { cx } from '@/lib/cx'
import { Briefcase, Building, Eye, Link2, PenLine, Users } from '@/components/icons'

const ICONS = [Users, Briefcase, Building, Link2, Eye, PenLine]

type C = { role: string; where: string; sees: string; featureId: string }

export function CollaboratorMap({ people }: { people: readonly C[] }) {
  const [i, setI] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  const [inView, setIn] = React.useState(false)
  React.useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIn(true); io.disconnect() } }, { threshold: 0.3 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} data-in={inView}>
      <div className="relative">
        <svg aria-hidden viewBox="0 0 1000 40" preserveAspectRatio="none" className="absolute left-0 right-0 top-[27px] hidden h-10 w-full md:block">
          <path d="M 40 20 L 960 20" pathLength={1} className="through-line" stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />
        </svg>
        <ol className="relative grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-2">
          {people.map((p, n) => (
            <li key={p.role} data-feature-id={p.featureId}>
              <button
                onPointerEnter={() => setI(n)}
                onFocus={() => setI(n)}
                onClick={() => setI(n)}
                aria-pressed={n === i}
                className="group flex w-full flex-col items-center gap-3 rounded-2xl px-2 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className={cx('relative grid size-14 place-items-center rounded-full border-2 font-display text-sm font-bold transition-[transform,background-color,border-color] duration-[--dur-panel] ease-[--ease-pop]', n === i ? 'scale-110 border-primary bg-primary text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.6)]' : 'border-border bg-background text-foreground group-hover:border-primary/60')}>
                  {React.createElement(ICONS[n % ICONS.length], { 'aria-hidden': true, className: 'size-5' })}
                </span>
                <span className={cx('text-[14px] font-semibold', n === i ? 'text-foreground' : 'text-muted-foreground')}>{p.role}</span>
                <span className="text-[12px] text-muted-foreground">{p.where}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <p key={i} aria-live="polite" className="swap-enter mx-auto mt-8 max-w-[52ch] text-center font-display text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
        {people[i].role}: <span className="text-muted-foreground">{people[i].sees.charAt(0).toLowerCase() + people[i].sees.slice(1)}.</span>
      </p>
    </div>
  )
}
