/**
 * THE HOME HERO (batch W-3D-1) — the Genreline logo's line through space.
 * A tall section with a sticky, full-bleed 3D stage: the title card over the
 * whole line; then, as the visitor scrolls, the camera dives to the Crew
 * space, rides the line to the Client space (turning to the Stakeholders
 * space every three seconds), drops through the valley and climbs to the
 * Suite, and pulls back to the whole line for the close: "Run the
 * production. Keep the record."
 *
 * Built in this order, so the page stays fast:
 *  1. First paint is HTML: the slate line, the title card, its one line and
 *     the two calls to action, over a poster of the scene's first frame
 *     (AVIF, the Largest Contentful Paint).
 *  2. After first paint HeroDirector maps the scroll (GSAP ScrollTrigger) and,
 *     on a capable device, loads the 3D canvas over the poster; elsewhere it
 *     plays the hero as stills — a poster of every shot.
 * The canvas is decoration: every word is here, in the HTML, and every word
 * comes from content/home.ts.
 */
import 'server-only'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import localFont from 'next/font/local'
import { preload } from 'react-dom'
import * as icons from 'lucide-static'
import { HeroDirector } from '@/components/hero/HeroDirector'
import { SHOT_AT } from '@/components/hero/state'
import { SCROLL_VH } from '@/components/hero/scene/numbers'
import type { HeroSources } from '@/components/hero/scene/textures'
import { hero, HERO_CAPTURES, HERO_ICONS } from '@/content/home'

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

/** What the 3D needs from the server: every screen's capture in each theme (and footage, if the owner has added it), and its icons' drawings. */
function heroSources(): HeroSources {
  const f = join(process.cwd(), 'public', 'captures', 'dimensions.json')
  const dims: Record<string, { file?: string }> = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
  const file = (id: string, theme: 'light' | 'dark') => {
    const name = dims[`${id}.${theme}`]?.file
    return name && pub(`captures/${name}`) ? `/captures/${name}` : null
  }
  const screens: HeroSources['screens'] = {}
  for (const id of HERO_CAPTURES) {
    // The owner's footage, when it exists, plays instead (textures.ts getScreenTexture).
    const video = `media/hero-${id}.mp4`
    screens[id] = { light: file(id, 'light'), dark: file(id, 'dark'), video: pub(video) ? `/${video}` : null }
  }
  const drawn: HeroSources['icons'] = {}
  for (const name of HERO_ICONS) drawn[name] = icons[name] as unknown as string
  return { screens, icons: drawn }
}

/** The shots the stills are made of (scripts/make-hero-poster.ts renders each). */
const POSTERS = ['title', 'crew', 'client', 'stakeholders', 'suite', 'close'] as const

