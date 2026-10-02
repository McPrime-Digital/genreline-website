'use client'

/**
 * The header's menus, as the WAI-ARIA DISCLOSURE NAVIGATION pattern: each
 * top item is a button with aria-expanded, and its panel follows it in the
 * DOM, so Tab walks from the button straight into the panel's links with no
 * focus proxy. (Radix NavigationMenu's aria-hidden focus proxy is what axe
 * flagged — serious — so it was replaced rather than suppressed.)
 *
 * Each panel is CARDS UNDER SUB-HEADS (owner, 2026-10-01: "all their drop
 * down features in a proper small card or pill with intentional sub-heads to
 * separate from undertexts"): a gold, tracked capital sub-head with a rule;
 * under it, one small card per destination — icon, title, and the undertext
 * in the quieter voice.
 *
 * Opens on click, on Enter/Space, and — on a fine pointer — on hover with a
 * short intent delay. Escape closes and returns focus to the button; a click
 * outside or focus leaving the menu closes it. A panel is rendered only while
 * open, so a Coming badge in the Network panel never sits hidden in the HTML
 * of a page that may not carry one.
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import type { NavLink } from '@/content/nav'
import type { HeaderNav } from '@/components/site/SiteHeader'

type Key = 'product' | 'solutions' | 'network'

const trigger =
  'group inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none ' +
  'transition-colors duration-[--dur-pop] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-expanded:text-foreground aria-[current=page]:text-foreground'

const panelBase =
  'anim-in absolute top-full z-50 mt-2 squircle-lg border border-border bg-popover p-4 text-popover-foreground ' +
  'shadow-[0_24px_64px_-28px_hsl(var(--foreground)/0.35),0_0_0_0.5px_hsl(var(--glow)/0.12)]'
// Product is wide, so it hangs from the header's centre rather than its button
// (its <li> is static, so the header bar is its containing block).
const panelCentred = `${panelBase} inset-x-0 mx-auto w-[min(980px,calc(100vw-48px))] origin-top`
const panelLeft = `${panelBase} left-0 origin-top-left`

/** A sub-head: gold, tracked capitals and a rule — never mistaken for the undertext beneath it. */
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2.5 flex items-center gap-3 px-0.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--gold-ink))]">
      <span className="shrink-0">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </p>
  )
}

/** A destination: one small card — icon, title, undertext. */
function Card({ link, badge, onNavigate }: { link: NavLink; badge?: 'Available' | 'Coming' | null; onNavigate: () => void }) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className="group flex h-full items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-3 outline-none transition-[border-color,background-color] duration-[--dur-pop] hover:border-primary/45 hover:bg-card/80 focus-visible:border-primary/45 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {link.iconNode && (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary transition-colors group-hover:border-primary/40">
          {link.iconNode}
        </span>
      )}
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-[13.5px] font-semibold leading-5 text-foreground">
          {link.label}
          {badge && (
            <Badge tone={badge === 'Coming' ? 'blue' : 'green'} dot data-feature-label={badge.toLowerCase()} data-feature-id={link.featureId}>
              {badge}
            </Badge>
          )}
        </span>
        {link.description && <span className="mt-1 block text-[12.5px] leading-[18px] text-muted-foreground">{link.description}</span>}
      </span>
    </Link>
  )
}

export function MegaMenu({ nav }: { nav: HeaderNav }) {
  const [open, setOpen] = React.useState<Key | null>(null)
  const root = React.useRef<HTMLUListElement>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const fine = React.useRef(false)
  const pathname = usePathname()

  const [lastPath, setLastPath] = React.useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    if (open) setOpen(null)
  }

  React.useEffect(() => {
    fine.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }, [])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const btn = root.current?.querySelector<HTMLButtonElement>(`[data-menu="${open}"]`)
        setOpen(null)
        btn?.focus()
      }
    }
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const later = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(fn, ms)
  }
  const hoverOpen = (k: Key) => fine.current && later(() => setOpen(k), 90)
  const hoverClose = () => fine.current && later(() => setOpen(null), 160)
  const close = () => setOpen(null)

  const top = (k: Key, label: string, content: React.ReactNode, centred = false) => (
    <li
      className={centred ? 'static' : 'relative'}
      onPointerEnter={() => hoverOpen(k)}
      onPointerLeave={hoverClose}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen((o) => (o === k ? null : o))
      }}
    >
      <button
        type="button"
        data-menu={k}
        aria-expanded={open === k}
        aria-controls={`menu-${k}`}
        onClick={() => setOpen((o) => (o === k ? null : k))}
        className={trigger}
      >
        {label}
        <ChevronDown aria-hidden className="size-3.5 transition-transform duration-[--dur-pop] ease-[--ease-out] group-aria-expanded:rotate-180" />
      </button>
      {open === k && (
        <div id={`menu-${k}`} className={centred ? panelCentred : panelLeft}>
          {content}
        </div>
      )}
    </li>
  )

  return (
    <nav aria-label="Main" className="ml-4 hidden lg:block">
      <ul ref={root} className="flex items-center gap-0.5">
        {top('product', 'Product', (
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-5">
            {nav.product.map((col) => (
              <section key={col.heading} aria-label={col.heading}>
                <SubHead>{col.heading}</SubHead>
                <ul className={col.links.length > 3 ? 'grid grid-cols-2 gap-2' : 'grid gap-2'}>
                  {col.links.map((l) => <li key={l.href}><Card link={l} onNavigate={close} /></li>)}
                </ul>
              </section>
            ))}
          </div>
        ), true)}
        {top('solutions', 'Solutions', (
          <div className="grid w-[600px] grid-cols-[1.4fr_1fr] gap-5">
            {nav.solutions.map((col) => (
              <section key={col.heading} aria-label={col.heading}>
                <SubHead>{col.heading}</SubHead>
                <ul className="grid gap-2">
                  {col.links.map((l) => <li key={l.href}><Card link={l} onNavigate={close} /></li>)}
                </ul>
              </section>
            ))}
          </div>
        ))}
        {top('network', 'Network', (
          <div className="w-[560px]">
            <section aria-label="The filmmaker network">
              <SubHead>The filmmaker network · being built</SubHead>
              <ul className="grid grid-cols-2 gap-2">
                {nav.network.map((l) => <li key={l.href}><Card link={l} badge={l.badge} onNavigate={close} /></li>)}
              </ul>
            </section>
            <section aria-label="Early access" className="mt-4">
              <SubHead>Early access</SubHead>
              <Card link={nav.earlyAccess} onNavigate={close} />
            </section>
          </div>
        ))}
        <li>
          <Link href="/pricing" aria-current={pathname === '/pricing' ? 'page' : undefined} className={trigger}>
            Pricing
          </Link>
        </li>
      </ul>
    </nav>
  )
}
