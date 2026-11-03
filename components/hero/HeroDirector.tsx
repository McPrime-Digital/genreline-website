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
 *  · The scene: after first paint and the visitor's first move (or five
 *    seconds of reading), and only where it will run well — detect-gpu tier
 *    2 or 3, a CPU that passes a short probe, no Save-Data. Everywhere else
 *    the hero is played as stills: a poster of each shot, rendered by the
 *    scene, cross-fading as the visitor scrolls.
 *    `?hero=live` or `?hero=poster` overrides the choice, and `?shot=crew`
 *    (title, crew, client, stakeholders, suite, close) holds one shot, for
 *    checking a device and rendering the posters.
 *
 * Nothing here re-renders on scroll: the frame loop writes styles directly.
 */
import * as React from 'react'
import dynamic from 'next/dynamic'
import { cut, heroState, nearestShot, SHOT_AT, shotWeight, storyAt, timecode } from '@/components/hero/state'
import { FACE, SCROLL_DAMPING, type Shot } from '@/components/hero/scene/numbers'
import type { HeroSources } from '@/components/hero/scene/textures'
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

/**
 * The scene needs CPU headroom as well as a GPU. A fixed piece of arithmetic
 * takes about 2.3 ms on an Apple M2 and about 8.6 ms under Lighthouse's 4×
 * mobile CPU throttle (measured 2026-11-03); slower than 6 ms plays the
 * posters. The best of four runs, so one hiccup does not decide it.
 */
const SLOW_CPU_MS = 6
function cpuIsSlow() {
  let sink = 0
  const run = () => {
    const t = performance.now()
    let x = 0
    for (let i = 0; i < 400_000; i++) x += Math.sqrt(i) * Math.sin(i)
    sink += x
    return performance.now() - t
  }
  const best = Math.min(run(), run(), run(), run())
  return best > SLOW_CPU_MS && sink !== 0
}

/**
 * The scene wakes when the visitor first does something — moves the mouse,
 * scrolls, touches, presses a key — or after five seconds of reading. Until
 * then the title's poster IS the scene (its first frame, rendered by the
 * scene), so nothing visible changes.
 */
function whenEngaged(fn: () => void) {
  const events = ['pointermove', 'pointerdown', 'wheel', 'touchstart', 'keydown', 'scroll'] as const
  let done = false
  const go = () => {
    if (done) return
    done = true
    stop()
    fn()
  }
  const timer = setTimeout(go, 5000)
  const stop = () => {
    clearTimeout(timer)
    for (const e of events) window.removeEventListener(e, go)
  }
  for (const e of events) window.addEventListener(e, go, { passive: true, once: true })
  return stop
}

const params = () => new URLSearchParams(window.location.search)

async function chooseTier(): Promise<Exclude<Tier, 'pending'>> {
  const asked = params().get('hero')
  if (asked === 'live' || asked === 'poster') return asked
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return 'poster'
  if (cpuIsSlow()) return 'poster'
  try {
    const { getGPUTier } = await import('detect-gpu')
    // The benchmark data is served from this site (public/detect-gpu), never fetched from a third party.
    const gpu = await getGPUTier({ benchmarksURL: '/detect-gpu' })
    return gpu.tier >= 2 ? 'live' : 'poster'
  } catch {
    return 'poster'
  }
}

/** `?shot=` — hold one shot (for checking by hand, and for rendering the posters). */
const HELD: Record<string, { shot: Shot; face: 0 | 1 }> = {
  title: { shot: 0, face: 0 }, crew: { shot: 1, face: 0 }, client: { shot: 2, face: 0 },
  stakeholders: { shot: 2, face: 1 }, suite: { shot: 3, face: 0 }, close: { shot: 4, face: 0 },
}

