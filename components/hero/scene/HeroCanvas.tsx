'use client'
/**
 * The 3D canvas — loaded with next/dynamic (ssr: false) after first paint,
 * and only on a device that can carry it (HeroDirector decides). Hidden from
 * assistive technology: every word the hero says is in the HTML around it.
 *
 * THE RENDERER (batch W-3D-1 §2, reported in HANDOFF.md): WebGL 2, through
 * R3F v9's `gl` factory. three's WebGPURenderer was measured and does not fit
 * the 3D bundle's 250 KB budget (three/webgpu alone is 306 KB gzipped), so
 * the factory builds a WebGLRenderer; the WebGPU swap is one line here when
 * the budget allows.
 */
import * as React from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei/core/PerformanceMonitor'
import { WebGLRenderer } from 'three'
import { HeroScene } from '@/components/hero/scene/HeroScene'
import { CAMERA_PATH, DPR, FOV, SLOW_FRAMES } from '@/components/hero/scene/numbers'
import type { ScreenSources } from '@/components/hero/scene/textures'

/** Tells the page once the first frame is on screen, so the canvas can fade in over the poster. */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = React.useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    requestAnimationFrame(onReady)
  })
  return null
}

export type HeroCanvasProps = {
  sources: ScreenSources
  motion: boolean
  visible: boolean
  eventSource: HTMLElement
  onReady: () => void
  onLost: () => void
}

export default function HeroCanvas({ sources, motion, visible, eventSource, onReady, onLost }: HeroCanvasProps) {
  // Slow frames lower the resolution and drop the outer glow, once and for good.
  const [lowered, setLowered] = React.useState(false)
  const lower = React.useCallback(() => setLowered(true), [])

  return (
    <Canvas
      aria-hidden
      flat
      dpr={lowered ? DPR.lowered : [1, DPR.cap]}
      frameloop={!visible ? 'never' : motion ? 'always' : 'demand'}
      camera={{ fov: FOV.wide, near: 0.1, far: 200, position: [...CAMERA_PATH[0]] }}
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
      {motion && visible && (
        <PerformanceMonitor
          // the prototype's test: slower than 28 ms a frame on average
          bounds={(refresh) => [Math.round(1 / SLOW_FRAMES.seconds), refresh + 10]}
          onDecline={lower}
          onFallback={lower}
        />
      )}
      <HeroScene sources={sources} lowered={lowered} motion={motion} />
      <FirstFrame onReady={onReady} />
    </Canvas>
  )
}
