'use client'
/**
 * WHO IT IS FOR — pick yourself, and see your setup: which spaces you run,
 * who you invite and exactly what each of them sees.
 */
import * as React from 'react'
import Link from 'next/link'
import { cx } from '@/lib/cx'
import type { Segment } from '@/content/segments'

export function WhoItsFor({ segments, shots }: { segments: readonly Segment[]; shots: Record<string, React.ReactNode> }) {
  const [i, setI] = React.useState(0)
  const s = segments[i]
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
      <div role="tablist" aria-label="Who it is for" aria-orientation="vertical" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible">
        {segments.map((seg, n) => (
          <button
            key={seg.id}
            role="tab"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className={cx(
              'shrink-0 rounded-2xl border px-5 py-4 text-left outline-none transition-colors duration-[--dur-panel] focus-visible:ring-2 focus-visible:ring-ring lg:shrink',
              n === i ? 'border-primary/60 bg-card/80' : 'border-border bg-card/20 hover:bg-card/50',
            )}
          >
            <span className={cx('block font-display text-lg font-bold', n === i ? 'text-foreground' : 'text-muted-foreground')}>{seg.name}</span>
            <span className="mt-0.5 hidden text-[13px] leading-5 text-muted-foreground lg:block">{seg.short}</span>
          </button>
        ))}
      </div>

      <div key={s.id} role="tabpanel" className="swap-enter rounded-3xl border border-border bg-card/40 p-6 backdrop-blur sm:p-8">
        <p className="text-[16px] leading-7 text-foreground">{s.who}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {s.examples.map((e) => <span key={e} className="rounded-full bg-secondary/60 px-3 py-1 text-[12px] text-secondary-foreground">{e}</span>)}
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div>
            <p className="text-[12px] font-semibold text-muted-foreground">Your setup</p>
            <ul className="mt-3 space-y-2">
              {s.spaces.map((sp) => (
                <li key={sp.name} className="flex items-baseline gap-3 text-[14px]">
                  <span className="w-20 shrink-0 font-display font-semibold text-foreground">{sp.name}</span>
                  <span className="text-muted-foreground">{sp.note}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[12px] font-semibold text-muted-foreground">Who you invite, and what they see</p>
            <ul className="mt-3 space-y-2.5">
              {s.invite.map((p) => (
                <li key={p.role} data-feature-id={p.featureId} className="text-[14px] leading-5">
                  <span className="font-semibold text-foreground">{p.role}</span>
                  <span className="text-muted-foreground"> — {p.sees}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="screen">{shots[s.media.find((m) => shots[m]) ?? ''] ?? null}</div>
            <ul className="space-y-3">
              {s.wins.map((w) => (
                <li key={w.title} data-feature-id={w.featureId}>
                  <p className="font-display text-[15px] font-semibold text-foreground">{w.title}</p>
                  <p className="text-[14px] leading-6 text-muted-foreground">{w.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {s.honest && <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-3 text-[13px] leading-5 text-muted-foreground">{s.honest}</p>}
        <Link href={s.id === 'enterprise' ? '/enterprise' : `/solutions/${s.id}`} className="mt-6 inline-flex h-11 items-center rounded-lg border border-border bg-background/50 px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/60">
          {s.name} — the full picture
        </Link>
      </div>
    </div>
  )
}
