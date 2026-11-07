'use client'
/**
 * THE DIRECTOR — the hero's one client island.
 *
 *  · Scroll: GSAP ScrollTrigger maps the hero's scroll to a progress of 0–1
 *    (heroState.target). The camera and the words follow `current`: the
 *    target damped, or — when the system asks for reduced motion — cut to
 *    the nearest shot.
 *  · Words: each shot's words fade in as the camera arrives and out as it
 *    leaves (state.ts shotWeight). The slate line's timecode and the track
 *    run with the scroll.
 *  · The Client station turns to its Stakeholders face every three seconds
 *    while it is on screen (the owner, 2026-11-03), and back — its words and
 *    the 3D together. The pointer resting on one of its screens holds it.
 *  · The scene: once the page has painted — at once where a mouse is on the
 *    page, else at the visitor's first move or after a few quiet seconds; the
 *    title's poster is its first frame, so it never lands late. Every device
 *    that draws WebGL 2 on real graphics hardware gets the live scene — a
 *    laptop's integrated graphics, a gaming PC, a tablet, a phone, on any
 *    system and in any browser — at a starting quality fitted to it (the GPU's
 *    benchmark where detect-gpu knows it; the middle quality where it cannot
 *    tell, as in Firefox). In the scene a governor then watches the real frame
 *    rate and steps the quality and the resolution down until it runs
 *    smoothly (HeroCanvas). Only a device without WebGL 2, drawing in
 *    software, asking to save data, or too slow even at the lowest quality,
 *    plays the hero as stills — a poster of each shot, rendered by the scene,
 *    cross-fading as the visitor scrolls.
 *    `?hero=live` or `?hero=poster` overrides the choice, `?quality=0|1|2`
 *    sets the starting quality, and `?shot=crew` (title, crew, client,
 *    stakeholders, suite, close) holds one shot, for checking a device and
 *    rendering the posters.
 *
 * Nothing here re-renders on scroll: the frame loop writes styles directly.
 */
import * as React from 'react'
import dynamic from 'next/dynamic'
import { cut, heroState, nearestShot, SHOT_AT, shotWeight, storyAt, timecode } from '@/components/hero/state'
import { FACE, FOV, SCROLL, type Quality, type Shot } from '@/components/hero/scene/numbers'
import { logoOnStage, PLAY_GAP, tourLayout } from '@/components/hero/frame'
import type { HeroSources } from '@/components/hero/scene/textures'
import type { PosterFrames } from '@/components/hero/HomeHero'
import { useReducedMotion } from '@/lib/motion'

const HeroCanvas = dynamic(() => import('@/components/hero/scene/HeroCanvas'), { ssr: false, loading: () => null })

type Tier = 'pending' | 'live' | 'poster'

/** If the canvas fails in any way, the posters play instead. */
class Fallback extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

/** After the page has loaded and gone quiet — the scene never competes with first paint. */
function afterFirstPaint(fn: () => void) {
  let idle = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = () => {
    const ric = window.requestIdleCallback as ((cb: () => void, o?: { timeout: number }) => number) | undefined
    if (ric) idle = ric(fn, { timeout: 1500 })
    else timer = setTimeout(fn, 200)
  }
  if (document.readyState === 'complete') run()
  else window.addEventListener('load', run, { once: true })
  return () => {
    window.removeEventListener('load', run)
    if (idle) window.cancelIdleCallback?.(idle)
    if (timer) clearTimeout(timer)
  }
}

/** The visitor's first move, scroll, touch or key (once). */
function whenEngaged(fn: () => void) {
  const events = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'] as const
  let done = false
  const stop = () => {
    for (const e of events) window.removeEventListener(e, go)
  }
  const go = () => {
    if (done) return
    done = true
    stop()
    fn()
  }
  for (const e of events) window.addEventListener(e, go, { passive: true, once: true })
  return stop
}
/** Where nobody has moved: how long after the page settles the scene takes over anyway (ms). */
const QUIET_START = 3000

const params = () => new URLSearchParams(window.location.search)

/** A CSS cubic-bezier as a function of time (0–1), solved exactly, for motion driven from script. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      const d = dx(t)
      if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break
      t -= e / d
    }
    // Newton's step can wander on steep curves: settle it by halving
    if (t < 0 || t > 1 || Math.abs(sx(t) - x) > 1e-4) {
      let lo = 0
      let hi = 1
      t = x
      for (let i = 0; i < 30; i++) {
        if (sx(t) < x) lo = t
        else hi = t
        t = (lo + hi) / 2
      }
    }
    return sy(t)
  }
}
/** The house's on-screen curve (tokens.css --ease-in-out), for the tour's glide. */
const EASE_IN_OUT = bezier(0.77, 0, 0.175, 1)
/** The house's entering curve (tokens.css --ease-out): for the play control's iris, and for the dive. */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'
const EASE_OUT_FN = bezier(0.23, 1, 0.32, 1)

