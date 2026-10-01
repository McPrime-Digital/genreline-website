'use client'

/**
 * The header's menus, as the WAI-ARIA DISCLOSURE NAVIGATION pattern: each
 * top item is a button with aria-expanded, and its panel follows it in the
 * DOM, so Tab walks from the button straight into the panel's links with no
 * focus proxy. (Radix NavigationMenu's aria-hidden focus proxy is what axe
 * flagged — serious — so it was replaced rather than suppressed.)
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

const panel =
  'anim-in absolute left-0 top-full z-50 mt-2 origin-top-left squircle-lg border border-border bg-popover p-3 text-popover-foreground ' +
  'shadow-[0_24px_64px_-28px_hsl(var(--foreground)/0.35),0_0_0_0.5px_hsl(var(--glow)/0.12)]'

function Item({ link, badge, onNavigate }: { link: NavLink; badge?: 'Available' | 'Coming' | null; onNavigate: () => void }) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className="block rounded-xl px-3 py-2.5 outline-none transition-colors duration-[--dur-pop] hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {link.label}
        {badge && (
          <Badge tone={badge === 'Coming' ? 'blue' : 'green'} dot data-feature-label={badge.toLowerCase()} data-feature-id={link.featureId}>
            {badge}
          </Badge>
        )}
      </span>
      {link.description && <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{link.description}</span>}
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

  const top = (k: Key, label: string, content: React.ReactNode) => (
    <li
      className="relative"
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
        <div id={`menu-${k}`} className={panel}>
          {content}
        </div>
      )}
    </li>
  )

  return (
    <nav aria-label="Main" className="ml-4 hidden lg:block">
      <ul ref={root} className="flex items-center gap-0.5">
        {top('product', 'Product', (
          <div className="grid w-[760px] grid-cols-[1fr_1.35fr_1fr] gap-2">
            {nav.product.map((col) => (
              <div key={col.heading}>
                <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold text-muted-foreground">{col.heading}</p>
                <ul>
                  {col.links.map((l) => <li key={l.href}><Item link={l} onNavigate={close} /></li>)}
                </ul>
              </div>
            ))}
          </div>
        ))}
        {top('solutions', 'Solutions', (
          <ul className="w-[400px]">
            {nav.solutions.map((l) => <li key={l.href}><Item link={l} onNavigate={close} /></li>)}
          </ul>
        ))}
        {top('network', 'Network', (
          <div className="w-[400px]">
            <ul>
              {nav.network.map((l) => <li key={l.href}><Item link={l} badge={l.badge} onNavigate={close} /></li>)}
            </ul>
            <div className="glow-divider-x my-2" />
            <Item link={nav.earlyAccess} onNavigate={close} />
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
