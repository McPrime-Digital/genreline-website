'use client'
/**
 * A CINEMA'S SCREEN — a film playing in a space (films.ts), in its era's look (shaders.ts FILM_*).
 *
 * It asks for its film as its space comes near (its weight, read each frame), so nothing loads before the
 * tour. Under the pointer it is watched: the film brightens and that space's feature screens step back
 * (`watching`, read by Station's screens), and come back as the pointer leaves.
 */
import * as React from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Vector2, type Mesh, type ShaderMaterial, type Texture } from 'three'
import { heroState } from '@/components/hero/state'
import { live } from '@/components/hero/scene/rig'
import { FILM_FRAG, FILM_VERT } from '@/components/hero/scene/shaders'
import { filmPicture, wantFilm } from '@/components/hero/scene/films'
import { HERO_FILMS } from '@/content/hero-films'

export type StationKey = 'crew' | 'client' | 'suite'
/** The film each space is watching, 0–1 (eased): its screens step back while it is. */
export const watching: Record<StationKey, { to: number; now: number }> = { crew: { to: 0, now: 0 }, client: { to: 0, now: 0 }, suite: { to: 0, now: 0 } }

const damp = (from: number, to: number, speed: number, dt: number) => from + (to - from) * Math.min(1, dt * speed)

/** Eases each space's watching toward what the pointer asks (once a frame, from HeroScene). */
export function easeWatching(dt: number) {
  for (const w of Object.values(watching)) w.now = heroState.reduced ? w.to : damp(w.now, w.to, 5, dt)
}

export type Era = 0 | 1 | 2

/**
 * One screen: `size` in scene units, `weight()` how present its space is (0–1, each frame), its film's id and
 * era. Children hang in the same frame (a screen's border, its frame), drawn round it.
 */
export function FilmScreen({
  film, era, station, size, weight, position, rotation, renderOrder = -6, opacity = 1,
}: {
  film: string; era: Era; station: StationKey; size: [number, number]; weight: () => number
  position?: [number, number, number]; rotation?: [number, number, number]; renderOrder?: number; opacity?: number
}) {
  const spec = HERO_FILMS.find((f) => f.id === film)
  const mat = React.useRef<ShaderMaterial>(null)
  const mesh = React.useRef<Mesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const uniforms = React.useMemo(
    () => ({
      uMap: { value: null as Texture | null }, uHasMap: { value: 0 }, uTexel: { value: new Vector2(1 / 640, 1 / 480) },
      uTime: { value: 0 }, uWeight: { value: 0 }, uBright: { value: 1 }, uScreen: { value: size[0] / size[1] }, uFilm: { value: spec?.aspect ?? 4 / 3 },
    }),
    [size, spec],
  )
  useFrame(() => {
    const m = mat.current
    const me = mesh.current
    if (!m || !me) return
    const w = weight()
    me.visible = w > 0.004
    if (!me.visible) return
    wantFilm(film, w)
    const pic = filmPicture(film)
    const u = m.uniforms
    if (u.uMap.value !== pic) {
      u.uMap.value = pic
      u.uHasMap.value = pic ? 1 : 0
      const img = pic?.image as { videoWidth?: number; width?: number; videoHeight?: number; height?: number } | undefined
      const iw = img?.videoWidth || img?.width || 640
      const ih = img?.videoHeight || img?.height || 480
      ;(u.uTexel.value as Vector2).set(1 / iw, 1 / ih)
    }
    u.uTime.value = live.time
    u.uWeight.value = w * opacity
    u.uBright.value = 1 + 0.3 * watching[station].now
  })
  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      watching[station].to = 1
      invalidate()
    },
    onPointerOut: () => {
      watching[station].to = 0
      invalidate()
    },
  }
  return (
    <mesh ref={mesh} position={position} rotation={rotation} renderOrder={renderOrder} visible={false} {...handlers}>
      <planeGeometry args={[size[0], size[1]]} />
      <shaderMaterial ref={mat} vertexShader={FILM_VERT} fragmentShader={FILM_FRAG} defines={{ ERA: era }} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  )
}
