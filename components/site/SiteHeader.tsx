'use client'

/**
 * The header (S-W §5.1). Sticky glass; a Radix NavigationMenu mega-menu that
 * is keyboard-complete (arrows, Enter, Escape) and origin-aware; Search on
 * ⌘K; Sign in; Open your studio.
 *
 * ONE GOLD PER VIEW (S-B). The header's "Open your studio" is gold only when
 * no other primary call to action is on screen. Every primary CTA on a page
 * carries `data-primary-cta`; an IntersectionObserver (not a scroll listener)
 * counts the ones in view.
 */
import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NavigationMenu } from 'radix-ui'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Kbd } from '@/components/ui/kbd'
import { ProductMark } from '@/components/ProductMark'
import { MobileNav } from '@/components/site/MobileNav'
import { cn } from '@/lib/utils'
import { APP } from '@/lib/site'
import type { NavColumn, NavLink, NavLinkWithBadge } from '@/content/nav'

const SearchPalette = React.lazy(() => import('@/components/site/SearchPalette'))

export type HeaderNav = {
  product: NavColumn[]
  solutions: NavLink[]
  network: NavLinkWithBadge[]
  earlyAccess: NavLink
}

const trigger =
  'group inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-muted-foreground outline-none ' +
  'transition-colors duration-[--dur-pop] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring ' +
  'data-[state=open]:text-foreground data-[active]:text-foreground'

function MenuLink({ link, badge }: { link: NavLink; badge?: 'Available' | 'Coming' | null }) {
  return (
    <NavigationMenu.Link asChild>
      <Link
        href={link.href}
        className="group/link block rounded-xl px-3 py-2.5 outline-none transition-colors duration-[--dur-pop] hover:bg-secondary/60 focus-visible:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring"
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
    </NavigationMenu.Link>
  )
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
            <ProductMark size={30} />
          </Link>

          <NavigationMenu.Root className="relative ml-4 hidden lg:block" delayDuration={120} aria-label="Main">
            <NavigationMenu.List className="flex items-center gap-0.5">
              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={trigger}>
                  Product
                  <ChevronDown aria-hidden className="size-3.5 transition-transform duration-[--dur-pop] ease-[--ease-out] group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="w-[760px] p-3 data-[motion^=from-]:anim-fade-in data-[motion^=to-]:anim-fade-out">
                  <div className="grid grid-cols-[1fr_1.35fr_1fr] gap-2">
                    {nav.product.map((col) => (
                      <div key={col.heading}>
                        <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold text-faint">{col.heading}</p>
                        <ul>
                          {col.links.map((l) => (
                            <li key={l.href}><MenuLink link={l} /></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={trigger}>
                  Solutions
                  <ChevronDown aria-hidden className="size-3.5 transition-transform duration-[--dur-pop] ease-[--ease-out] group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="w-[420px] p-3 data-[motion^=from-]:anim-fade-in data-[motion^=to-]:anim-fade-out">
                  <ul>
                    {nav.solutions.map((l) => (
                      <li key={l.href}><MenuLink link={l} /></li>
                    ))}
                  </ul>
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Trigger className={trigger}>
                  Network
                  <ChevronDown aria-hidden className="size-3.5 transition-transform duration-[--dur-pop] ease-[--ease-out] group-data-[state=open]:rotate-180" />
                </NavigationMenu.Trigger>
                <NavigationMenu.Content className="w-[420px] p-3 data-[motion^=from-]:anim-fade-in data-[motion^=to-]:anim-fade-out">
                  <ul>
                    {nav.network.map((l) => (
                      <li key={l.href}><MenuLink link={l} badge={l.badge} /></li>
                    ))}
                  </ul>
                  <div className="glow-divider-x my-2" />
                  <MenuLink link={nav.earlyAccess} />
                </NavigationMenu.Content>
              </NavigationMenu.Item>

              <NavigationMenu.Item>
                <NavigationMenu.Link asChild active={pathname === '/pricing'}>
                  <Link href="/pricing" className={trigger}>Pricing</Link>
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>

            <div className="absolute left-0 top-full flex justify-start pt-2">
              <NavigationMenu.Viewport
                className={cn(
                  'relative origin-top-left overflow-hidden squircle-lg border border-border bg-popover text-popover-foreground',
                  'shadow-[0_24px_64px_-28px_hsl(var(--foreground)/0.35),0_0_0_0.5px_hsl(var(--glow)/0.12)]',
                  'h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)]',
                  'transition-[width,height] duration-[--dur-panel] ease-[--ease-out] motion-reduce:transition-none',
                  'data-[state=open]:anim-in data-[state=closed]:anim-out',
                )}
              />
            </div>
          </NavigationMenu.Root>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="md" onClick={openSearch} aria-label="Search the site" className="hidden px-2.5 md:inline-flex">
              <Search aria-hidden />
              <span className="text-[13px]">Search</span>
              <Kbd className="ml-1">⌘&nbsp;K</Kbd>
            </Button>
            <Button variant="ghost" size="icon" onClick={openSearch} aria-label="Search the site" className="md:hidden">
              <Search aria-hidden />
            </Button>
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