/** One shot's poster, per theme and frame shape. The title's is the first paint; the rest load only if the stills play. */
function Poster({ theme, shot }: { theme: 'dark' | 'light'; shot: (typeof POSTERS)[number] }) {
  const base = `hero/poster-${theme}-${shot}`
  if (!pub(`${base}-wide.avif`)) return null
  const has = (shape: string, ext: string) => pub(`${base}-${shape}.${ext}`)
  // Dark is the site's default theme, so its title poster is fetched first, at
  // high priority, announced in the <head> for each shape.
  const first = shot === 'title'
  const eager = first && theme === 'dark'
  if (eager) {
    if (has('tall', 'avif')) preload(`/${base}-tall.avif`, { as: 'image', type: 'image/avif', media: '(max-aspect-ratio: 4/5)', fetchPriority: 'high' })
    preload(`/${base}-wide.avif`, { as: 'image', type: 'image/avif', media: has('tall', 'avif') ? '(min-aspect-ratio: 4/5)' : undefined, fetchPriority: 'high' })
  }
  return (
    <picture className={`hero-poster theme-${theme}`} data-poster={shot} data-on={first ? 'true' : 'false'} data-want={first ? 'true' : 'false'}>
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

/** A space's tile, small, beside its timecode (the same measurements as the scene's tiles). */
function Glyph({ id }: { id: 'crew' | 'client' | 'suite' | 'stakeholders' }) {
  const ink = 'hsl(var(--background))'
  const figure = (cx: number, k: number) => (
    <>
      <circle cx={cx} cy={50 - 11.5 * k} r={9.3 * k} fill={ink} />
      <rect x={cx - 17.85 * k} y={50 + 12.4 * k - 9.2 * k} width={35.7 * k} height={18.4 * k} rx={9.2 * k} fill={ink} />
    </>
  )
  return (
    <svg viewBox="0 0 100 100" aria-hidden className="hero-glyph">
      <rect width="100" height="100" rx="30" fill="currentColor" />
      {id === 'client' ? (
        figure(50, 1)
      ) : id === 'stakeholders' ? (
        <>
          {figure(42.5, 0.9)}
          <circle cx="67.5" cy="65" r="12.5" fill={ink} />
          <path d="M62 65.2 L66.3 69.5 L73.5 60.8" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
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

/** A line of a title card: the words in film stock, the full stop painted solid. */
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
  const sources = heroSources()
  const marks = [
    { tc: hero.timecode, label: null },
    ...hero.nodes.map((n) => ({ tc: n.timecode, label: n.label })),
    { tc: hero.closing.timecode, label: null },
  ]
  return (
    <section
      data-hero
      aria-labelledby="hero-title"
      className={`${title.variable} hero relative -mt-16`}
      style={{ ['--hero-scroll' as string]: `${SCROLL_VH}vh` }}
    >
      <div data-hero-stage className="hero-stage">
        {POSTERS.map((shot) => (
          <Poster key={`dark-${shot}`} theme="dark" shot={shot} />
        ))}
        {POSTERS.map((shot) => (
          <Poster key={`light-${shot}`} theme="light" shot={shot} />
        ))}
        <HeroDirector sources={sources} />
        <div aria-hidden className="hero-shade" />

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
            <p className="hero-sub">{hero.subtext}</p>
            <div className="hero-ctas">
              <a href={hero.primaryButton.href} data-primary-cta className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {hero.primaryButton.label}
              </a>
              <a href={hero.secondaryButton.href} className="liquid-pill liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {hero.secondaryButton.label}
              </a>
            </div>
          </div>

          {/* 1–3 — THE THREE SPACES, each with its part of the line under the title */}
          {hero.nodes.map((n, i) =>
            n.id === 'client' ? (
              <div key={n.id} data-shot={i + 1} data-faces data-showing="client" className="hero-shot hero-shot-node">
                <p aria-hidden className="hero-tc">
                  <span className="hero-faces">
                    <span className="hero-face" data-face="client"><Glyph id="client" /></span>
                    <span className="hero-face" data-face="stakeholders"><Glyph id="stakeholders" /></span>
                  </span>
                  {n.timecode}
                </p>
                <h2 className="hero-node-title hero-faces">
                  <span className="hero-face" data-face="client">{n.label}</span>
                  <span className="hero-face" data-face="stakeholders">{hero.stakeholders.label}</span>
                </h2>
                <p className="hero-node-line hero-faces">
                  <span className="hero-face" data-face="client">{n.line}</span>
                  <span className="hero-face" data-face="stakeholders">{hero.stakeholders.line}</span>
                </p>
              </div>
            ) : (
              <div key={n.id} data-shot={i + 1} className="hero-shot hero-shot-node">
                <p aria-hidden className="hero-tc">
                  <Glyph id={n.id} />
                  {n.timecode}
                </p>
                <h2 className="hero-node-title">{n.label}</h2>
                <p className="hero-node-line">{n.line}</p>
              </div>
            ),
          )}

          {/* 4 — THE CLOSE: the tagline, alone */}
          <div data-shot="4" className="hero-shot hero-shot-close">
            <p aria-hidden className="hero-tc">{hero.closing.timecode}</p>
            <h2 className="film-title hero-close-title">
              <FilmLine text={hero.closing.line1} metal="silver" />
              <FilmLine text={hero.closing.line2} metal="gold" />
            </h2>
          </div>
        </div>

        {/* THE TRACK — the scene's sixteen seconds, the three spaces marked where the camera holds on them. */}
        <div aria-hidden className="hero-track container-wide">
          <div className="hero-rail">
            <i data-hero-fill className="hero-fill" />
            {marks.map((m, i) => (
              <span key={m.tc} data-hero-mark={i} data-reached={i === 0 ? 'true' : 'false'} data-current={i === 0 ? 'true' : 'false'} className="hero-mark" style={{ left: `${(SHOT_AT[i] * 100).toFixed(2)}%` }}>
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