export function HeroDirector({ sources }: { sources: HeroSources }) {
  const layer = React.useRef<HTMLDivElement>(null)
  const reducedPref = useReducedMotion()
  const reduced = reducedPref ?? false
  const [tier, setTier] = React.useState<Tier>('pending')
  const [visible, setVisible] = React.useState(true)
  const [stage, setStage] = React.useState<HTMLElement | null>(null)
  // The stage is the scene's event source, so the 3D answers the pointer through the words laid over it.
  const attach = React.useCallback((el: HTMLDivElement | null) => {
    layer.current = el
    setStage(el?.closest<HTMLElement>('[data-hero-stage]') ?? null)
  }, [])
  const kickRef = React.useRef<() => void>(() => {})
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
    const s = heroState
    const held = HELD[params().get('shot') ?? '']

    let shown = -1
    let painted = -1
    const paint = () => {
      const p = s.current
      if (p === painted) return
      painted = p
      const place = storyAt(p)
      let caption = 0
      shots.forEach((card) => {
        const i = Number(card.dataset.shot) as Shot
        const w = shotWeight(place, i)
        const leaving = place.seg.kind === 'travel' && place.seg.from === i
        const y = (1 - w) * (leaving ? -14 : 14)
        card.style.opacity = w.toFixed(3)
        card.style.transform = w < 1 && !s.reduced ? `translate3d(0, ${y.toFixed(1)}px, 0)` : ''
        card.dataset.active = w > 0.5 ? 'true' : 'false'
        if (i !== 0) caption = Math.max(caption, w)
        else section.style.setProperty('--hero-title', w.toFixed(3))
      })
      section.style.setProperty('--hero-caption', caption.toFixed(3))
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
      if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`
      section.style.setProperty('--hero-p', p.toFixed(4))
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
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
      last = now
      if (!s.reduced) {
        s.current += (s.target - s.current) * Math.min(1, dt * SCROLL_DAMPING)
        if (Math.abs(s.target - s.current) < 0.00005) s.current = s.target
      } else s.current = cut(s.target)
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
    s.goToShot = (shot: number) => scrollToShot(shot, s.reduced ? 'instant' : 'smooth')

    // Keyboard: focusing something in a shot that is not on screen brings that shot up.
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-shot]')
      if (!card) return
      const i = Number(card.dataset.shot)
      if (nearestShot(s.target) === i) return
      scrollToShot(i, 'instant')
    }
    section.addEventListener('focusin', onFocus)

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

    // GSAP ScrollTrigger maps the scroll to progress, after first paint.
    let revert = () => {}
    let cancelled = false
    const stopWaiting = afterFirstPaint(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const ctx = gsap.context(() => {
        // The scroll's progress through the hero — read on every scroll and on every refresh, so a
        // page restored mid-hero (a reload, the back button) starts where it is.
        const follow = (self: { progress: number }) => {
          if (held) return
          s.target = self.progress
          kick()
        }
        ScrollTrigger.create({ trigger: section, start: 'top top', end: 'bottom bottom', onUpdate: follow, onRefresh: follow })
      }, section)
      ScrollTrigger.refresh()
      revert = () => ctx.revert()
    })

    if (held) {
      s.target = s.current = SHOT_AT[held.shot]
      setFace(held.face, false)
    }
    paint()
    return () => {
      cancelled = true
      stopWaiting()
      revert()
      io.disconnect()
      window.clearInterval(turn)
      section.removeEventListener('focusin', onFocus)
      cancelAnimationFrame(raf)
      s.goToShot = () => {}
      kickRef.current = () => {}
    }
  }, [])

  // The device tier: after first paint, once the visitor is engaged.
  React.useEffect(() => {
    let alive = true
    let stopEngaged = () => {}
    const stopPaint = afterFirstPaint(() => {
      stopEngaged = whenEngaged(() => {
        chooseTier().then((t) => {
          if (!alive) return
          tierRef.current = t
          setTier(t)
          kickRef.current()
        })
      })
    })
    return () => {
      alive = false
      stopPaint()
      stopEngaged()
    }
  }, [])

  const onReady = React.useCallback(() => layer.current?.setAttribute('data-ready', 'true'), [])
  const onLost = React.useCallback(() => {
    layer.current?.removeAttribute('data-ready')
    tierRef.current = 'poster'
    setTier('poster')
    kickRef.current()
  }, [])

  return (
    <div ref={attach} aria-hidden className="hero-scene">
      {tier === 'live' && stage && reducedPref !== null && (
        <Fallback onError={onLost}>
          <HeroCanvas sources={sources} reduced={reduced} visible={visible} eventSource={stage} onReady={onReady} onLost={onLost} />
        </Fallback>
      )}
    </div>
  )
}
