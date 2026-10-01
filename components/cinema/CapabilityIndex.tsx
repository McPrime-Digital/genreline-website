'use client'
/** Every capability the site may name, live and being built — filterable. */
import * as React from 'react'
import { cx } from '@/lib/cx'

export type Cap = { id: string; title: string; group: string; badge: 'Available' | 'Coming' | 'Live' }

export function CapabilityIndex({ caps, initial = 36, groupIcons = {} }: { caps: Cap[]; initial?: number; groupIcons?: Record<string, React.ReactNode> }) {
  const groups = [...new Set(caps.map((c) => c.group))]
  const [g, setG] = React.useState<string | null>(null)
  const [q, setQ] = React.useState('')
  const [all, setAll] = React.useState(false)
  const list = caps.filter((c) => (!g || c.group === g) && (!q || c.title.toLowerCase().includes(q.toLowerCase())))
  const shown = all || g || q ? list : list.slice(0, initial)
  const live = caps.filter((c) => c.badge !== 'Coming').length
  return (
    <div>
      <div className="flex flex-wrap items-end gap-x-12 gap-y-4">
        <div><p className="font-display text-6xl font-bold tabular-nums tracking-[-0.04em] text-foreground">{live}</p><p className="text-[13px] text-muted-foreground">capabilities live today</p></div>
        <div><p className="font-display text-6xl font-bold tabular-nums tracking-[-0.04em] text-glow">{caps.length - live}</p><p className="text-[13px] text-muted-foreground">being built into the Suite and network</p></div>
      </div>
      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by area">
          <button type="button" aria-pressed={!g} onClick={() => setG(null)} className={cx('h-8 rounded-lg border px-3 text-[13px] font-medium', !g ? 'border-foreground/20 bg-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}>Everything</button>
          {groups.map((x) => (
            <button key={x} type="button" aria-pressed={g === x} onClick={() => setG(g === x ? null : x)} className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium', g === x ? 'border-foreground/20 bg-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground')}><span className="size-3.5 [&>span]:size-3.5">{groupIcons[x]}</span>{x}</button>
          ))}
        </div>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a capability…" aria-label="Find a capability" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring lg:w-72" />
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((c) => (
          <li key={c.id} data-feature-id={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card/40 px-4 py-3">
            <span className="flex min-w-0 gap-3"><span className="mt-0.5 size-4 shrink-0 text-primary [&>span]:size-4">{groupIcons[c.group]}</span><span className="min-w-0"><span className="block text-[14px] leading-5 text-foreground">{c.title}</span><span className="text-[12px] text-muted-foreground">{c.group}</span></span></span>
            {c.badge === 'Coming'
              ? <span data-feature-label="coming" data-feature-id={c.id} className="mt-0.5 shrink-0 rounded-md bg-status-blue/15 px-1.5 py-0.5 text-[11px] font-medium text-status-blue">Coming</span>
              : <span className="mt-0.5 shrink-0 rounded-md bg-status-green/15 px-1.5 py-0.5 text-[11px] font-medium text-status-green">Live</span>}
          </li>
        ))}
      </ul>
      {!all && !g && !q && list.length > initial && (
        <button type="button" onClick={() => setAll(true)} className="mt-6 inline-flex h-11 items-center rounded-lg border border-border bg-background/50 px-5 text-sm font-medium text-foreground hover:bg-secondary/60">Show all {list.length} capabilities</button>
      )}
    </div>
  )
}