type Choice = { tier: 'live'; quality: Quality; hz: number } | { tier: 'poster' }

/**
 * The display's own frame rate, measured before the scene starts (so nothing
 * else is drawing): 60 on most screens, 120–144 on fast ones, 30 under a
 * battery saver. The governor judges smoothness against it — a steady 30 fps
 * is the most a capped display can show, but on a 60 Hz screen it is a GPU
 * that cannot keep up.
 */
function displayHz(): Promise<number> {
  return new Promise((resolve) => {
    const gaps: number[] = []
    let last = 0
    const step = (now: number) => {
      if (last) gaps.push(now - last)
      last = now
      if (gaps.length < 24) requestAnimationFrame(step)
      else {
        gaps.sort((a, b) => a - b)
        const beat = gaps[Math.floor(gaps.length / 2)]
        resolve(Math.min(240, Math.max(24, Math.round(1000 / beat))))
      }
    }
    requestAnimationFrame(step)
    // a hidden tab does not draw at all: assume the common screen
    setTimeout(() => resolve(60), 1500)
  })
}

/** Integrated graphics, by the names browsers report. */
const INTEGRATED = /intel|iris|uhd graphics|hd graphics|radeon\(tm\) graphics|radeon graphics|radeon vega|vega \d|adreno|mali|powervr|xclipse|immortalis/i

/** A renderer that draws in software (no graphics hardware): far too slow for the scene. */
const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen|virtualbox|vmware svga/i

/**
 * Whether this device runs the live scene, and at what starting quality.
 * The governor in the scene corrects the start either way, so this errs
 * toward running: an unknown GPU starts in the middle, not on the stills.
 */
