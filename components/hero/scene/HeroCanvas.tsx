'use client'
/**
 * The 3D canvas — loaded with next/dynamic (ssr: false) once the page has
 * painted and the visitor is there, on every device that draws WebGL 2 on graphics hardware
 * (HeroDirector decides). Hidden from assistive technology: every word the
 * hero says is in the HTML around it.
 *
 * ONE SCENE, FITTED TO EVERY DEVICE. It starts at the quality HeroDirector
 * chose from the GPU, and the GOVERNOR below then watches the frame rate the
 * device actually delivers: too slow, and it steps down — fewer particles and
 * stars, no streaks, then a lower resolution — until the scene runs
 * smoothly; comfortably fast, and it may step up one level. Resolution is
 * held to a pixel budget as well as a ratio (numbers.ts QUALITY), so a big
 * 4K screen draws no more pixels than its GPU can fill. If even the lowest
 * level cannot keep up, the hero plays as stills (onLost).
 *
 * THE RENDERER (reported in HANDOFF.md): WebGL 2, through R3F v9's `gl`
 * factory. three's WebGPURenderer was measured and does not fit the 3D
 * bundle's 250 KB budget, so the factory builds a WebGLRenderer.
 */
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { WebGLRenderer } from 'three'
import { HeroScene } from '@/components/hero/scene/HeroScene'
import { FOV, GOVERNOR, LEVEL_OF_QUALITY, LEVELS, QUALITY, type Quality } from '@/components/hero/scene/numbers'
import { live, OVERSCAN } from '@/components/hero/scene/rig'
import type { HeroSources } from '@/components/hero/scene/textures'

/**
 * Compiles every shader the scene will use — with the hidden stations shown
 * for that one pass — so no screen stalls the frame it first appears in; then
 * tells the page the first frame is on screen, so the canvas fades in over
 * the poster.
 */
function Ready({ onReady, onFailed }: { onReady: () => void; onFailed: () => void }) {
  const get = useThree((s) => s.get)
  const compiled = React.useRef(false)
  const told = React.useRef(false)
  React.useEffect(() => {
    const { gl, scene, camera, invalidate } = get()
    const hidden: { visible: boolean }[] = []
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o)
        o.visible = true
      }
    })
    // in parallel where the browser can (most); in one pass where it cannot (some Firefox builds), without three's warning
    const compiling = gl.extensions.has('KHR_parallel_shader_compile') ? gl.compileAsync(scene, camera) : Promise.resolve(gl.compile(scene, camera))
    compiling
      .catch(() => {})
      .finally(() => {
        for (const o of hidden) o.visible = false
        // A shader this device's graphics driver could not build would leave part of the scene blank
        // (three would only notice the first time it drew with it): ask the driver about every one
        // now, and rather than a broken scene, play the hero as stills.
        const ctx = gl.getContext()
        const broken = (gl.info.programs ?? []).some((p) => {
          const raw = (p as { program?: WebGLProgram }).program
          return raw ? ctx.getProgramParameter(raw, ctx.LINK_STATUS) === false : false
        })
        if (broken) return onFailed()
        compiled.current = true
        live.ready = true
        invalidate()
      })
    return () => {
      live.ready = false
    }
  }, [get, onFailed])
  // and if the scene is not drawing within 20 s for any reason (a driver stuck building shaders), the stills
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      if (!told.current) onFailed()
    }, 20000)
    return () => window.clearTimeout(t)
  }, [onFailed])
  useFrame(() => {
    if (told.current || !compiled.current) return
    told.current = true
    requestAnimationFrame(onReady)
  })
  return null
}

/**
 * The governor: measures how the device actually runs the scene and moves the
 * level (numbers.ts GOVERNOR). It judges against the display's own rate,
 * measured before the scene started (`hz`): smooth is that rate, or 60 fps on
 * a faster screen — steadily. A frame half again as long as that beat reads as
 * a stutter even when the average looks fine, so late frames count as much as
 * the average. Frames that carry a picture's upload are not held against it.
 */
