'use client'
/**
 * The 3D canvas — loaded with next/dynamic (ssr: false) after first paint,
 * and only on a device that can carry it (HeroDirector decides). Hidden from
 * assistive technology: every word the hero says is in the HTML around it.
 *
 * THE RENDERER (reported in HANDOFF.md): WebGL 2, through R3F v9's `gl`
 * factory. three's WebGPURenderer was measured and does not fit the 3D
 * bundle's 250 KB budget (three/webgpu alone is 306 KB gzipped), so the
 * factory builds a WebGLRenderer; the WebGPU swap is one line here when the
 * budget allows.
 */
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor'
import { WebGLRenderer } from 'three'
import { HeroScene } from '@/components/hero/scene/HeroScene'
import { DPR, FOV, SLOW_FRAMES } from '@/components/hero/scene/numbers'
import type { HeroSources } from '@/components/hero/scene/textures'

/**
 * Compiles every shader the scene will use — with the hidden stations shown
 * for that one pass — so no screen stalls the frame it first appears in; then
 * tells the page the first frame is on screen, so the canvas fades in over
 * the poster.
 */
function Ready({ onReady }: { onReady: () => void }) {
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
    gl.compileAsync(scene, camera)
      .catch(() => {})
      .finally(() => {
        for (const o of hidden) o.visible = false
        compiled.current = true
        invalidate()
      })
  }, [get])
  useFrame(() => {
    if (told.current || !compiled.current) return
    told.current = true
    requestAnimationFrame(onReady)
  })
  return null
}

export type HeroCanvasProps = {
  sources: HeroSources
  reduced: boolean
  visible: boolean
  eventSource: HTMLElement
  onReady: () => void
  onLost: () => void
}

export default function HeroCanvas({ sources, reduced, visible, eventSource, onReady, onLost }: HeroCanvasProps) {
  // Slow frames lower the resolution and drop the outer glow and the streaks, once and for good.
  const [lowered, setLowered] = React.useState(false)
  const lower = React.useCallback(() => setLowered(true), [])

  return (
    <Canvas
      aria-hidden
      flat
      dpr={lowered ? DPR.lowered : [1, DPR.cap]}
      frameloop={!visible ? 'never' : reduced ? 'demand' : 'always'}
      camera={{ fov: FOV.wide, near: 0.1, far: 900, position: [32, 0, 80] }}
      gl={(defaults) => {
        const renderer = new WebGLRenderer({ ...defaults, antialias: true, alpha: false, stencil: false, powerPreference: 'high-performance' })
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
      {!reduced && visible && (
        <PerformanceMonitor
          // slower than 28 ms a frame on average
          bounds={(refresh) => [Math.round(1 / SLOW_FRAMES.seconds), refresh + 10]}
          onDecline={lower}
          onFallback={lower}
        />
      )}
      <HeroScene sources={sources} lowered={lowered} reduced={reduced} />
      <Ready onReady={onReady} />
    </Canvas>
  )
}
