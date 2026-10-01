'use client'

/**
 * The menu button, and nothing else until somebody reaches for it. The drawer
 * (Radix Dialog + Accordion, ~25 KB) loads on the first pointer-enter, touch
 * or focus, so it is usually ready before the tap lands, and no page view
 * pays for a drawer that is never opened.
 */
import * as React from 'react'
import { Menu } from '@/components/icons'
import { Button } from '@/components/ui/button'
import type { HeaderNav } from '@/components/site/SiteHeader'

const load = () => import('@/components/site/MobileDrawer')
const MobileDrawer = React.lazy(load)

export function MobileNav({ nav }: { nav: HeaderNav }) {
  const [wanted, setWanted] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="lg:hidden"
        onPointerEnter={load}
        onTouchStart={load}
        onFocus={load}
        onClick={() => { setWanted(true); setOpen(true) }}
      >
        <Menu aria-hidden />
      </Button>
      {wanted && (
        <React.Suspense fallback={null}>
          <MobileDrawer nav={nav} open={open} setOpen={setOpen} />
        </React.Suspense>
      )}
    </>
  )
}