async function choose(): Promise<Choice> {
  const q = params()
  const asked = q.get('hero')
  const askedQuality = q.get('quality')
  const forced: Quality | null = askedQuality === '0' || askedQuality === '1' || askedQuality === '2' ? (Number(askedQuality) as Quality) : null
  if (asked === 'poster') return { tier: 'poster' }
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (asked !== 'live' && connection?.saveData) return { tier: 'poster' }

  // WebGL 2, on graphics hardware
  let gl: WebGL2RenderingContext | null = null
  try {
    gl = document.createElement('canvas').getContext('webgl2', { powerPreference: 'high-performance' })
  } catch {}
  if (!gl) return asked === 'live' ? { tier: 'live', quality: forced ?? 0, hz: 60 } : { tier: 'poster' }
  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const renderer = String((info && gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '')
  if (asked !== 'live' && SOFTWARE.test(renderer)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { tier: 'poster' }
  }

  let quality: Quality = 1
  try {
    const { getGPUTier } = await import('detect-gpu')
    // The benchmark data is served from this site (public/detect-gpu), never fetched from a third party.
    const gpu = await getGPUTier({ benchmarksURL: '/detect-gpu', glContext: gl })
    if (asked !== 'live' && (gpu.type === 'BLOCKLISTED' || gpu.type === 'WEBGL_UNSUPPORTED')) return { tier: 'poster' }
    if (gpu.type === 'BENCHMARK') quality = gpu.tier >= 3 ? 2 : gpu.tier === 2 ? 1 : 0
    // Integrated graphics (Intel, AMD's laptop chips, phones' GPUs) share the computer's memory, and
    // benchmarks flatter them on big screens: they start in the middle, without multisampling, and
    // the governor lets them climb if they can. Apple's GPUs are integrated too but strong.
    if (INTEGRATED.test(renderer) && !/apple/i.test(renderer)) quality = Math.min(quality, 1) as Quality
    // FALLBACK (a GPU it cannot name — Firefox hides it, for one): the middle, and the governor decides
  } catch {
    // the benchmarks could not be read: start in the middle all the same
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
  return { tier: 'live', quality: forced ?? quality, hz: await displayHz() }
}

/** `?shot=` — hold one shot (for checking by hand, and for rendering the posters). */
const HELD: Record<string, { shot: Shot; face: 0 | 1 }> = {
  title: { shot: 0, face: 0 }, crew: { shot: 1, face: 0 }, client: { shot: 2, face: 0 },
  stakeholders: { shot: 2, face: 1 }, suite: { shot: 3, face: 0 }, close: { shot: 4, face: 0 },
}

export function HeroDirector({ sources, posterFrames }: { sources: HeroSources; posterFrames: PosterFrames }) {
  const layer = React.useRef<HTMLDivElement>(null)
  const reducedPref = useReducedMotion()
  const reduced = reducedPref ?? false
  const [tier, setTier] = React.useState<Tier>('pending')
  const [quality, setQuality] = React.useState<Quality>(1)
  const [hz, setHz] = React.useState(60)
  const [ready, setReady] = React.useState(false)
  const [visible, setVisible] = React.useState(true)
  const [stage, setStage] = React.useState<HTMLElement | null>(null)
  // The stage is the scene's event source, so the 3D answers the pointer through the words laid over it.
  const attach = React.useCallback((el: HTMLDivElement | null) => {
    layer.current = el
    setStage(el?.closest<HTMLElement>('[data-hero-stage]') ?? null)
  }, [])
  const kickRef = React.useRef<() => void>(() => {})
  // fixed for the page's life (written at build time), read by the measure in the effect below
  const framesRef = React.useRef(posterFrames)
  const tierRef = React.useRef<Tier>('pending')

  React.useEffect(() => {
    if (reducedPref === null) return
    heroState.reduced = reducedPref
    kickRef.current()
    heroState.invalidate()
  }, [reducedPref])

  // The scroll, the words, the timecode, the Client's turning face.
  React.useEffect(() => {
    const el = layer.current
    const section = el?.closest<HTMLElement>('[data-hero]')
    if (!section) return
    const shots = Array.from(section.querySelectorAll<HTMLElement>('[data-shot]'))
    const clocks = Array.from(section.querySelectorAll<HTMLElement>('[data-hero-timecode]'))
    const marks = Array.from(section.querySelectorAll<HTMLElement>('[data-hero-mark]'))
    const posters = Array.from(section.querySelectorAll<HTMLElement>('[data-poster]'))
    const faceCard = section.querySelector<HTMLElement>('[data-faces]')
    const fill = section.querySelector<HTMLElement>('[data-hero-fill]')
    const cue = section.querySelector<HTMLElement>('.hero-cue')
    const beginFade = section.querySelector<HTMLElement>('[data-hero-begin-fade]')
    const beginBtn = section.querySelector<HTMLButtonElement>('[data-hero-begin]')
    const scrimTitle = section.querySelector<HTMLElement>('[data-scrim="title"]')
    const scrimCaption = section.querySelector<HTMLElement>('[data-scrim="caption"]')
    const s = heroState
    const held = HELD[params().get('shot') ?? '']

    let shown = -1
    let painted = -1
    // Only opacity and transform are written each frame — the compositor moves them without
    // repainting anything, so the words cost the GPU nothing while the 3D runs.
    const set = (el: HTMLElement | null, key: 'opacity' | 'transform', value: string) => {
      if (el && el.style[key] !== value) el.style[key] = value
    }
    const paint = () => {
      const p = s.current
      if (p === painted) return
      painted = p
      const place = storyAt(p)
      let caption = 0
      // on the tour the title waits off stage (once its words have stepped aside as the tour starts)
      const titleAway = s.tour && section.dataset.launching !== 'true'
      shots.forEach((card) => {
        const i = Number(card.dataset.shot) as Shot
        const w = i === 0 && titleAway ? 0 : shotWeight(place, i)
        const leaving = place.seg.kind === 'travel' && place.seg.from === i
        const y = (1 - w) * (leaving ? -14 : 14)
        set(card, 'opacity', w.toFixed(3))
        set(card, 'transform', w < 1 && !s.reduced ? `translate3d(0, ${y.toFixed(1)}px, 0)` : '')
        const active = w > 0.5 ? 'true' : 'false'
        if (card.dataset.active !== active) card.dataset.active = active
        if (i !== 0) caption = Math.max(caption, w)
        // (the shade behind the title goes with its words the moment the tour is taken — not after: the logo
        // moves into that space as the camera readies, and must not pass under it)
        else set(scrimTitle, 'opacity', s.tour ? '0' : w.toFixed(3))
      })
      set(scrimCaption, 'opacity', caption.toFixed(3))
      const nearest = nearestShot(p)
      if (nearest !== shown) {
        shown = nearest
        marks.forEach((m) => {
          const i = Number(m.dataset.heroMark)
          m.dataset.reached = i <= nearest ? 'true' : 'false'
          m.dataset.current = i === nearest ? 'true' : 'false'
        })
      }
      // the stills, when the scene is not running: the nearest shot's poster
      if (tierRef.current === 'poster') showPoster(nearest)
      const tc = timecode(p)
      for (const c of clocks) if (c.textContent !== tc) c.textContent = tc
      set(fill, 'transform', `scaleX(${p.toFixed(4)})`)
      set(cue, 'opacity', Math.max(0, 1 - p * 30).toFixed(3))
      // the cue to scroll fades as the visitor starts the journey (gone well before the title's hold ends)
      const begin = Math.max(0, 1 - p * 70)
      set(beginFade, 'opacity', begin.toFixed(3))
      const gone = begin < 0.04 ? 'true' : 'false'
      if (beginFade && beginFade.dataset.gone !== gone) {
        beginFade.dataset.gone = gone
        // the keyboard was on the cue: it moves on to the way out of the tour
        if (gone === 'true' && document.activeElement === beginBtn) section.querySelector<HTMLElement>('[data-hero-exit]')?.focus({ preventScroll: true })
      }
      // the Client's face: back to Client whenever the station is off screen
      const clientOn = shotWeight(place, 2) > 0.5
      if (!clientOn && s.face !== 0 && !held) setFace(0, false)
    }

    const POSTER_OF: Record<Shot, string> = { 0: 'title', 1: 'crew', 2: 'client', 3: 'suite', 4: 'close' }
    let posterShown = ''
    function showPoster(shot: Shot) {
      const name = shot === 2 && s.face === 1 ? 'stakeholders' : POSTER_OF[shot]
      if (name === posterShown) return
      posterShown = name
      for (const el of posters) {
        const mine = el.dataset.poster === name
        if (mine) el.dataset.want = 'true'
        el.dataset.on = mine ? 'true' : 'false'
      }
    }

    function setFace(face: 0 | 1, animate = true) {
      s.face = face
      s.faceAt = animate ? performance.now() : -1e9
      if (faceCard) faceCard.dataset.showing = face ? 'stakeholders' : 'client'
      if (tierRef.current === 'poster') {
        posterShown = ''
        showPoster(nearestShot(s.current))
      }
      s.invalidate()
    }

    let raf = 0
    let last = 0
    let prev = s.current
    // The camera follows the scroll on a critically damped spring (the owner, 2026-11-07: the 3D must not
    // feel "wobbly"): its speed never jumps, so the notches of a wheel or the flicks of a trackpad blend
    // into one glide, where a plain chase lurched at every notch and crawled between them. It settles as
    // fast as the chase did, never overshoots, and stops dead when it arrives.
    let vel = 0
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
      last = now
      if (!s.reduced) {
        const w = 2 / SCROLL.smooth
        const x = w * dt
        const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
        const gap = s.current - s.target
        const pull = (vel + w * gap) * dt
        vel = (vel - w * pull) * decay
        s.current = s.target + (gap + pull) * decay
        if (Math.abs(s.target - s.current) < 0.00003 && Math.abs(vel) < 0.0005) {
          s.current = s.target
          vel = 0
        }
      } else {
        s.current = cut(s.target)
        vel = 0
      }
      s.speed = (s.current - prev) / dt
      prev = s.current
      paint()
      s.invalidate()
      if (s.current !== s.target && !s.reduced) raf = requestAnimationFrame(tick)
      else {
        last = 0
        s.speed = 0
      }
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    kickRef.current = () => {
      painted = -1
      posterShown = ''
      kick()
    }

    const scrollToShot = (shot: number, behavior: ScrollBehavior) => {
      const top = section.getBoundingClientRect().top + window.scrollY
      const range = section.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + range * SHOT_AT[shot], behavior })
    }

    // Keyboard: focusing something in a shot that is not on screen brings that shot up.
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-shot]')
      if (!card) return
      const i = Number(card.dataset.shot)
      if (nearestShot(s.target) === i) return
      scrollToShot(i, 'instant')
    }
    section.addEventListener('focusin', onFocus)

    // Where the words sit, measured from the page itself — the camera frames every shot into the room
    // they leave (rig.ts). Measured without the cards' fade transforms, again on every resize and once
    // the fonts have settled, so any screen, shape or text size fits.
    const stageEl = section.querySelector<HTMLElement>('[data-hero-stage]')
    const shotsEl = section.querySelector<HTMLElement>('.hero-shots')
    const slateEl = section.querySelector<HTMLElement>('.hero-top')
    const trackEl = section.querySelector<HTMLElement>('.hero-track')
    const playWrap = section.querySelector<HTMLElement>('[data-hero-play-wrap]')
    const card = (n: number) => section.querySelector<HTMLElement>(`[data-shot="${n}"]`)
    const measure = () => {
      if (!stageEl || !shotsEl) return
      const st = stageEl.getBoundingClientRect()
      if (!st.width || !st.height) return
      const sh = shotsEl.getBoundingClientRect()
      const fy = (y: number) => Math.min(1, Math.max(0, (y - st.top) / st.height))
      const fx = (x: number) => Math.min(1, Math.max(0, (x - st.left) / st.width))
      const edges = (el: HTMLElement | null) => {
        if (!el) return null
        // offsets ignore the transforms the fades put on the cards
        const left = sh.left + el.offsetLeft
        const top = sh.top + el.offsetTop
        // the widest line of the card, not the card's own box
        let right = left
        for (const child of Array.from(el.querySelectorAll<HTMLElement>('h1 > span, h2 > span, h2, p, li, .hero-ctas > a'))) {
          const r = child.getBoundingClientRect()
          if (r.width) right = Math.max(right, r.right)
        }
        return { left: fx(left), top: fy(top), right: fx(right) }
      }
      const title = edges(card(0))
      const caption = edges(card(1))
      const close = edges(card(4))
      const pad = 10 / st.height
      const playH = playWrap?.offsetHeight ?? 0
      const exitEl = section.querySelector<HTMLElement>('[data-hero-exit]')
      const under = Math.max(slateEl?.getBoundingClientRect().bottom ?? 0, s.tour && exitEl ? exitEl.getBoundingClientRect().bottom : 0)
      s.layout = {
        top: under ? fy(under) + pad : 0.15,
        slate: slateEl ? fy(slateEl.getBoundingClientRect().bottom) : 0.12,
        bottom: trackEl ? fy(trackEl.getBoundingClientRect().top) - pad * 2.4 : 0.93,
        titleRight: title?.right ?? 0.5,
        titleTop: title?.top ?? 0.6,
        edge: title?.left ?? 0.03,
        // the control, and the gap above it and below it
        play: playH ? (playH + PLAY_GAP * 2) / st.height : 0,
        captionTop: caption?.top ?? 0.74,
        captionRight: caption?.right ?? 0.42,
        // each space's own caption: they differ in length, and each shot leaves room for its own
        captions: [1, 2, 3].map((n) => {
          const e = edges(card(n))
          return { top: e?.top ?? 0.74, right: e?.right ?? 0.42 }
        }),
        closeTop: close?.top ?? 0.74,
        closeRight: close?.right ?? 0.5,
      }
      // The play control, just under the logo (the owner, 2026-11-06: "right under the 3d logo not
      // exactly on it"): the logo's middle and its lowest point, from the camera's own framing.
      if (playWrap) {
        const aspect = st.width / st.height
        // under the logo where the camera has it: on the tour, given the whole stage (its words away)
        const at = logoOnStage(aspect < FOV.tallBelowAspect, aspect, s.tour ? tourLayout(s.layout) : s.layout)
        const w = playWrap.offsetWidth
        const edgePx = s.layout.edge * st.width
        const x = Math.min(st.width - edgePx - w, Math.max(edgePx, at.centerX * st.width - w / 2))
        const y = at.bottom * st.height + PLAY_GAP
        playWrap.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        playWrap.dataset.placed = 'true'
        // the title's poster, scaled and placed so its logo is where the camera puts it (and only then shown)
        const img = section.querySelector<HTMLImageElement>('[data-poster="title"] img')
        const box = img?.parentElement?.getBoundingClientRect()
        const shape = img && /-tall\./.test(img.currentSrc || img.src) ? 'tall' : 'wide'
        const pf = framesRef.current[shape]
        if (img && box && pf && img.complete !== false) {
          const scale = ((at.right - at.left) * st.width) / ((pf.right - pf.left) * pf.width)
          const ox = at.left * st.width - pf.left * pf.width * scale - (box.left - st.left)
          const oy = at.top * st.height - pf.top * pf.height * scale - (box.top - st.top)
          // the inline landing (landing.ts) placed it first, before any script: the two must agree
          if (process.env.NODE_ENV !== 'production' && img.dataset.aligned === 'true') {
            const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(img.style.transform)
            if (m && (Math.abs(Number(m[1]) - ox) > 2 || Math.abs(Number(m[2]) - oy) > 2)) console.warn('hero: the landing placed the poster differently', m[1], m[2], ox, oy)
          }
          // (the title's projector lamp is placed by the same scaling: heroState.posterMap — not while
          // a poster is being made, `?shot=`: the poster's own frame is the one they are defined in)
          if (!s.tour && !held) heroState.posterMap = { tall: shape === 'tall', k: scale, x0: at.left * st.width - pf.left * pf.width * scale, y0: at.top * st.height - pf.top * pf.height * scale, w: st.width, h: st.height, pw: pf.width, ph: pf.height, s: pf.overscan ?? 1 }
          img.style.width = `${(pf.width * scale).toFixed(1)}px`
          img.style.height = `${(pf.height * scale).toFixed(1)}px`
          img.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`
          img.dataset.aligned = 'true'
          // the stage lands as one — picture and words together — once the picture is placed and decoded
          // (if the CSS's own deadline came first, it has already shown: leave it)
          if (!stageEl.dataset.landed) {
            stageEl.dataset.landed = 'pending'
            img
              .decode()
              .catch(() => {})
              .then(() => void (stageEl.dataset.landed = getComputedStyle(stageEl).visibility === 'visible' ? 'late' : 'true'))
          }
        }
        // the posters are rendered from the held title shot: where its logo is, for the script
        if (held) stageEl.dataset.logo = JSON.stringify({ ...at, width: st.width, height: st.height })
      }
      s.invalidate()
    }
    // The play control's hover quickens the line's light (HeroScene Line).
    const playBtn = section.querySelector<HTMLElement>('[data-hero-play]')
    const playOn = () => void (s.playHover = 1)
    const playOff = () => void (s.playHover = 0)
    playBtn?.addEventListener('pointerenter', playOn)
    playBtn?.addEventListener('pointerleave', playOff)
    playBtn?.addEventListener('focus', playOn)
    playBtn?.addEventListener('blur', playOff)

    const titleImg = section.querySelector<HTMLImageElement>('[data-poster="title"] img')
    titleImg?.addEventListener('load', measure)

    measure()
    const ro = new ResizeObserver(measure)
    if (stageEl) ro.observe(stageEl)
    document.fonts?.ready.then(measure).catch(() => {})

    // Is the hero on screen at all? Off screen, the scene stops drawing and the face stops turning.
    let onScreen = true
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
      setVisible(e.isIntersecting)
    })
    io.observe(section)

    // Client ↔ Stakeholders, every three seconds while the Client station is up.
    const turn = window.setInterval(() => {
      if (held || !onScreen || s.holdFace || document.hidden) return
      if (shotWeight(storyAt(s.current), 2) < 0.5) return
      setFace(s.face ? 0 : 1)
    }, FACE.every)

    // GSAP ScrollTrigger maps the scroll to progress, after first paint (or at once, if the visitor takes
    // the tour before then).
    let revert = () => {}
    let cancelled = false
    let refresh = () => {}
    let loading: Promise<void> | null = null
    const loadScroll = () =>
      (loading ??= (async () => {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
        if (cancelled) return
        gsap.registerPlugin(ScrollTrigger)
        const ctx = gsap.context(() => {
          // The scroll's progress through the hero — read on every scroll and on every refresh, so a
          // page restored mid-hero (a reload, the back button) starts where it is.
          const follow = (self: { progress: number }) => {
            // one screen at the title until the visitor takes the tour
            if (held || !s.tour) return
            s.target = self.progress
            kick()
          }
          ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: follow, onRefresh: follow })
        }, section)
        ScrollTrigger.refresh()
        refresh = () => ScrollTrigger.refresh()
        revert = () => ctx.revert()
      })())
    const stopWaiting = afterFirstPaint(() => void loadScroll())

    // ── THE TOUR (the owner, 2026-11-06) ─────────────────────────────────────
    // The hero is one screen. "Take the tour" grows it to the journey's length and glides the page to
    // the Crew space, so the camera dives at once; the track draws in and "Exit tour" appears. Exit (or
    // Escape) rewinds to the title and the hero is one screen again. The page's motion is CSS on
    // html[data-tour] (hero.css); the glide is the scroll itself, on the house's on-screen curve, and
    // the visitor takes it over the moment they wheel, touch or press a key.
    const root = document.documentElement
    const exitBtn = section.querySelector<HTMLButtonElement>('[data-hero-exit]')
    const iris = section.querySelector<HTMLElement>('.hero-play-iris')
    const heroTop = () => section.getBoundingClientRect().top + window.scrollY
    const shotTop = (shot: number) => heroTop() + (section.offsetHeight - window.innerHeight) * SHOT_AT[shot]
    let glideRaf = 0
    let glideDone: (() => void) | null = null
    const stopGlide = () => {
      if (glideRaf) cancelAnimationFrame(glideRaf)
      glideRaf = 0
      glideDone = null
    }
    const glide = (to: number, done?: () => void, curve = EASE_IN_OUT) => {
      stopGlide()
      const from = window.scrollY
      const distance = Math.abs(to - from)
      if (s.reduced || distance < 2) {
        window.scrollTo({ top: to, behavior: 'instant' })
        done?.()
        return
      }
      // a dive of a screen or two takes about 1.6 s; a rewind from the far end of the journey, no more than 2.6 s
      const ms = Math.min(2600, 1100 + (distance / window.innerHeight) * 260)
      const t0 = performance.now()
      glideDone = done ?? null
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / ms)
        window.scrollTo({ top: from + (to - from) * curve(k), behavior: 'instant' })
        if (k < 1) glideRaf = requestAnimationFrame(step)
        else {
          glideRaf = 0
          const d = glideDone
          glideDone = null
          d?.()
        }
      }
      glideRaf = requestAnimationFrame(step)
    }
    // The visitor takes over the glide. Interrupting the rewind keeps the tour where they are — ending it
    // there would fold the hero under them and throw the page.
    const takeOver = (e: Event) => {
      if (!glideRaf) return
      if (e.type === 'keydown' && (e as KeyboardEvent).key === 'Escape') return
      stopGlide()
      if (leaving) {
        leaving = false
        delete root.dataset.tourLeaving
        exitBtn?.focus({ preventScroll: true })
      }
    }
    const TAKE = ['wheel', 'touchstart', 'keydown'] as const
    for (const t of TAKE) window.addEventListener(t, takeOver, { passive: true })

    /** The scene is up (or the stills are playing), or four seconds have passed. */
    const settled = () =>
      new Promise<void>((resolve) => {
        const t0 = performance.now()
        const check = () =>
          tierRef.current === 'poster' || layer.current?.dataset.ready === 'true' || performance.now() - t0 > 4000 ? resolve() : window.setTimeout(check, 80)
        check()
      })

    let leaving = false
    let launching = 0
    let gliding = 0
    const glideWrap = () => {
      const wrap = section.querySelector<HTMLElement>('[data-hero-play-wrap]')
      if (!wrap || s.reduced) return
      wrap.dataset.glide = 'true'
      window.clearTimeout(gliding)
      gliding = window.setTimeout(() => delete wrap.dataset.glide, 1400)
    }
    /**
     * Taking the tour readies the stage and asks the visitor to scroll — it doesn't move the camera (the
     * owner, 2026-11-06: a click "shouldnt move directly to the crew space, it must just animate and signal
     * scroll to move"). Only a click on a space itself (its tile) carries the visitor there: `go`.
     */
    const launch = async (to: Shot = 1, go = false) => {
      if (s.tour) return glide(shotTop(to))
      // the scene may still be on its way (on a phone this tap is what wakes it): the control waits, turning, until it is there
      if (tierRef.current === 'pending' || (tierRef.current === 'live' && layer.current?.dataset.ready !== 'true')) {
        playBtn?.setAttribute('data-waiting', 'true')
        await settled()
        playBtn?.removeAttribute('data-waiting')
      }
      await loadScroll()
      if (cancelled || s.tour) return
      s.tour = true
      leaving = false
      root.dataset.tour = 'on'
      playBtn?.setAttribute('aria-expanded', 'true')
      // the lens opens, the title steps aside, the line's light runs
      // (a crisp ring opening a little way and fading, not a blur scaled to seven times its size)
      if (!s.reduced) iris?.animate([{ transform: 'scale(1)', opacity: 0.85 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: 560, delay: 40, easing: EASE_OUT, fill: 'none' })
      section.dataset.launching = 'true'
      s.playHover = 1
      window.clearTimeout(launching)
      launching = window.setTimeout(() => {
        delete section.dataset.launching
        s.playHover = 0
        // the title's words have stepped aside: it now waits off stage for the tour
        painted = -1
        kick()
      }, 1100)
      // the play control's place glides with the camera to where the logo now stands (the cue rises there)
      glideWrap()
      refresh()
      measure()
      painted = -1
      kick()
      if (go) {
        // The camera dives as the lens opens. The scroll leaves on the entering curve: the camera's own path
        // from the whole logo into the space already eases in and out, and the two eased together would
        // hold the frame still for half the dive.
        window.setTimeout(() => s.tour && glide(shotTop(to), undefined, EASE_OUT_FN), s.reduced ? 0 : 120)
        window.setTimeout(() => exitBtn?.focus({ preventScroll: true }), s.reduced ? 0 : 900)
      } else {
        // the cue to scroll rises in where the play control was: the keyboard lands on it
        window.setTimeout(() => s.tour && beginBtn?.focus({ preventScroll: true }), s.reduced ? 0 : 900)
      }
    }
    const end = () => {
      leaving = false
      s.tour = false
      delete root.dataset.tour
      delete root.dataset.tourLeaving
      s.target = 0
      painted = -1
      kick()
      glideWrap()
      refresh()
      measure()
      playBtn?.setAttribute('aria-expanded', 'false')
      playBtn?.focus({ preventScroll: true })
    }
    const leave = () => {
      if (!s.tour || leaving) return
      leaving = true
      root.dataset.tourLeaving = 'true'
      // rewind to the title, then the hero is one screen again
      glide(heroTop(), end)
    }
    s.goToShot = (shot: number) => (s.tour ? glide(shotTop(shot)) : void launch(shot as Shot, true))
    const onPlay = () => void launch(1)
    // the cue's own button: the journey starts (the keyboard's way in; a click or a tap does the same)
    const onBegin = () => s.tour && glide(shotTop(1), undefined, EASE_OUT_FN)
    const onExit = () => leave()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && s.tour && onScreen) leave()
    }
    const onMark = (e: MouseEvent) => {
      const go = (e.target as HTMLElement).closest<HTMLElement>('[data-hero-go]')
      if (go && s.tour) glide(shotTop(Number(go.dataset.heroGo)))
    }
    playBtn?.addEventListener('click', onPlay)
    beginBtn?.addEventListener('click', onBegin)
    exitBtn?.addEventListener('click', onExit)
    trackEl?.addEventListener('click', onMark)
    window.addEventListener('keydown', onKey)

    if (held) {
      s.target = s.current = SHOT_AT[held.shot]
      setFace(held.face, false)
    }
    paint()
    return () => {
      cancelled = true
      stopWaiting()
      stopGlide()
      revert()
      window.clearTimeout(launching)
      window.clearTimeout(gliding)
      for (const t of TAKE) window.removeEventListener(t, takeOver)
      playBtn?.removeEventListener('click', onPlay)
      beginBtn?.removeEventListener('click', onBegin)
      exitBtn?.removeEventListener('click', onExit)
      trackEl?.removeEventListener('click', onMark)
      window.removeEventListener('keydown', onKey)
      delete root.dataset.tour
      delete root.dataset.tourLeaving
      s.tour = false
      io.disconnect()
      ro.disconnect()
      window.clearInterval(turn)
      section.removeEventListener('focusin', onFocus)
      titleImg?.removeEventListener('load', measure)
      playBtn?.removeEventListener('pointerenter', playOn)
      playBtn?.removeEventListener('pointerleave', playOff)
      playBtn?.removeEventListener('focus', playOn)
      playBtn?.removeEventListener('blur', playOff)
      cancelAnimationFrame(raf)
      s.goToShot = () => {}
      kickRef.current = () => {}
    }
  }, [])

  // The scene starts as soon as the page has painted when the visitor is plainly there (a mouse already over
  // the page, a page restored mid-scroll), or at their first move, scroll, touch or key; failing those, once
  // the page has been quiet a few seconds. The title's poster is the scene's first frame — the same universe,
  // the same lamp, the logo in the same place — so whenever the scene takes over, nothing lands late
  // and nothing jumps (the owner, 2026-11-06: the space objects had arrived seconds late, "like boom"): it
  // only begins to move. (Booting it during the page's own load blocked a throttled phone's main thread for
  // over half a second, and cost the page its Largest Contentful Paint.)
  React.useEffect(() => {
    let alive = true
    let painted = false
    let engaged = window.scrollY > 0 || document.querySelector(':hover') !== null
    let started = false
    let quiet = 0
    const start = () => {
      if (started || !painted || !engaged || !alive) return
      started = true
      window.clearTimeout(quiet)
      choose()
        .catch((): Choice => ({ tier: 'poster' }))
        .then((c) => {
          if (!alive) return
          tierRef.current = c.tier
          // the choice, on the page, for anyone checking a device by hand (inspect the element)
          layer.current?.setAttribute('data-tier', c.tier === 'live' ? `live (quality ${c.quality}, display ${c.hz} Hz)` : 'stills')
          if (c.tier === 'live') {
            setQuality(c.quality)
            setHz(c.hz)
          }
          setTier(c.tier)
          kickRef.current()
        })
    }
    const stopEngaged = whenEngaged(() => {
      engaged = true
      start()
    })
    const stopPaint = afterFirstPaint(() => {
      painted = true
      start()
      quiet = window.setTimeout(() => {
        engaged = true
        start()
      }, QUIET_START)
    })
    return () => {
      alive = false
      window.clearTimeout(quiet)
      stopPaint()
      stopEngaged()
    }
  }, [])

  const onReady = React.useCallback(() => {
    layer.current?.setAttribute('data-ready', 'true')
    setReady(true)
  }, [])

  // While the live 3D is on screen the page marks it, and nothing frosts over it (hero.css).
  React.useEffect(() => {
    const on = tier === 'live' && ready && visible
    const root = document.documentElement
    if (on) root.dataset.heroLive = 'true'
    else delete root.dataset.heroLive
    return () => void delete root.dataset.heroLive
  }, [tier, ready, visible])
  const onLost = React.useCallback(() => {
    layer.current?.removeAttribute('data-ready')
    setReady(false)
    layer.current?.setAttribute('data-tier', 'stills (the scene could not run smoothly here)')
    tierRef.current = 'poster'
    setTier('poster')
    kickRef.current()
  }, [])

  return (
    <div ref={attach} aria-hidden className="hero-scene">
      {tier === 'live' && stage && reducedPref !== null && (
        <Fallback onError={onLost}>
          <HeroCanvas sources={sources} quality={quality} hz={hz} reduced={reduced} visible={visible} eventSource={stage} onReady={onReady} onLost={onLost} />
        </Fallback>
      )}
    </div>
  )
}
