'use client'
/**
 * THE THREE SPACES. One stage, three spaces, each with its own gallery of
 * real screens, its features, and the people who work in it. Advances on its
 * own every few seconds with a progress bar; pointer or keyboard takes over
 * and it stops. Under reduced motion it never advances.
 */
import * as React from 'react'
import Link from 'next/link'
import { cx } from '@/lib/cx'

export type SpaceShot = { key: string; label: string; node: React.ReactNode }
export type SpacePanel = {
  id: string
  name: string
  tagline: string
  body: string
  features: { text: string; badge: 'Available' | 'Coming'; featureId: string }[]
  people: string[]
  href: string
  shots: SpaceShot[]
}

const DUR = 8000

export function SpacesShowcase({ spaces }: { spaces: SpacePanel[] }) {
  const [i, setI] = React.useState(0)
  const [shot, setShot] = React.useState(0)
  const [auto, setAuto] = React.useState(true)
  const [hover, setHover] = React.useState(false)
  const [seen, setSeen] = React.useState(false)
  const root = React.useRef<HTMLDivElement>(null)
  const s = spaces[i]

  React.useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.3 })
    if (root.current) io.observe(root.current)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    if (!auto || hover || !seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => {
      if (shot + 1 < s.shots.length) setShot(shot + 1)
      else { setI((i + 1) % spaces.length); setShot(0) }
    }, DUR / Math.max(1, s.shots.length))
    return () => clearTimeout(t)
  }, [auto, hover, seen, shot, i, s.shots.length, spaces.length])

  const pick = (n: number) => { setI(n); setShot(0); setAuto(false) }

  return (
    <div ref={root} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div role="tablist" aria-label="The three spaces" className="grid grid-cols-3 gap-2 sm:gap-3">
        {spaces.map((sp, n) => (
          <button
            key={sp.id}
            role="tab"
            aria-selected={n === i}
            aria-controls={`space-${sp.id}`}
            onClick={() => pick(n)}
            className={cx(
              'group relative overflow-hidden rounded-2xl border px-4 py-4 text-left outline-none transition-colors duration-[--dur-panel] focus-visible:ring-2 focus-visible:ring-ring sm:px-6 sm:py-5',
              n === i ? 'border-primary/60 bg-card/80' : 'border-border bg-card/30 hover:bg-card/60',
            )}
          >
            <span className={cx('block font-display text-lg font-bold sm:text-2xl', n === i ? 'text-foreground' : 'text-muted-foreground')}>{sp.name}</span>
            <span className="mt-1 hidden text-[13px] text-muted-foreground sm:block">{sp.tagline}</span>
            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border/60">
              {n === i && auto && !hover && seen && <span key={`${i}-${shot}`} className="autoprogress block h-full bg-primary" style={{ ['--dur' as string]: `${DUR / Math.max(1, sp.shots.length)}ms` }} />}
              {n === i && (!auto || hover) && <span className="block h-full bg-primary" />}
            </span>
          </button>
        ))}
      </div>

      <div id={`space-${s.id}`} role="tabpanel" className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div key={s.id} className="swap-enter">
          <p className="font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl">{s.tagline}</p>
          <p className="mt-4 text-[16px] leading-7 text-muted-foreground">{s.body}</p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {s.features.map((f) => (
              <li key={f.featureId} data-feature-id={f.featureId} className="flex items-start gap-2 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-[14px] leading-5 text-foreground">
                <span aria-hidden className={cx('mt-1.5 size-1.5 shrink-0 rounded-full', f.badge === 'Coming' ? 'bg-status-blue' : 'bg-status-green')} />
                <span className="min-w-0">
                  {f.text}
                  {f.badge === 'Coming' && <span data-feature-label="coming" data-feature-id={f.featureId} className="ml-2 inline-flex h-5 items-center rounded-md bg-status-blue/15 px-1.5 text-[11px] font-medium text-status-blue">Coming</span>}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="text-[12px] font-semibold text-muted-foreground">Who works here</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {s.people.map((p) => <span key={p} className="rounded-full border border-border bg-card/50 px-3 py-1 text-[13px] text-foreground">{p}</span>)}
            </div>
          </div>
          <Link href={s.href} className="mt-7 inline-flex h-11 items-center rounded-lg border border-border bg-background/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60">
            Everything in {s.name === 'The Suite' ? 'the Suite' : `the ${s.name} space`}
          </Link>
        </div>

        <div className="stage-3d">
          <div key={`${s.id}-${shot}`} className="swap-enter" style={{ transform: 'rotateY(-6deg) rotateX(3deg)' }}>
            <div className="screen">{s.shots[shot]?.node}</div>
          </div>
          {s.shots.length > 1 && (
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label={`Screens from ${s.name}`}>
              {s.shots.map((sh, n) => (
                <button
                  key={sh.key}
                  onClick={() => { setShot(n); setAuto(false) }}
                  aria-pressed={n === shot}
                  className={cx('rounded-full border px-3 py-1.5 text-[12px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring', n === shot ? 'border-primary/60 bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}
                >
                  {sh.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
