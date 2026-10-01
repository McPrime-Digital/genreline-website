'use client'

/**
 * The roadmap (S-W §7.14, W-6). Every row is in the static HTML — the filters
 * only hide. The URL is the state (vercel web-interface-guidelines: deep-link
 * stateful UI), read through useSyncExternalStore so the server render is the
 * unfiltered list and nothing mismatches on hydration.
 */
import * as React from 'react'
import { Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { fuzzyScore } from '@/lib/fuzzy'
import { cn } from '@/lib/utils'
import type { RoadmapRow } from '@/content/roadmap'

const EVENT = 'roadmap:url'
const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb)
  window.addEventListener(EVENT, cb)
  return () => {
    window.removeEventListener('popstate', cb)
    window.removeEventListener(EVENT, cb)
  }
}
const getSearch = () => window.location.search
const getServer = () => ''

function setParam(key: string, value: string | null) {
  const url = new URL(window.location.href)
  if (value) url.searchParams.set(key, value)
  else url.searchParams.delete(key)
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new Event(EVENT))
}

export function RoadmapBoard({ rows, spaces }: { rows: readonly RoadmapRow[]; spaces: Record<string, string> }) {
  const search = React.useSyncExternalStore(subscribe, getSearch, getServer)
  const params = new URLSearchParams(search)
  const status = params.get('status')
  const area = params.get('area')
  const q = params.get('q') ?? ''
  const [draft, setDraft] = React.useState<string | null>(null)
  const query = draft ?? q

  const visible = rows.filter((r) => (!status || r.status === status) && (!area || r.space === area) && (!query || fuzzyScore(query, `${r.title} ${spaces[r.space]}`) > 0))
  const groups = [...new Set(rows.map((r) => r.space))]
  const counts = { all: rows.length, built: rows.filter((r) => r.status === 'Being built').length, planned: rows.filter((r) => r.status === 'Planned').length }

  const chip = (active: boolean) =>
    cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium outline-none transition-colors duration-[--dur-pop] focus-visible:ring-2 focus-visible:ring-ring', active ? 'border-foreground/20 bg-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground')

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!status} onClick={() => setParam('status', null)} className={chip(!status)}>All <span className="tabular-nums text-faint">{counts.all}</span></button>
          <button type="button" aria-pressed={status === 'Being built'} onClick={() => setParam('status', 'Being built')} className={chip(status === 'Being built')}>Being built <span className="tabular-nums text-faint">{counts.built}</span></button>
          <button type="button" aria-pressed={status === 'Planned'} onClick={() => setParam('status', 'Planned')} className={chip(status === 'Planned')}>Planned <span className="tabular-nums text-faint">{counts.planned}</span></button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="rm-area">Area</label>
          <select id="rm-area" value={area ?? ''} onChange={(e) => setParam('area', e.target.value || null)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <option value="">Every area</option>
            {groups.map((g) => <option key={g} value={g}>{spaces[g]}</option>)}
          </select>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              aria-label="Search the roadmap"
              placeholder="Search the roadmap…"
              value={query}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { if (draft !== null) { setParam('q', draft || null); setDraft(null) } }}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft !== null) { setParam('q', draft || null); setDraft(null) } }}
              autoComplete="off"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
            />
          </div>
        </div>
      </div>

      <p aria-live="polite" className="mt-6 text-[13px] text-muted-foreground">{visible.length === rows.length ? `${rows.length} items` : `${visible.length} of ${rows.length} items`}</p>

      {visible.length === 0 && (
        <div className="mt-6 squircle border border-dashed border-border p-8 text-center text-[15px] text-muted-foreground">
          Nothing on the roadmap matches. <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => { setParam('q', null); setParam('status', null); setParam('area', null); setDraft(null) }}>Clear the filters</button>
        </div>
      )}

      <div className="mt-4 space-y-10">
        {groups.map((g) => {
          const items = visible.filter((r) => r.space === g)
          if (!items.length) return null
          return (
            <section key={g} aria-labelledby={`rm-${g}`}>
              <h2 id={`rm-${g}`} className="font-display text-lg font-semibold text-foreground">{spaces[g]}</h2>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {items.map((r) => (
                  <li key={r.id + r.title} className="flex items-start justify-between gap-4 py-3">
                    <span className="text-[15px] leading-6 text-foreground">{r.title}</span>
                    <Badge tone={r.status === 'Being built' ? 'blue' : 'gray'} className="mt-0.5">{r.status}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
