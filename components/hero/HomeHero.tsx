/**
 * THE HOME HERO (batch W-3D-1) — the logo's line in space. A 300vh section
 * with a sticky 100svh stage: the camera follows the gold line through its
 * three tiles — Crew, Client, Suite — as the visitor scrolls, and the words
 * of each shot fade in over it.
 *
 * Built in this order, so the page stays fast:
 *  1. First paint is HTML: the slate line, the title card, the lede, the two
 *     calls to action, over a poster of the scene's first frame (AVIF, the
 *     Largest Contentful Paint).
 *  2. After first paint HeroDirector maps the scroll (GSAP ScrollTrigger) and,
 *     on a capable device, loads the 3D canvas over the poster.
 * The canvas is decoration: every word is here, in the HTML, and every word
 * comes from content/home.ts.
 */
import 'server-only'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import localFont from 'next/font/local'
import { preload } from 'react-dom'
import { Icon } from '@/components/Icon'
import { HeroDirector } from '@/components/hero/HeroDirector'
import type { ScreenSources, ScreenSlot } from '@/components/hero/scene/textures'
import { hero, type HeroNodeId } from '@/content/home'

// The title card's face: Cinzel, cut to the capitals a title uses (fonts/README.md).
const title = localFont({
  src: [
    { path: '../../fonts/cinzel-title-700.woff2', weight: '700' },
    { path: '../../fonts/cinzel-title-800.woff2', weight: '800' },
  ],
  variable: '--font-title',
  display: 'swap',
})

const pub = (p: string) => existsSync(join(process.cwd(), 'public', p))

/** Each space's screen shows that space's own product capture (the same ones the Spaces section uses). */
const SCREEN_CAPTURE: Record<ScreenSlot, string> = { crew: 'crew-tasks', client: 'client-messages', suite: 'suite-library' }

function screenSources(): ScreenSources {
  const f = join(process.cwd(), 'public', 'captures', 'dimensions.json')
  const dims: Record<string, { file?: string }> = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
  const file = (id: string, theme: 'light' | 'dark') => {
    const name = dims[`${id}.${theme}`]?.file
    return name && pub(`captures/${name}`) ? `/captures/${name}` : null
  }
  const out = {} as ScreenSources
  for (const slot of Object.keys(SCREEN_CAPTURE) as ScreenSlot[]) {
    const id = SCREEN_CAPTURE[slot]
    // The owner's footage, when it exists, plays instead (textures.ts getScreenTexture).
    const video = `media/hero-screen-${slot}.mp4`
    out[slot] = { light: file(id, 'light'), dark: file(id, 'dark'), video: pub(video) ? `/${video}` : null }
  }
  return out
}

/** The scene's first frame, per theme and shape, written by scripts/make-hero-poster.ts. */
function Poster({ theme }: { theme: 'dark' | 'light' }) {
  const base = `hero/poster-${theme}`
  if (!pub(`${base}-wide.avif`)) return null
  const has = (shape: string, ext: string) => pub(`${base}-${shape}.${ext}`)
  // Dark is the site's default theme, so its poster is fetched first, at high
  // priority, announced in the <head> for each shape; Light's loads only when
  // Light is showing. (Writing the phone poster into the page as data was
  // measured and rejected: no faster in Lighthouse, and the page grew 27 KB
  // because the server payload repeats it.)
  const eager = theme === 'dark'
  if (eager) {
    if (has('tall', 'avif')) preload(`/${base}-tall.avif`, { as: 'image', type: 'image/avif', media: '(max-aspect-ratio: 4/5)', fetchPriority: 'high' })
    preload(`/${base}-wide.avif`, { as: 'image', type: 'image/avif', media: has('tall', 'avif') ? '(min-aspect-ratio: 4/5)' : undefined, fetchPriority: 'high' })
  }
  return (
    <picture className={`hero-poster theme-${theme}`}>
      {has('tall', 'avif') && <source media="(max-aspect-ratio: 4/5)" srcSet={`/${base}-tall.avif`} type="image/avif" />}
      {has('tall', 'webp') && <source media="(max-aspect-ratio: 4/5)" srcSet={`/${base}-tall.webp`} type="image/webp" />}
      <source srcSet={`/${base}-wide.avif`} type="image/avif" />
      {/* A plain <img>: the poster is art-directed by theme and shape, and its files are pre-encoded. */}
      <img
        src={`/${base}-wide${has('wide', 'webp') ? '.webp' : '.avif'}`}
        alt=""
        width={1920}
        height={1080}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
      />
    </picture>
  )
}

/** The logo's tile for a node, small, beside its timecode (the same measurements as the scene's tiles). */
function Glyph({ id }: { id: HeroNodeId }) {
  const ink = 'hsl(var(--background))'
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="hero-glyph">
      <rect width="100" height="100" rx="30" fill="currentColor" />
      {id === 'client' ? (
        <>
          <circle cx="50" cy="38.5" r="9.3" fill={ink} />
          <rect x="32.15" y="53.2" width="35.7" height="18.4" rx="9.2" fill={ink} />
        </>
      ) : (
        <>
          <rect x="16.6" y="16.6" width="66.8" height="66.8" rx="19" fill={ink} />
          {id === 'crew' ? (
            <>
              <circle cx="50" cy="37.4" r="6.4" fill="currentColor" />
              <circle cx="35" cy="45.7" r="6.4" fill="currentColor" />
              <circle cx="65" cy="45.7" r="6.4" fill="currentColor" />
              <rect x="27.8" y="54.35" width="44.4" height="13.7" rx="6.85" fill="currentColor" />
            </>
          ) : (
            [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => (
              <rect key={`${x}${y}`} x={50 + x * 9.6 - 6.85} y={50 + y * 9.6 - 6.85} width="13.7" height="13.7" rx="3.5" fill="currentColor" />
            ))
          )}
        </>
      )}
    </svg>
  )
}