function Governor({ level, start, hz, onLevel, onTooSlow }: { level: number; start: number; hz: number; onLevel: (l: number) => void; onTooSlow: () => void }) {
  const st = React.useRef({ settle: GOVERNOR.settle as number, frames: [] as number[], sum: 0, good: 0, floorSlow: 0, cap: Math.min(LEVELS.length - 1, start + 1) })
  // the rate that reads as smooth here: the display's, up to 60
  const target = Math.min(hz, 60)
  useFrame((_, dt) => {
    const s = st.current
    // a frame longer than a quarter second is a hidden tab or a stall, not the scene's pace; a frame
    // carrying an upload is the upload's
    if (dt > 0.25 || performance.now() < live.busyUntil) {
      s.frames.length = 0
      s.sum = 0
      return
    }
    if (s.settle > 0) {
      s.settle -= dt
      return
    }
    s.frames.push(dt)
    s.sum += dt
    if (s.sum < GOVERNOR.window) return
    const fps = s.frames.length / s.sum
    const late = s.frames.filter((f) => f > 1.5 / target).length / s.frames.length
    s.frames.length = 0
    s.sum = 0
    if (fps < target * GOVERNOR.slow || late > GOVERNOR.late) {
      s.good = 0
      if (level > 0) {
        // far off the pace: two steps at once
        const to = fps < target * 0.6 ? Math.max(0, level - 2) : level - 1
        s.cap = to
        s.settle = 1
        onLevel(to)
      } else if ((fps < target * GOVERNOR.floor || late > 0.25) && ++s.floorSlow >= 2) {
        onTooSlow()
      }
      return
    }
    s.floorSlow = 0
    if (fps >= target * GOVERNOR.good && late < GOVERNOR.lateGood && level < s.cap) {
      if (++s.good >= GOVERNOR.climb) {
        s.good = 0
        s.settle = 1
        onLevel(level + 1)
      }
    } else s.good = 0
  })
  return null
}

/** The pixel ratio for a level: the device's, held under the quality's ratio and its pixel budget for this screen. */
function dprFor(level: number, width: number, height: number) {
  const { quality, scale } = LEVELS[level]
  const q = QUALITY[quality]
  const fit = Math.sqrt(q.pixels / Math.max(1, width * height))
  // (a poster with overscan draws S times as many pixels each way, so its middle is as sharp as ever)
  return Math.max(0.6, Math.min(window.devicePixelRatio || 1, q.dpr * OVERSCAN, fit * OVERSCAN) * scale)
}

function useViewport() {
  const [size, setSize] = React.useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  React.useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}

export type HeroCanvasProps = {
  sources: HeroSources
  quality: Quality
  /** The display's own frame rate, measured before the scene started. */
  hz: number
  reduced: boolean
  visible: boolean
  eventSource: HTMLElement
  onReady: () => void
  onLost: () => void
}

export default function HeroCanvas({ sources, quality, hz, reduced, visible, eventSource, onReady, onLost }: HeroCanvasProps) {
  const start = LEVEL_OF_QUALITY[quality]
  // `?governor=off` holds the starting level, for measuring a device by hand
  const [governed] = React.useState(() => new URLSearchParams(window.location.search).get('governor') !== 'off')
  const [level, setLevel] = React.useState<number>(start)
  const { w, h } = useViewport()
  const dpr = dprFor(level, w, h)
  // edge smoothing is fixed when the context is made: on for the middle and strong qualities
  const [antialias] = React.useState<boolean>(QUALITY[quality].antialias)
  // the level in use, on the stage, for anyone checking a device by hand (inspect the element)
  React.useEffect(() => {
    eventSource.setAttribute('data-hero-level', `${level} (quality ${LEVELS[level].quality}, ${dpr.toFixed(2)}x)`)
  }, [eventSource, level, dpr])

  return (
    <Canvas
      aria-hidden
      flat
      dpr={dpr}
      frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}
      camera={{ fov: FOV.wide, near: 0.1, far: 900, position: [32, 0, 80] }}
      gl={(defaults) => {
        const renderer = new WebGLRenderer({ ...defaults, antialias, alpha: false, stencil: false, powerPreference: 'high-performance' })
        renderer.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onLost()
        })
        return renderer
      }}
      eventSource={eventSource}
      eventPrefix="client"
      style={{ position: 'absolute', inset: 0 }}
    >
      {!reduced && visible && governed && <Governor level={level} start={start} hz={hz} onLevel={setLevel} onTooSlow={onLost} />}
      <HeroScene sources={sources} quality={LEVELS[level].quality} reduced={reduced} />
      <Ready onReady={onReady} onFailed={onLost} />
    </Canvas>
  )
}
