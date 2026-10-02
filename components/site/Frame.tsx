/**
 * The page frame (S-W §7): hero → what it replaces → capability blocks → how
 * it connects → security note → CTA band. Server components; no client JS.
 */
import * as React from 'react'
import Link from 'next/link'
import { ShieldCheck } from '@/components/icons'
import { FeatureList } from '@/components/FeatureLabel'
import { Media, firstMedia } from '@/components/site/Media'
import { Tilt } from '@/components/cinema/Tilt'
import { Reveal } from '@/components/cinema/Reveal'
import { Motif, type MotifName } from '@/components/cinema/Motif'
import { APP } from '@/lib/site'
import { cn } from '@/lib/utils'

/** The title-card rule: one gold hairline at the head of a page. */
export function Rule() {
  return <div aria-hidden className="h-px w-16 bg-primary" />
}

export function PageHero({
  title,
  lead,
  children,
  media,
  mediaPriority = true,
  size = 'lg',
  kicker,
  visual,
  motif = 'slate',
}: {
  title: React.ReactNode
  lead?: React.ReactNode
  children?: React.ReactNode
  media?: string | readonly string[]
  mediaPriority?: boolean
  size?: 'lg' | 'md'
  kicker?: string
  visual?: React.ReactNode
  motif?: MotifName
}) {
  const m = firstMedia(media)
  return (
    <section className="relative isolate -mt-16 overflow-hidden pb-16 pt-16">
      <div className="aurora -z-10" />
      <div className="viewfinder -z-10" />
      <Motif name={motif} />
      <div className={cn('container-wide pt-14 sm:pt-20', visual && 'grid items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]')}>
        <div>
        {kicker ? <p className="font-display text-[13px] font-semibold text-primary">{kicker}</p> : <Rule />}
        <h1 className={cn('mt-6 max-w-[18ch] font-display font-bold text-foreground', size === 'lg' ? 'text-[44px] leading-[1.02] tracking-[-0.03em] sm:text-[64px] lg:text-[76px]' : 'text-[40px] leading-[1.05] tracking-[-0.03em] sm:text-[56px]')}>
          {title}
        </h1>
        {lead && <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-8">{lead}</p>}
        {children && <div className="mt-8">{children}</div>}
        </div>
        {visual && <div className="stage-3d">{visual}</div>}
      </div>
      {m && (
        <div className="container-wide stage-3d mt-14">
          <div className="float-a" style={{ transform: 'rotateX(6deg)' }}>
            <Tilt className="screen" max={5}>
              <Media id={m} frame={false} priority={mediaPriority} />
            </Tilt>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
    </section>
  )
}

export function Section({
  id,
  title,
  lead,
  children,
  className,
  width = 'wide',
  kicker,
}: {
  id?: string
  kicker?: string
  title?: React.ReactNode
  lead?: React.ReactNode
  children?: React.ReactNode
  className?: string
  width?: 'wide' | 'measure'
}) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section id={id} aria-labelledby={title ? headingId : undefined} className={cn('py-20 sm:py-28', className)}>
      <div className={width === 'wide' ? 'container-wide' : 'container-measure'}>
        {kicker && <p className="mb-3 font-display text-[13px] font-semibold text-primary">{kicker}</p>}
        {title && (
          <h2 id={headingId} className="max-w-[24ch] font-display text-4xl font-bold tracking-[-0.025em] text-foreground sm:text-5xl">
            {title}
          </h2>
        )}
        {lead && <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-muted-foreground">{lead}</p>}
        {children && <div className={title || lead ? 'mt-10' : ''}>{children}</div>}
      </div>
    </section>
  )
}

/** "What it replaces" — the jobs a page takes over, as a quiet row. */
export function Replaces({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
      <ul className="flex flex-wrap gap-2 lg:max-w-[70%]">
        {items.map((t) => (
          <li key={t} className="rounded-full border border-border bg-card/30 px-3.5 py-1.5 text-[14px] text-muted-foreground line-through decoration-destructive/60 decoration-2">{t}</li>
        ))}
      </ul>
      <p className="flex items-center gap-3 font-display text-xl font-bold text-foreground">
        <span aria-hidden className="h-px w-10 bg-primary" /> One place, one record.
      </p>
    </div>
  )
}

export function CapabilityBlock({
  title,
  body,
  features,
  media,
  reverse = false,
  id,
}: {
  title: string
  body: React.ReactNode
  features?: ReadonlyArray<string | { id: string; text: React.ReactNode }>
  media?: string | readonly string[]
  reverse?: boolean
  id?: string
}) {
  const m = firstMedia(media)
  return (
    <div id={id} className={cn('grid items-start gap-8 border-t border-border py-12 lg:gap-14', m && (reverse ? 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : 'lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]'))}>
      <div className={cn('max-w-[52ch]', reverse && 'lg:order-2')}>
        <h3 className="font-display text-3xl font-bold tracking-[-0.02em] text-foreground">{title}</h3>
        <div className="mt-3 space-y-3 text-[15px] leading-7 text-muted-foreground">{body}</div>
        {features && features.length > 0 && <FeatureList items={features} className="mt-6" />}
      </div>
      {m && (
        <div className={cn(reverse && 'lg:order-1')}>
          <Reveal><div className="stage-3d"><div style={{ transform: reverse ? 'rotateY(6deg)' : 'rotateY(-6deg)' }}><Tilt className="screen" max={5}><Media id={m} frame={false} sizes="(min-width: 1200px) 660px, (min-width: 1024px) 56vw, 100vw" /></Tilt></div></div></Reveal>
        </div>
      )}
    </div>
  )
}

export function SecurityNote({ children }: { children: React.ReactNode }) {
  return (
    <aside data-security-note className="flex gap-4 squircle border border-border bg-card/40 p-5 sm:p-6">
      <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="space-y-2 text-[15px] leading-7 text-muted-foreground">
        {children}
        <p>
          <Link href="/security" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">How Genreline is secured</Link>
        </p>
      </div>
    </aside>
  )
}

/** The close (S-W §6 section 11). Its primary CTA carries data-primary-cta, so
 *  the header's goes quiet while this one is on screen. */
export function CtaBand({
  line = 'Open a studio, invite your team, add your first client. The record starts with the first approval.',
}: { line?: string }) {
  return (
    <section aria-label="Open Studio OS" className="py-16 sm:py-24">
      <div className="container-wide">
        <div className="relative overflow-hidden squircle-xl border border-border bg-card/50 px-6 py-12 sm:px-12 sm:py-16">
          <Rule />
          <p className="mt-6 max-w-[34ch] font-display text-2xl font-semibold leading-snug text-foreground sm:text-3xl">{line}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href={APP.signup} data-primary-cta className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Open Studio OS</a>
            <a href={APP.login} className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">Already have one? Sign in</a>
          </div>
        </div>
      </div>
    </section>
  )
}

/** A short, plain list — for "how it connects" and similar. */
export function Connects({ items }: { items: ReadonlyArray<{ href: string; title: string; body: string }> }) {
  return (
    <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((i) => (
        <li key={i.href + i.title}>
          <Link href={i.href} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="font-display text-[17px] font-semibold text-foreground underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-primary">{i.title}</span>
            <span className="mt-1 block text-[15px] leading-7 text-muted-foreground">{i.body}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
