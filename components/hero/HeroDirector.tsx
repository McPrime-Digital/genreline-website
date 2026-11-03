'use client'
/**
 * THE DIRECTOR — the hero's one client island (batch W-3D-1 §2–§4).
 *
 *  · Scroll: GSAP ScrollTrigger scrubs the hero's 300vh into a progress of
 *    0–1 (heroState.target). The camera and the words follow `current`: the
 *    target damped at the prototype's 4.5/s with Motion on, cut to the
 *    nearest of the five shots with Motion off.
 *  · Words: the five shots' HTML cross-fade with the camera (cut, with Motion
 *    off). The slate line's timecode and the track run with it.
 *  · The scene: after first paint and the visitor's first move (or five
 *    seconds of reading), and only where it will run well —
 *    detect-gpu tier 2 or 3, a CPU that passes a short probe, no Save-Data.
 *    Everything else keeps the poster.
 *    `?hero=live` or `?hero=poster` overrides the choice, for checking a
 *    device by hand.
 *
 * Nothing here re-renders on scroll: the frame loop writes styles directly.
 */
import * as React from 'react'
import dynamic from 'next/dynamic'
import { cut, heroState, timecode } from '@/components/hero/state'
import { SCROLL_DAMPING, SHOTS } from '@/components/hero/scene/numbers'
import type { ScreenSources } from '@/components/hero/scene/textures'
import { useMotion } from '@/lib/motion'

const HeroCanvas = dynamic(() => import('@/components/hero/scene/HeroCanvas'), { ssr: false, loading: () => null })

type Tier = 'pending' | 'live' | 'poster'

/** If the canvas fails in any way, the poster stays. */
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
 * The scene needs CPU headroom as well as a GPU: three, the reconciler and
 * the scene are 207 KB of script to parse, and the screens' pictures upload
 * on the main thread. A fixed piece of arithmetic takes about 2.3 ms on an
 * Apple M2 and about 8.6 ms under Lighthouse's 4× mobile CPU throttle
 * (measured 2026-11-03); slower than 6 ms keeps the poster. The best of four
 * runs, so one hiccup does not decide it.
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
 * then the poster IS the scene (its first frame, rendered by the scene), so
 * nothing visible changes; what changes is that the GPU check and the 207 KB
 * of 3D script never compete with the page's first seconds.
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

async function chooseTier(): Promise<Exclude<Tier, 'pending'>> {
  const asked = new URLSearchParams(window.location.search).get('hero')
  if (asked === 'live' || asked === 'poster') return asked
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return 'poster'
  if (cpuIsSlow()) return 'poster'
  try {
    const { getGPUTier } = await import('detect-gpu')
    // The benchmark data is served from this site (public/detect-gpu), never fetched from a third party.
    const gpu = await getGPUTier({ benchmarksURL: '/detect-gpu' })
    // Tier 1 keeps the poster until the pre-rendered film exists (W-3D-1 §3).
    return gpu.tier >= 2 ? 'live' : 'poster'
  } catch {
    return 'poster'
  }
}