/** A line of the title card: the words in film stock, the full stop painted solid. */
function FilmLine({ text, metal }: { text: string; metal: 'silver' | 'gold' }) {
  const words = text.replace(/\.$/, '')
  return (
    // Literal class names: Tailwind keeps a components-layer class only if it can read it in the source.
    <span className={metal === 'silver' ? 'film-line film-line-silver block' : 'film-line film-line-gold block'}>
      {words}
      {text.endsWith('.') && <span className="film-stop">.</span>}
    </span>
  )
}

export function HomeHero() {
  const sources = screenSources()
  const marks = [
    { tc: hero.timecode, label: null },
    ...hero.nodes.map((n) => ({ tc: n.timecode, label: n.label })),
    { tc: hero.closing.timecode, label: null },
  ]
  return (
    <section data-hero aria-labelledby="hero-title" className={`${title.variable} hero relative -mt-16`}>
      <div data-hero-stage className="hero-stage">
        <Poster theme="dark" />
        <Poster theme="light" />
        <HeroDirector sources={sources} />
        <div aria-hidden className="hero-shade" />
        <div aria-hidden className="hero-corners" />

        {/* THE SLATE LINE — a camera's top bar, over every shot: REC at one end,
            the scene's timecode at the other, the line itself between two gold rules. */}
        <div className="hero-top container-wide">
          <div className="slate-line">
            <span className="slate-side">
              <span aria-hidden className="slate-end hidden lg:inline-flex">
                <span className="rec size-1.5 rounded-full bg-destructive" />
                {hero.rec}
              </span>
              <span aria-hidden className="slate-rule" />
            </span>
            <p className="slate-text">{hero.kicker}</p>
            <span className="slate-side">
              <span aria-hidden className="slate-rule slate-rule-end" />
              <span aria-hidden data-hero-timecode className="slate-end hidden tabular-nums lg:inline">
                {hero.timecode}
              </span>
            </span>
          </div>
        </div>

        <div className="hero-shots container-wide">
          {/* 0 — THE TITLE CARD */}
          <div data-shot="0" data-active="true" className="hero-shot hero-shot-title">
            <h1 id="hero-title" className="film-title hero-title">
              <FilmLine text={hero.headlineLine1} metal="silver" />
              <FilmLine text={hero.headlineLine2} metal="gold" />
            </h1>
            <p className="hero-lede">{hero.lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={hero.primaryButton.href} data-primary-cta className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {hero.primaryButton.label}
              </a>
              <a href={hero.secondaryButton.href} className="liquid-pill liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {hero.secondaryButton.label}
              </a>
            </div>
            {hero.note && <p className="mt-4 text-[13px] text-muted-foreground">{hero.note}</p>}
          </div>

          {/* 1–3 — THE THREE SPACES, one shot each */}
          {hero.nodes.map((n, i) => (
            <div key={n.id} data-shot={i + 1} className="hero-shot hero-shot-node">
              <p aria-hidden className="hero-tc">
                <Glyph id={n.id} />
                {n.timecode}
              </p>
              <h2 className="hero-node-title">{n.label}</h2>
              <p className="hero-node-line">{n.line}</p>
              {n.id === 'client' && (
                <p className="hero-node-sub">
                  <span className="font-display font-semibold text-foreground">{hero.portal.label}</span>
                  <span aria-hidden className="hero-node-rule" />
                  <span>{hero.portal.line}</span>
                </p>
              )}
            </div>
          ))}

          {/* 4 — THE CLOSING TITLE CARD, and every space below it */}
          <div data-shot="4" className="hero-shot hero-shot-close">
            <p aria-hidden className="hero-tc">{hero.closing.timecode}</p>
            <h2 className="film-title hero-close-title">
              <FilmLine text={hero.closing.line1} metal="silver" />
              <FilmLine text={hero.closing.line2} metal="gold" />
            </h2>
            <nav aria-label={hero.spacesLabel} className="hero-spaces">
              {hero.spaces.map((e) => (
                <a key={e.href} href={e.href} className="group hero-space">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-primary transition-colors group-hover:border-primary/50">
                    <Icon name={e.icon} className="size-[18px]" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[14.5px] font-semibold text-foreground">{e.name}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-[1.35] text-muted-foreground">{e.line}</span>
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* THE TRACK — the scene's sixteen seconds, the three spaces marked on it. */}
        <div aria-hidden className="hero-track container-wide">
          <div className="hero-rail">
            <i data-hero-fill className="hero-fill" />
            {marks.map((m, i) => (
              <span key={m.tc} data-hero-mark={i} data-reached={i === 0 ? 'true' : 'false'} data-current={i === 0 ? 'true' : 'false'} className="hero-mark" style={{ left: `${(i / (marks.length - 1)) * 100}%` }}>
                <span className="hero-mark-dot" />
                {m.label && (
                  <span className="hero-mark-label">
                    <span className="hero-mark-name">{m.label}</span>
                    <span className="hero-mark-tc">{m.tc}</span>
                  </span>
                )}
              </span>
            ))}
          </div>
          <span className="hero-cue" />
        </div>
      </div>
    </section>
  )
}
