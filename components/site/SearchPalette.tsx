'use client'

/**
 * ⌘K site search. Styled as the app's palette and, like it, with NO open or
 * close animation: it answers a keystroke, and motion on a keyboard action
 * reads as lag (emil-design-eng's frequency rule). ↑↓ move, ⏎ goes, Esc closes.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, VisuallyHidden } from 'radix-ui'
import { CornerDownLeft, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Kbd } from '@/components/ui/kbd'
import { fuzzyScore } from '@/lib/fuzzy'
import type { SearchItem } from '@/content/search'

let cache: Promise<SearchItem[]> | null = null
const load = () => (cache ??= fetch('/search-index.json').then((r) => r.json() as Promise<SearchItem[]>).catch(() => { cache = null; return [] }))

export default function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter()
  const items = React.use(load())
  const [q, setQ] = React.useState('')
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLUListElement>(null)

  const results = React.useMemo(() => {
    if (!q.trim()) return items.filter((i) => i.group === 'Pages')
    return items
      .map((item) => ({ item, s: fuzzyScore(q, `${item.title} ${item.group}`) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((r) => r.item)
  }, [items, q])

  const go = (item: SearchItem) => {
    onOpenChange(false)
    setQ('')
    router.push(item.href)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]) }
  }

  React.useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[hsl(var(--foreground)/0.35)]" />
        <Dialog.Content
          aria-describedby={undefined}
          onKeyDown={onKeyDown}
          className="fixed left-1/2 top-[12dvh] z-[61] flex max-h-[70dvh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden squircle-lg border border-border bg-popover text-popover-foreground shadow-[0_24px_64px_-24px_hsl(var(--foreground)/0.45)] outline-none"
        >
          <VisuallyHidden.Root asChild><Dialog.Title>Search the site</Dialog.Title></VisuallyHidden.Root>
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search aria-hidden className="size-4 text-faint" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0) }}
              placeholder="Search pages and features…"
              aria-label="Search pages and features"
              aria-controls="search-results"
              aria-activedescendant={results[active] ? `search-${active}` : undefined}
              role="combobox"
              aria-expanded="true"
              autoComplete="off"
              spellCheck={false}
              className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-faint"
            />
            <Kbd>Esc</Kbd>
          </div>
          <ul id="search-results" role="listbox" ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-2">
            {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nothing matches “{q}”. Try a feature, like “certificate” or “call sheets”.</li>}
            {results.map((item, i) => (
              <li
                key={`${item.href}-${item.title}`}
                id={`search-${i}`}
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => go(item)}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 data-[active=true]:bg-secondary/70"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{item.title}</span>
                  <span className="block text-[12px] text-faint">{item.group === 'Pages' ? item.href : `On ${item.href}`}</span>
                </span>
                {item.badge && <Badge tone={item.badge === 'Coming' ? 'blue' : 'green'} dot>{item.badge}</Badge>}
                {i === active && <CornerDownLeft aria-hidden className="size-3.5 text-faint" />}
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
