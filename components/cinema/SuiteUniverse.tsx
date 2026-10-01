'use client'
/**
 * THE SUITE, GRAND. Ten stages of making a film, each a console of named
 * tools with honest labels, stepped through automatically along a pipeline
 * bar — or by hand. The headline argument of the site (owner, 2026-10-01).
 */
import * as React from 'react'
import { cx } from '@/lib/cx'

export type SuiteModule = { id: string; title: string; detail?: string; points?: string[]; badge: 'Available' | 'Coming' }
export type SuiteStageData = { id: string; name: string; line: string; modules: SuiteModule[] }

const DUR = 6500

export function SuiteUniverse({ stages }: { stages: SuiteStageData[] }) {
  const [i, setI] = React.useState(0)
  const [auto, setAuto] = React.useState(true)
  const [hover, setHover] = React.useState(false)
  const [seen, setSeen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.25 })
    if (ref.current) io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  React.useEffect(() => {
    if (!auto || hover || !seen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => setI((x) => (x + 1) % stages.length), DUR)
    return () => clearTimeout(t)
  }, [auto, hover, seen, i, stages.length])
  const s = stages[i]
  const total = stages.reduce((n, st) => n + st.modules.length, 0)
  const live = stages.reduce((n, st) => n + st.modules.filter((m) => m.badge === 'Available').length, 0)

  return (
    <div ref={ref} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      {/* the pipeline bar */}
      <div className="relative">
        <div className="flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none]" role="tablist" aria-label="Stages of making">
          {stages.map((st, n) => (
            <button
              key={st.id}
              role="tab"
              aria-selected={n === i}
              onClick={() => { setI(n); setAuto(false) }}
              className={cx('group relative min-w-[118px] flex-1 overflow-hidden rounded-xl border px-3 pb-3 pt-2.5 text-left outline-none transition-colors duration-[--dur-panel] focus-visible:ring-2 focus-visible:ring-ring', n === i ? 'border-glow/60 bg-glow/10' : 'border-border bg-card/30 hover:bg-card/60')}
            >
              <span className="block font-display text-[11px] tabular-nums text-muted-foreground">{String(n + 1).padStart(2, '0')}</span>
              <span className={cx('block font-display text-[14px] font-semibold', n === i ? 'text-foreground' : 'text-muted-foreground')}>{st.name}</span>
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-border/50">
                {n === i && auto && !hover && seen ? <span key={i} className="autoprogress block h-full bg-glow" style={{ ['--dur' as string]: `${DUR}ms` }} /> : n === i ? <span className="block h-full bg-glow" /> : n < i ? <span className="block h-full bg-glow/40" /> : null}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* the console */}
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div key={s.id} className="swap-enter">
          <p className="font-display text-[13px] tabular-nums text-glow">STAGE {String(i + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}</p>
          <p className="mt-2 font-display text-5xl font-bold tracking-[-0.03em] text-foreground sm:text-6xl">{s.name}</p>
          <p className="mt-4 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">{s.line}</p>
          <p className="mt-8 text-[13px] text-muted-foreground"><span className="font-semibold tabular-nums text-foreground">{total}</span> tools across the Suite · <span className="font-semibold tabular-nums text-foreground">{live}</span> in use today, the rest being built</p>
        </div>
        <ul key={`${s.id}-m`} className="grid content-start gap-3 sm:grid-cols-2">
          {s.modules.map((m, n) => (
            <li key={m.id} data-feature-id={m.id} style={{ animationDelay: `${n * 50}ms` }} className="swap-enter group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-4 backdrop-blur transition-colors hover:border-glow/50">
              <span aria-hidden className="absolute -right-10 -top-10 size-28 rounded-full bg-glow/10 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-[15px] font-semibold leading-snug text-foreground">{m.title}</p>
                <span data-feature-label={m.badge.toLowerCase()} data-feature-id={m.id} className={cx('mt-0.5 inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium', m.badge === 'Coming' ? 'bg-status-blue/15 text-status-blue' : 'bg-status-green/15 text-status-green')}>{m.badge}</span>
              </div>
              {m.detail && <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{m.detail}</p>}
              {m.points && <ul className="mt-2.5 space-y-1">{m.points.map((p) => <li key={p} className="flex gap-2 text-[12.5px] leading-5 text-foreground/80"><span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-glow" />{p}</li>)}</ul>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
