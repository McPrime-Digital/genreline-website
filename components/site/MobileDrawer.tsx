'use client'

/**
 * The mobile drawer (S-W §5.1), loaded on first intent by MobileNav.tsx: full screen, the header's structure as
 * accordions, the two CTAs pinned to the bottom above the safe area.
 *
 * It enters from the right and leaves to the right (spatial consistency), and
 * it can be SWIPED shut: 1:1 tracking with pointer capture, a direction lock
 * after a small threshold (vaul: 10px touch, 2px pointer), and a release that
 * closes on distance OR velocity (emil-design-eng: 0.11 px/ms) — a flick is
 * enough. Vertical scrolling stays native (`touch-action: pan-y`).
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Accordion, Dialog, VisuallyHidden } from 'radix-ui'
import { ChevronDown, X } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductMark } from '@/components/ProductMark'
import { APP } from '@/lib/site'
import type { HeaderNav } from '@/components/site/SiteHeader'

const VELOCITY_CLOSE = 0.11 // px/ms
const START_TOUCH = 10
const START_POINTER = 2

/** The header's cards, at phone size: icon, title, undertext. */
function Row({ href, label, description, badge, onNavigate, featureId, iconNode }: { href: string; label: string; description?: string; badge?: 'Available' | 'Coming' | null; featureId?: string; iconNode?: React.ReactNode; onNavigate: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/40 p-3 outline-none transition-colors active:bg-card/80 focus-visible:ring-2 focus-visible:ring-ring">
      {iconNode && <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary">{iconNode}</span>}
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-foreground">
          {label}
          {badge && <Badge tone="blue" dot data-feature-label={badge.toLowerCase()} data-feature-id={featureId}>{badge}</Badge>}
        </span>
        {description && <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{description}</span>}
      </span>
    </Link>
  )
}

/** A sub-head, as in the header's panels. */
function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-1 flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--gold-ink))]">
      <span className="shrink-0">{children}</span>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </p>
  )
}

function Section({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <Accordion.Item value={value} className="border-b border-border">
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left font-display text-lg font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {title}
          <ChevronDown aria-hidden className="size-4 text-muted-foreground transition-transform duration-[--dur-pop] ease-[--ease-out] group-data-[state=open]:rotate-180" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="overflow-hidden pb-3">{children}</Accordion.Content>
    </Accordion.Item>
  )
}

export default function MobileDrawer({ nav, open, setOpen }: { nav: HeaderNav; open: boolean; setOpen: (o: boolean) => void }) {
  const pathname = usePathname()
  const panel = React.useRef<HTMLDivElement>(null)
  const drag = React.useRef<{ x: number; y: number; t: number; id: number; type: string; active: boolean; locked: boolean; dx: number } | null>(null)
  const suppressClick = React.useRef(false)
  // A swipe already carried the panel off screen; the exit animation must not replay.
  const [swiped, setSwiped] = React.useState(false)

  // Navigating closes the drawer.
  const [lastPath, setLastPath] = React.useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    if (open) setOpen(false)
  }

  const close = () => setOpen(false)

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, type: e.pointerType, active: false, locked: false, dx: 0 }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    const el = panel.current
    if (!d || !el || e.pointerId !== d.id) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.active) {
      if (d.locked) return
      const threshold = d.type === 'touch' ? START_TOUCH : START_POINTER
      if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx)) { d.locked = true; return } // a scroll, not a swipe
      if (dx < threshold || Math.abs(dx) < Math.abs(dy)) return
      d.active = true
      el.setPointerCapture(e.pointerId)
    }
    // Rightward follows 1:1; leftward rubber-bands (apple-design §9).
    const x = dx >= 0 ? dx : (dx * 0.55 * 40) / (40 + 0.55 * Math.abs(dx))
    d.dx = dx
    el.style.transform = `translateX(${x}px)`
  }
  const onPointerUp = () => {
    const d = drag.current
    const el = panel.current
    drag.current = null
    if (!d || !el || !d.active) return
    suppressClick.current = true
    const dt = Math.max(1, performance.now() - d.t)
    const velocity = d.dx / dt
    const width = el.getBoundingClientRect().width
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (d.dx > width * 0.35 || velocity > VELOCITY_CLOSE) {
      setSwiped(true)
      const from = el.style.transform || 'translateX(0px)'
      const anim = el.animate([{ transform: from }, { transform: 'translateX(100%)' }], { duration: reduce ? 0 : 200, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' })
      anim.onfinish = () => setOpen(false)
    } else {
      const from = el.style.transform
      el.style.transform = ''
      el.animate([{ transform: from }, { transform: 'translateX(0px)' }], { duration: reduce ? 0 : 200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (o) setSwiped(false)
        setOpen(o)
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          ref={panel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={(e) => {
            if (suppressClick.current) {
              suppressClick.current = false
              e.preventDefault()
              e.stopPropagation()
            }
          }}
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-background text-foreground outline-none [touch-action:pan-y] data-[state=open]:anim-slide-in data-[state=closed]:anim-slide-out"
          style={swiped ? { animation: 'none' } : undefined}
        >
          <VisuallyHidden.Root asChild><Dialog.Title>Menu</Dialog.Title></VisuallyHidden.Root>
          <div className="flex h-16 shrink-0 items-center justify-between px-5 pt-[env(safe-area-inset-top)]">
            <Link href="/" onClick={close} aria-label="Genreline home" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <ProductMark size={30} />
            </Link>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu"><X aria-hidden /></Button>
            </Dialog.Close>
          </div>
          <nav aria-label="Main" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
            <Accordion.Root type="single" collapsible>
              <Section value="product" title="Product">
                {nav.product.map((col) => (
                  <div key={col.heading} className="pb-3">
                    <SubHead>{col.heading}</SubHead>
                    <div className="grid gap-2">{col.links.map((l) => <Row key={l.href} {...l} onNavigate={close} />)}</div>
                  </div>
                ))}
              </Section>
              <Section value="solutions" title="Solutions">
                {nav.solutions.map((col) => (
                  <div key={col.heading} className="pb-3">
                    <SubHead>{col.heading}</SubHead>
                    <div className="grid gap-2">{col.links.map((l) => <Row key={l.href} {...l} onNavigate={close} />)}</div>
                  </div>
                ))}
              </Section>
              <Section value="network" title="Network">
                <SubHead>The filmmaker network · being built</SubHead>
                <div className="grid gap-2">{nav.network.map((l) => <Row key={l.href} {...l} onNavigate={close} />)}</div>
                <div className="pt-3"><SubHead>Early access</SubHead><Row {...nav.earlyAccess} onNavigate={close} /></div>
              </Section>
            </Accordion.Root>
            <ul className="py-2">
              {[
                { href: '/pricing', label: 'Pricing' },
                { href: '/security', label: 'Security' },
                { href: '/roadmap', label: 'Roadmap' },
                { href: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={close} className="block py-3 font-display text-lg font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <a href={APP.login} className="liquid-pill liquid-pill-lg w-full outline-none focus-visible:ring-2 focus-visible:ring-ring">Sign in</a>
            <a href={APP.signup} className="liquid-pill-gold liquid-pill-lg w-full outline-none focus-visible:ring-2 focus-visible:ring-ring">Open Studio OS</a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
