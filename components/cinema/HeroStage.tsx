/**
 * THE HERO — the product itself as the background. A wall of real Genreline
 * screens, tilted and moving slowly, behind a headline that names every space
 * and portal. No decorative light: the screens are the image.
 */
import { existsSync } from 'node:fs'
import localFont from 'next/font/local'
import { join } from 'node:path'
import { Media, hasMedia } from '@/components/site/Media'
import { Icon, type IconName } from '@/components/Icon'
import { Timecode } from '@/components/cinema/Timecode'
import { HeroReel } from '@/components/cinema/HeroReel'
import { APP, INDEXABLE } from '@/lib/site'

const exists = (p: string) => existsSync(join(process.cwd(), 'public', p))

// The title card's face: Cinzel (owner, 2026-10-02: "a better serif with FILM
// OS designs inside the writing") — inscriptional Roman capitals, the letter
// the film poster has used for a century. 800 sets the title, 700 the slate
// line above it. Each weight is cut to the capitals, digits and punctuation a
// title uses (fonts/README.md) — under 6 KB — and loaded here, on the one page
// that sets it, rather than in the layout on every page.
const title = localFont({
  src: [
    { path: '../../fonts/cinzel-title-700.woff2', weight: '700' },
    { path: '../../fonts/cinzel-title-800.woff2', weight: '800' },
  ],
  variable: '--font-title',
  display: 'swap',
})

const ROWS = [
  ['client-messages', 'crew-tasks', 'portal-review', 'client-review-record', 'suite-library', 'crew-production', 'home-portal-brand-a'],
  ['crew-calendar', 'client-contracts', 'portal-files', 'crew-chat', 'client-guest-links', 'portal-certificate', 'client-brand-kit'],
  ['client-overview', 'portal-meetings', 'crew-directory', 'client-invoices', 'portal-messages', 'home-portal-brand-b', 'crew-sso'],
]

const ENTRIES: { href: string; icon: IconName; name: string; line: string }[] = [
  { href: '#space-crew', icon: 'UsersRound', name: 'Crew space', line: 'Your team, tasks, rooms and permissions' },
  { href: '#space-client', icon: 'Building2', name: 'Client space', line: 'Every client company, in one room' },
  { href: '#space-portal', icon: 'AppWindow', name: 'Client portal', line: 'Review, sign and pay — in your brand' },
  { href: '#space-suite', icon: 'Clapperboard', name: 'The Suite', line: 'Write, board, generate, edit, finish' },
  { href: '#space-platform', icon: 'ShieldCheck', name: 'Platform', line: 'Identity, security and the record' },
]

function Wall() {
  return (
    <div aria-hidden className="absolute inset-0 -z-20 hidden overflow-hidden md:block">
      <div className="absolute left-[62%] top-[46%] w-[2400px] -translate-x-1/2 -translate-y-1/2 space-y-5 opacity-[0.85] dark:opacity-[0.7]" style={{ transform: 'translate(-50%, -50%) perspective(2000px) rotateX(28deg) rotateZ(-10deg)' }}>
        {ROWS.map((row, r) => {
          const ids = row.filter(hasMedia)
          return (
            <div key={r} className={`marquee ${r % 2 ? 'marquee-reverse' : ''}`} style={{ ['--marquee-dur' as string]: `${140 + r * 30}s`, maskImage: 'none' }}>
              <div className="marquee-track">
                {[...ids, ...ids].map((id, n) => (
                  <div key={n} className="mx-2.5 w-[340px] shrink-0 overflow-hidden rounded-xl border border-foreground/10 bg-card">
                    <Media id={id} frame={false} sizes="340px" quality={45} className="!rounded-none" />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {/* the scrim: the screens recede, the headline reads */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.96)_34%,hsl(var(--background)/0.55)_58%,hsl(var(--background)/0.25)_80%,hsl(var(--background)/0.45)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-background" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
    </div>
  )
}

export function HeroStage() {
  const reel = exists('media/hero-reel.mp4') ? '/media/hero-reel.mp4' : null
  const poster = exists('media/hero-reel.poster.webp') ? '/media/hero-reel.poster.webp' : null
  return (
    <section className={`${title.variable} relative isolate -mt-16 overflow-hidden pt-16`}>
      {reel ? <HeroReel src={reel} poster={poster} showSlot={false} /> : <Wall />}
      {!reel && <HeroReel src={null} poster={null} showSlot={!INDEXABLE} />}
      <div className="container-wide relative pb-20 pt-20 sm:pt-28">
        {/* THE SLATE LINE (owner, 2026-10-02: "in the middle on the same line,
            and a better design"). A camera's top bar: REC at one end, the
            running timecode at the other, the line itself centred between two
            gold rules. It never wraps: below lg the ends step aside, and the
            words are sized to the width they have (globals.css). */}
        <div className="slate-line">
          <span className="slate-side">
            <span aria-hidden className="slate-end hidden lg:inline-flex">
              <span className="rec size-1.5 rounded-full bg-destructive" />
              Rec
            </span>
            <span aria-hidden className="slate-rule" />
          </span>
          <p className="slate-text">The operating system for AI & hybrid film production</p>
          <span className="slate-side">
            <span aria-hidden className="slate-rule slate-rule-end" />
            <Timecode className="slate-end hidden lg:inline" />
          </span>
        </div>
        {/* A title card, not a headline (owner, 2026-10-01: "all in caps with a
            FILM OS flair"). The letters are cut from film stock: a metal fill,
            two frame lines and a row of perforations running inside every
            glyph (globals.css, THE FILM IN THE LETTERS). */}
        <h1 className="film-title mt-10 text-[clamp(28px,5.4vw,64px)]">
          <span className="film-line film-line-silver block">Every space of production<span className="film-stop">.</span></span>
          <span className="film-line film-line-gold block">One operating system<span className="film-stop">.</span></span>
        </h1>
        <p className="mt-7 max-w-[62ch] text-lg leading-relaxed text-muted-foreground sm:text-[19px] sm:leading-8">
          Genreline runs AI and hybrid film production end to end — the Crew space where your team works, the Client space and a portal in your brand where clients review, approve, sign and pay, and the Suite where the work is written, boarded, generated, edited and finished. Contracts, rights, money and security run underneath all of it, on one record.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href={APP.signup} data-primary-cta className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Open Studio OS account</a>
          <a href="/contact?topic=sales" className="liquid-pill liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">Talk to sales</a>
        </div>

        <nav aria-label="The spaces and portals" className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {ENTRIES.map((e) => (
            <a key={e.href} href={e.href} className="group flex items-start gap-3 bg-background/85 p-5 backdrop-blur transition-colors hover:bg-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary transition-colors group-hover:border-primary/50"><Icon name={e.icon} className="size-5" /></span>
              <span>
                <span className="block font-display text-[15px] font-semibold text-foreground">{e.name}</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">{e.line}</span>
              </span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
