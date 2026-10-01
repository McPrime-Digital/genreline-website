'use client'

/**
 * The header (S-W §5.1). Sticky glass; the mega-menu as a disclosure
 * navigation (MegaMenu.tsx); Search on ⌘K; Sign in; Open your studio.
 *
 * ONE GOLD PER VIEW (S-B). The header's "Open your studio" is gold only when
 * no other primary call to action is on screen. Every primary CTA on a page
 * carries `data-primary-cta`; an IntersectionObserver (not a scroll listener)
 * counts the ones in view.
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { ProductMark } from '@/components/ProductMark'
import { MobileNav } from '@/components/site/MobileNav'
import { MegaMenu } from '@/components/site/MegaMenu'
import { ThemeToggle } from '@/components/site/ThemeToggle'
import { cx as cn } from '@/lib/cx'
import { APP } from '@/lib/site'
import type { NavColumn, NavLink, NavLinkWithBadge } from '@/content/nav'

const SearchPalette = React.lazy(() => import('@/components/site/SearchPalette'))

export type HeaderNav = {
  product: NavColumn[]
  solutions: NavLink[]
  network: NavLinkWithBadge[]
  earlyAccess: NavLink
}

export function SiteHeader({ nav }: { nav: HeaderNav }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = React.useState(false)
  // SSR assumes a primary CTA is in view (the header CTA stays quiet) — the
  // safe side of "one gold per view".
  const [primaryInView, setPrimaryInView] = React.useState(true)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchLoaded, setSearchLoaded] = React.useState(false)

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

  // ⌘K / Ctrl-K opens search from anywhere — a keyboard action, so it opens
  // with no animation (the app's palette makes the same decision).
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchLoaded(true)
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const openSearch = () => {
    setSearchLoaded(true)
    setSearchOpen(true)
  }

  return (
    <header className="sticky top-0 z-40">
      <div className="relative bg-background/80 backdrop-blur-xl backdrop-saturate-150 supports-[not(backdrop-filter:blur(1px))]:bg-background">
        <div className="container-wide flex h-16 items-center gap-4">
          <Link href="/" aria-label="Genreline home" className="-ml-1 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ProductMark size={30} nameClassName="max-[359px]:hidden" />
          </Link>

          <MegaMenu nav={nav} />

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="md" onClick={openSearch} aria-label="Search the site" className="hidden md:inline-flex">
              <Search aria-hidden />
              <span className="text-[13px]">Search</span>
              <Kbd className="ml-1">⌘&nbsp;K</Kbd>
            </Button>
            <Button variant="ghost" size="icon" onClick={openSearch} aria-label="Search the site" className="md:hidden">
              <Search aria-hidden />
            </Button>
            <ThemeToggle compact />
            <a href={APP.login} className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring lg:inline-block">
              Sign in
            </a>
            <Button asChild variant={primaryInView ? 'outline' : 'primary'} size="md" className="hidden sm:inline-flex">
              <a href={APP.signup}>Open your studio</a>
            </Button>
            <MobileNav nav={nav} />
          </div>
        </div>
        <div aria-hidden className={cn('glow-divider-x absolute inset-x-0 bottom-0 transition-opacity duration-[--dur-panel]', scrolled ? 'opacity-100' : 'opacity-0')} />
      </div>
      {searchLoaded && (
        <React.Suspense fallback={null}>
          <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
        </React.Suspense>
      )}
    </header>
  )
}
