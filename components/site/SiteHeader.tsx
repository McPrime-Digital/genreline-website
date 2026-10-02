'use client'

/**
 * The header (S-W §5.1). Sticky glass; the menus as a disclosure navigation
 * (MegaMenu.tsx); the theme switch; and the two calls to action as liquid
 * pills in capitals (owner, 2026-10-01: "sign in and open studio os must be
 * caps and have a proper pill or small card liquid form"). There is no search
 * in the header (owner, the same day: "remove the search at the top").
 *
 * ONE GOLD PER VIEW (S-B). OPEN STUDIO OS is the gold pill only when no other
 * primary call to action is on screen; every primary CTA on a page carries
 * `data-primary-cta`, and an IntersectionObserver counts the ones in view.
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ProductMark } from '@/components/ProductMark'
import { MobileNav } from '@/components/site/MobileNav'
import { MegaMenu } from '@/components/site/MegaMenu'
import { ThemeToggle } from '@/components/site/ThemeToggle'
import { cx as cn } from '@/lib/cx'
import { APP } from '@/lib/site'
import type { NavColumn, NavLink, NavLinkWithBadge } from '@/content/nav'

export type HeaderNav = {
  product: NavColumn[]
  solutions: NavColumn[]
  network: NavLinkWithBadge[]
  earlyAccess: NavLink
}

export function SiteHeader({ nav }: { nav: HeaderNav }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = React.useState(false)
  // SSR assumes a primary CTA is in view (the header pill stays glass) — the
  // safe side of "one gold per view".
  const [primaryInView, setPrimaryInView] = React.useState(true)

  React.useEffect(() => {
    const sentinel = document.getElementById('top-sentinel')
    if (!sentinel) return
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting))
    io.observe(sentinel)
    return () => io.disconnect()
  }, [])

  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-primary-cta]'))
    const visible = new Set<Element>()
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visible.add(e.target)
        else visible.delete(e.target)
      }
      setPrimaryInView(visible.size > 0)
    })
    els.forEach((el) => io.observe(el))
    // A page with no primary CTA at all: the header's is the one gold.
    const raf = els.length === 0 ? requestAnimationFrame(() => setPrimaryInView(false)) : 0
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [pathname])

  return (
    <header className="sticky top-0 z-40">
      <div className="relative bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-[not(backdrop-filter:blur(1px))]:bg-background">
        <div className="container-wide flex h-16 items-center gap-4">
          <Link href="/" aria-label="Genreline home" className="-ml-1 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ProductMark size={30} nameClassName="max-[359px]:hidden" />
          </Link>

          <MegaMenu nav={nav} />

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle compact />
            <a href={APP.login} className="liquid-pill hidden outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">
              Sign in
            </a>
            <a href={APP.signup} className={cn(primaryInView ? 'liquid-pill' : 'liquid-pill-gold', 'hidden outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex')}>
              Open Studio OS
            </a>
            <MobileNav nav={nav} />
          </div>
        </div>
        <div aria-hidden className={cn('glow-divider-x absolute inset-x-0 bottom-0 transition-opacity duration-[--dur-panel]', scrolled ? 'opacity-100' : 'opacity-0')} />
      </div>
    </header>
  )
}
