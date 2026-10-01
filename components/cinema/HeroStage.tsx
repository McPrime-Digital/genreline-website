/**
 * THE HERO. A full-height stage: the owner's reel (or the lit stage), the
 * aurora and an anamorphic flare, a viewfinder grid, the headline, and three
 * real product screens floating in perspective — the room, the record and
 * the production — each leaning toward the pointer.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { Button } from '@/components/ui/button'
import { Media, hasMedia } from '@/components/site/Media'
import { Tilt } from '@/components/cinema/Tilt'
import { Timecode } from '@/components/cinema/Timecode'
import { HeroReel } from '@/components/cinema/HeroReel'
import { APP, INDEXABLE } from '@/lib/site'

const exists = (p: string) => existsSync(join(process.cwd(), 'public', p))

export function HeroStage() {
  const reel = exists('media/hero-reel.mp4') ? '/media/hero-reel.mp4' : null
  const poster = exists('media/hero-reel.poster.webp') ? '/media/hero-reel.poster.webp' : null
  const front = ['home-hero-room', 'client-messages'].find(hasMedia)
  const left = ['client-review-record', 'portal-review'].find(hasMedia)
  const right = ['crew-production', 'crew-tasks'].find(hasMedia)
  return (
    <section className="relative isolate -mt-16 overflow-hidden pt-16">
      <HeroReel src={reel} poster={poster} showSlot={!INDEXABLE} />
      <div className="aurora -z-10" />
      <div className="viewfinder -z-10" />
      <div className="flare top-[38%] -z-10" />

      <div className="container-wide relative pb-10 pt-16 sm:pt-24 lg:pt-28">
        {/* the slate */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-3 py-1 backdrop-blur">
            <span className="rec size-2 rounded-full bg-destructive" aria-hidden />
            The production operating system
          </span>
          <span className="hidden font-display text-foreground/70 sm:inline">SC 01 · TK 1</span>
          <Timecode className="hidden font-display text-foreground/70 sm:inline" />
        </div>

        <h1 className="mt-8 max-w-[14ch] font-display text-[46px] font-bold leading-[0.98] tracking-[-0.035em] text-foreground sm:text-[72px] lg:text-[92px]">
          Run the production.{' '}
          <span className="text-gold-sheen">Keep the record.</span>
        </h1>
        <p className="mt-7 max-w-[56ch] text-lg leading-relaxed text-muted-foreground sm:text-xl sm:leading-8">
          Your crew, your clients, the cuts, the approvals, the contracts and the money — one system for a film or media studio, with a record that still holds up after the wrap.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4">
          <Button asChild variant="primary" size="lg" data-primary-cta className="h-12 px-6 text-[15px] shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.7)]">
            <a href={APP.signup}>Open your studio</a>
          </Button>
          <a href="#spaces" className="inline-flex h-12 items-center rounded-lg border border-border bg-background/40 px-5 text-[15px] font-medium text-foreground backdrop-blur transition-colors hover:bg-secondary/60">
            Tour the three spaces
          </a>
        </div>
        <p className="mt-5 text-[13px] text-muted-foreground">Inside in under a minute. Your clients are invited by you, never by us.</p>
      </div>

      {/* three screens in depth */}
      {front && (
        <div className="container-wide relative pb-24">
          <div className="stage-3d relative mx-auto max-w-[1100px]">
            {left && (
              <div className="absolute -left-4 top-10 hidden w-[46%] lg:block" style={{ transform: 'rotateY(18deg) rotateX(4deg) translateZ(-120px)' }}>
                <div className="float-b opacity-80"><div className="screen"><Media id={left} frame={false} sizes="520px" /></div></div>
              </div>
            )}
            {right && (
              <div className="absolute -right-4 top-16 hidden w-[44%] lg:block" style={{ transform: 'rotateY(-18deg) rotateX(4deg) translateZ(-140px)' }}>
                <div className="float-c opacity-80"><div className="screen"><Media id={right} frame={false} sizes="500px" /></div></div>
              </div>
            )}
            <div className="relative mx-auto lg:w-[74%]" style={{ transform: 'rotateX(8deg)' }}>
              <div className="float-a">
                <Tilt className="screen rounded-[22px]" max={6}>
                  <Media id={front} frame={false} priority sizes="(min-width: 1024px) 820px, 100vw" />
                </Tilt>
              </div>
              {/* a live note pinned on the frame */}
              <div className="absolute -bottom-6 left-6 hidden items-center gap-3 rounded-xl border border-border bg-popover/90 px-4 py-3 shadow-2xl backdrop-blur sm:flex">
                <span className="grid size-8 place-items-center rounded-full bg-primary/15 font-display text-[12px] font-bold text-foreground">ML</span>
                <span className="text-[13px] leading-5 text-foreground">Approved — Spring campaign, rough cut v4<br /><span className="text-muted-foreground">On the record · 11:15 AM</span></span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </section>
  )
}
