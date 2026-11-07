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
import * as icons from 'lucide-static'
import { HeroDirector } from '@/components/hero/HeroDirector'
import { SHOT_AT } from '@/components/hero/state'
import { SCROLL_VH } from '@/components/hero/scene/numbers'
import type { HeroSources } from '@/components/hero/scene/textures'
import { hero, HERO_CAPTURES, HERO_ICONS, type HeroItem } from '@/content/home'
import { FILM_CREDIT } from '@/content/hero-films'
import { landingScript } from '@/components/hero/landing'
import { PLAY_GAP } from '@/components/hero/frame'
import { Icon } from '@/components/Icon'
import { Feature, FeatureLabel } from '@/components/FeatureLabel'
import { siteLabel } from '@/content/features'

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
  const dims: Record<string, { file?: string; w?: number; h?: number }> = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
  const file = (id: string, theme: 'light' | 'dark') => {
    const name = dims[`${id}.${theme}`]?.file
    return name && pub(`captures/${name}`) ? `/captures/${name}` : null
  }
  const screens: HeroSources['screens'] = {}
  for (const id of HERO_CAPTURES) {
    // The owner's footage, when it exists, plays instead (textures.ts getScreenTexture).
    const video = `media/hero-${id}.mp4`
    const size = dims[`${id}.dark`] ?? dims[`${id}.light`] ?? {}
    screens[id] = { light: file(id, 'light'), dark: file(id, 'dark'), video: pub(video) ? `/${video}` : null, width: size.w ?? 2248, height: size.h ?? 1616 }
  }
  const drawn: HeroSources['icons'] = {}
  for (const name of HERO_ICONS) drawn[name] = icons[name] as unknown as string
  return { screens, icons: drawn }
}

/**
 * Where the logo's line sits in each title poster (fractions of the image), written by
 * scripts/make-hero-poster.ts. The page scales and places the title poster so its logo lands where
 * the camera will put it at this screen's size — so the first paint, the play control under the logo
 * and the live scene all agree.
 */
export type PosterFrames = Partial<Record<'wide' | 'tall', { left: number; right: number; top: number; bottom: number; width: number; height: number; overscan?: number }>>
function posterFrames(): PosterFrames {
  const f = join(process.cwd(), 'public', 'hero', 'posters.json')
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {}
}

/** The shots the stills are made of (scripts/make-hero-poster.ts renders each). */
const POSTERS = ['title', 'crew', 'client', 'stakeholders', 'suite', 'close'] as const