export function HeroDirector({ sources }: { sources: ScreenSources }) {
  const layer = React.useRef<HTMLDivElement>(null)
  const motionPref = useMotion()
  const motion = motionPref ?? true
  const [tier, setTier] = React.useState<Tier>('pending')
  const [visible, setVisible] = React.useState(true)
  const [stage, setStage] = React.useState<HTMLElement | null>(null)
  // The stage is the scene's event source, so the 3D answers the pointer through the words laid over it.
  const attach = React.useCallback((el: HTMLDivElement | null) => {
    layer.current = el
    setStage(el?.closest<HTMLElement>('[data-hero-stage]') ?? null)
  }, [])
  const kickRef = React.useRef<() => void>(() => {})

  // Motion: shared with the frame loop, and mirrored on <html> while this page is open.
  React.useEffect(() => {
    if (motionPref === null) return
    heroState.motion = motionPref
    document.documentElement.dataset.motion = motionPref ? 'on' : 'off'
    kickRef.current()
    heroState.invalidate()
  }, [motionPref])
  React.useEffect(() => () => void delete document.documentElement.dataset.motion, [])

  // The scroll, the words, the timecode.
  React.useEffect(() => {
    const el = layer.current
    const section = el?.closest<HTMLElement>('[data-hero]')
    if (!section) return
    const shots = Array.from(section.querySelectorAll<HTMLElement>('[data-shot]'))
    const clocks = Array.from(section.querySelectorAll<HTMLElement>('[data-hero-timecode]'))
    const marks = Array.from(section.querySelectorAll<HTMLElement>('[data-hero-mark]'))
    const fill = section.querySelector<HTMLElement>('[data-hero-fill]')
    const s = heroState

    let shown = -1
    let painted = -1
    const paint = () => {
      const p = s.current
      if (p === painted) return
      painted = p
      const at = p * (SHOTS - 1)
      const nearest = Math.round(at)
      shots.forEach((card, i) => {
        const d = at - i
        let o: number
        let y = 0
        if (s.motion) {
          o = Math.min(1, Math.max(0, 1 - (Math.abs(d) - 0.12) / 0.33))
          y = d * -28
        } else o = i === nearest ? 1 : 0
        card.style.opacity = String(o)
        card.style.transform = y ? `translate3d(0, ${y.toFixed(1)}px, 0)` : ''
        card.dataset.active = o > 0.5 ? 'true' : 'false'
      })
      if (nearest !== shown) {
        shown = nearest
        marks.forEach((m, i) => {
          m.dataset.reached = i <= nearest ? 'true' : 'false'
          m.dataset.current = i === nearest ? 'true' : 'false'
        })
      }
      const tc = timecode(p)
      for (const c of clocks) if (c.textContent !== tc) c.textContent = tc
      if (fill) fill.style.transform = `scaleX(${p.toFixed(4)})`
      section.style.setProperty('--hero-p', p.toFixed(4))
    }

    let raf = 0
    let last = 0
    const tick = (now: number) => {
      raf = 0
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60
      last = now
      if (s.motion) {
        s.current += (s.target - s.current) * Math.min(1, dt * SCROLL_DAMPING)
        if (Math.abs(s.target - s.current) < 0.0002) s.current = s.target
      } else s.current = cut(s.target)
      paint()
      if (!s.motion) s.invalidate()
      if (s.motion && s.current !== s.target) raf = requestAnimationFrame(tick)
      else last = 0
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    kickRef.current = () => {
      painted = -1
      kick()
    }

    s.goToShot = (shot: number) => {
      const top = section.getBoundingClientRect().top + window.scrollY
      const range = section.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + (range * shot) / (SHOTS - 1), behavior: s.motion ? 'smooth' : 'instant' })
    }

    // Keyboard: focusing something in a shot that is not on screen brings that shot up.
    const onFocus = (e: FocusEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-shot]')
      if (!card) return
      const i = Number(card.dataset.shot)
      if (Math.round(s.target * (SHOTS - 1)) === i) return
      const top = section.getBoundingClientRect().top + window.scrollY
      const range = section.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + (range * i) / (SHOTS - 1), behavior: 'instant' })
    }
    section.addEventListener('focusin', onFocus)

    // Is the hero on screen at all? Off screen, the scene stops drawing.
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(section)

    // GSAP ScrollTrigger maps the scroll to progress, after first paint.
    let revert = () => {}
    let cancelled = false
    const stopWaiting = afterFirstPaint(async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)
      const ctx = gsap.context(() => {
        const proxy = { p: 0 }
        gsap.to(proxy, {
          p: 1,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true },
          onUpdate: () => {
            s.target = proxy.p
            kick()
          },
        })
      }, section)
      ScrollTrigger.refresh()
      revert = () => ctx.revert()
    })

    paint()
    return () => {
      cancelled = true
      stopWaiting()
      revert()
      io.disconnect()
      section.removeEventListener('focusin', onFocus)
      cancelAnimationFrame(raf)
      s.goToShot = () => {}
      kickRef.current = () => {}
    }
  }, [])

  // The device tier: after first paint, once the visitor is engaged.
  React.useEffect(() => {
    let live = true
    let stopEngaged = () => {}
    const stopPaint = afterFirstPaint(() => {
      stopEngaged = whenEngaged(() => {
        chooseTier().then((t) => live && setTier(t))
      })
    })
    return () => {
      live = false
      stopPaint()
      stopEngaged()
    }
  }, [])

  const onReady = React.useCallback(() => layer.current?.setAttribute('data-ready', 'true'), [])
  const onLost = React.useCallback(() => {
    layer.current?.removeAttribute('data-ready')
    setTier('poster')
  }, [])

  return (
    <div ref={attach} aria-hidden className="hero-scene">
      {tier === 'live' && stage && motionPref !== null && (
        <Fallback onError={onLost}>
          <HeroCanvas sources={sources} motion={motion} visible={visible} eventSource={stage} onReady={onReady} onLost={onLost} />
        </Fallback>
      )}
    </div>
  )
}