/** One shot's poster, per frame shape. The title's is the first paint; the rest load only if the stills play. */
function Poster({ shot }: { shot: (typeof POSTERS)[number] }) {
  const base = `hero/poster-dark-${shot}`
  if (!pub(`${base}-wide.avif`)) return null
  const has = (shape: string, ext: string) => pub(`${base}-${shape}.${ext}`)
  // The title's poster fades up once it is placed (HeroDirector): the words are the first paint, so the
  // poster loads alongside them rather than ahead of them.
  const first = shot === 'title'
  return (
    <picture className="hero-poster" data-poster={shot} data-on={first ? 'true' : 'false'} data-want={first ? 'true' : 'false'}>
      {has('tall', 'avif') && <source media="(max-aspect-ratio: 4/5)" srcSet={`/${base}-tall.avif`} type="image/avif" />}
      {has('tall', 'webp') && <source media="(max-aspect-ratio: 4/5)" srcSet={`/${base}-tall.webp`} type="image/webp" />}
      <source srcSet={`/${base}-wide.avif`} type="image/avif" />
      {/* A plain <img>: the poster is art-directed by theme and shape, and its files are pre-encoded. */}
      <img
        src={`/${base}-wide${has('wide', 'webp') ? '.webp' : '.avif'}`}
        alt=""
        width={1920}
        height={1080}
        // the title's poster lands with its words, in one frame: decoded with the paint, never after it
        decoding={first ? 'sync' : 'async'}
        loading={first ? 'eager' : 'lazy'}
        fetchPriority={first ? 'high' : 'auto'}
        // the landing script (landing.ts) sizes and places the title's poster before React arrives
        suppressHydrationWarning={first}
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

/** A space's words in the tour: its name, what it is, and four things it does (each a feature of the register, labelled if not yet live). */
function NodeWords({ label, line, items }: { label: string; line: string; items: readonly HeroItem[] }) {
  return (
    <>
      <h2 className="hero-node-title">{label}</h2>
      <p className="hero-node-line">{line}</p>
      <ul className="hero-node-items">
        {items.map((it) => (
          <Feature key={it.id} id={it.id} as="li" className="hero-node-item">
            <Icon name={it.icon} className="hero-node-icon" />
            <span>
              <ItemText text={it.text} />
              {siteLabel(it.id) === 'Coming' && <FeatureLabel id={it.id} className="ml-2 align-middle" />}
            </span>
          </Feature>
        ))}
      </ul>
    </>
  )
}

/** An item's words: its name, and what it does (after " — ") quieter — the part a phone leaves out. */
function ItemText({ text }: { text: string }) {
  const at = text.indexOf(' — ')
  if (at < 0) return <>{text}</>
  return (
    <>
      <span className="hero-item-name">{text.slice(0, at)}</span>
      <span className="hero-item-more"> — {text.slice(at + 3)}</span>
    </>
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
  const frames = posterFrames()
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
      {/* without scripts the title's poster cannot be placed: show it as it is */}
      <noscript><style>{`.hero-poster[data-poster='title'] img { opacity: 1 !important; }`}</style></noscript>
      {/* (the landing script marks the stage landed, and places the play control, before React arrives) */}
      <div data-hero-stage className="hero-stage" suppressHydrationWarning>
        {POSTERS.map((shot) => (
          <Poster key={shot} shot={shot} />
        ))}
        <HeroDirector sources={sources} posterFrames={frames} />
        {/* the shade: fixed gradients behind the words, faded (never repainted) as the words come and go */}
        <div aria-hidden className="hero-shade">
          <i data-scrim="title" className="hero-scrim hero-scrim-title" />
          <i data-scrim="caption" className="hero-scrim hero-scrim-caption" />
        </div>

        {/* THE SLATE LINE — a camera's top bar, over every shot: REC at one end,
            the scene's timecode at the other, the line itself between two gold rules. */}
        <div className="hero-top hero-inset">
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

        <div className="hero-shots hero-inset">
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

          {/* 1–3 — THE THREE SPACES: each says what it is and four things it does */}
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
                <div className="hero-faces">
                  <div className="hero-face" data-face="client"><NodeWords label={n.label} line={n.line} items={n.items} /></div>
                  <div className="hero-face" data-face="stakeholders"><NodeWords label={hero.stakeholders.label} line={hero.stakeholders.line} items={hero.stakeholders.items} /></div>
                </div>
              </div>
            ) : (
              <div key={n.id} data-shot={i + 1} className="hero-shot hero-shot-node">
                <p aria-hidden className="hero-tc">
                  <Glyph id={n.id} />
                  {n.timecode}
                </p>
                <NodeWords label={n.label} line={n.line} items={n.items} />
              </div>
            ),
          )}

          {/* 4 — THE CLOSE: the tagline, and the way in */}
          <div data-shot="4" className="hero-shot hero-shot-close">
            <p aria-hidden className="hero-tc">{hero.closing.timecode}</p>
            <h2 className="film-title hero-close-title">
              <FilmLine text={hero.closing.line1} metal="silver" />
              <FilmLine text={hero.closing.line2} metal="gold" />
            </h2>
            <div className="hero-ctas">
              <a href={hero.primaryButton.href} className="liquid-pill-gold liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {hero.primaryButton.label}
              </a>
              <a href={hero.secondaryButton.href} className="liquid-pill liquid-pill-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {hero.secondaryButton.label}
              </a>
            </div>
            {/* the tour's films are placeholders: the credit their licences ask for (content/hero-films.ts) */}
            <p className="hero-film-credit">{FILM_CREDIT}</p>
          </div>
        </div>

        {/* THE TOUR'S PLAY CONTROL — just under the 3D logo, placed by HeroDirector with the camera's own
            framing (frame.ts). The hero is one screen; the journey is the tour the visitor chooses. */}
        <div data-hero-play-wrap className="hero-play-wrap" suppressHydrationWarning>
          <button type="button" data-hero-play aria-expanded="false" aria-controls="hero-tour" className="hero-play">
            <span aria-hidden className="hero-play-ring">
              <span className="hero-play-iris" />
              <span className="hero-play-wait" />
              <svg viewBox="0 0 24 24" className="hero-play-glyph"><path d="M8 5.6v12.8a.8.8 0 0 0 1.2.7l10.1-6.4a.8.8 0 0 0 0-1.4L9.2 4.9a.8.8 0 0 0-1.2.7Z" fill="currentColor" /></svg>
            </span>
            <span className="hero-play-label">{hero.tour.play}</span>
          </button>
          {/* On the tour, in its place: the cue to scroll — a light running down a line. A button too, for
              the keyboard: it starts the journey. It fades as the visitor scrolls. */}
          <div data-hero-begin-fade className="hero-begin-fade">
            <button type="button" data-hero-begin className="hero-begin">
              <span aria-hidden className="hero-begin-line">
                <span className="hero-begin-light" />
              </span>
              <span className="hero-begin-label">{hero.tour.cue}</span>
            </button>
          </div>
        </div>

        {/* LEAVING THE TOUR — top right of the stage, only on the tour (Escape does the same). */}
        <button type="button" data-hero-exit className="hero-exit">
          {hero.tour.exit}
          <svg aria-hidden viewBox="0 0 24 24" className="size-3.5"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>

        {/* THE TRACK — the tour's sixteen seconds, the three spaces marked where the camera holds on them.
            Only on the tour; each space's mark takes the visitor there. */}
        <nav id="hero-tour" aria-label={hero.tour.play} className="hero-track hero-inset">
          <div className="hero-rail">
            <i aria-hidden data-hero-fill className="hero-fill" />
            {marks.map((m, i) => {
              const props = {
                'data-hero-mark': i,
                'data-reached': i === 0 ? 'true' : 'false',
                'data-current': i === 0 ? 'true' : 'false',
                className: 'hero-mark',
                style: { left: `${(SHOT_AT[i] * 100).toFixed(2)}%`, ['--i' as string]: i },
              }
              const dot = <span aria-hidden className="hero-mark-dot" />
              return m.label ? (
                <button key={m.tc} type="button" {...props} data-hero-go={i} aria-label={m.label}>
                  {dot}
                  <span className="hero-mark-label">
                    <span className="hero-mark-name">{m.label}</span>
                    <span aria-hidden className="hero-mark-tc">{m.tc}</span>
                  </span>
                </button>
              ) : (
                <span key={m.tc} aria-hidden {...props}>{dot}</span>
              )
            })}
          </div>
          <span aria-hidden className="hero-cue" />
        </nav>
      </div>
      {/* LANDING (landing.ts): the title's poster placed and the stage landed — words and picture together —
          before any of the page's script has run */}
      <script dangerouslySetInnerHTML={{ __html: landingScript(frames, PLAY_GAP) }} />
    </section>
  )
}
