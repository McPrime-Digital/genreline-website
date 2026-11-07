'use client'
/**
 * THE TITLE'S PROJECTOR — the one film thing left in the sky (the owner, 2026-11-06: "we keep the star that
 * is shooting like a projector which is below the hero heading - i want that to shoot a very faded subtle
 * medium size screen projection to above the heading, the hero heading so it must be a subtle faint
 * projected screen with a film playing. multiple films. shoots then projection goes off after 10s then
 * comes back to continue after 10s in repeat").
 *
 * A far lamp below the title — where the title's poster shows it (heroState.posterMap), so the live scene
 * takes over without a jump — shoots a faint beam up to a screen above the title, placed from the page's
 * own measure of its words (heroState.layout), and a film plays on it, faint, for ten seconds; then the
 * projection goes out, and ten seconds later the lamp shoots again with the next film. Its films are the
 * tour's own (a time-lapse, NASA, Méliès, Spring), one playing at a time like every film here (films.ts).
 *
 * On the title only, on a wide screen (on a phone the title sits under the logo: no room above it); gone
 * once the tour starts. Under reduced motion, and in the posters, the lamp alone.
 */
import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Vector2, type Group, type ShaderMaterial, type Texture } from 'three'
import { heroState, shotWeight } from '@/components/hero/state'
import { live, OVERSCAN } from '@/components/hero/scene/rig'
import { FILM_FRAG, PROJ_BEAM_FRAG, PROJ_LAMP_FRAG, PROJ_VERT } from '@/components/hero/scene/shaders'
import { filmPicture, loopFilm, prefetchFilm, rewindFilm, wantFilm } from '@/components/hero/scene/films'
import { hsl } from '@/components/hero/scene/textures'
import { HERO_FILMS } from '@/content/hero-films'

export const PROJECTOR = {
  /** The lamp, in the title poster's own frame (−1…1, y up): low on the left, below the heading. */
  lamp: [-0.9, -0.62] as const,
  /** Its size (a share of the frame's height). */
  lampSize: 0.042,
  /** The films it throws, in turn. */
  films: ['suite-7', 'suite-9', 'suite-4', 'suite-11', 'suite-1'] as const,
  /** Seconds: the first shot once the title shows; the whole cycle; the film's time on screen; the shot; the fade. */
  first: 2.5,
  cycle: 20,
  on: 10,
  shoot: 0.7,
  fade: 0.9,
  /** The screen: the most of the room above the title it takes, and how bright it plays (faint). */
  fill: 0.9,
  light: 0.3,
  beam: 0.13,
} as const

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** A quad drawn straight in clip space (PROJ_VERT): its corners are uniforms. */
function clipQuad() {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(12), 3))
  g.setAttribute('aCorner', new BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2))
  g.setIndex([0, 1, 2, 0, 2, 3])
  return g
}
const corners = () => ({ uP0: { value: new Vector2() }, uP1: { value: new Vector2() }, uP2: { value: new Vector2() }, uP3: { value: new Vector2() } })

export function TitleProjector() {
  const geo = React.useMemo(() => clipQuad(), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const held = React.useMemo(() => new URLSearchParams(window.location.search).has('shot'), [])
  const lampUniforms = React.useMemo(() => ({ ...corners(), uColor: { value: hsl(40, 90, 90) }, uWeight: { value: 0 }, uOn: { value: 0 }, uTime: { value: 0 } }), [])
  const beamUniforms = React.useMemo(() => ({ ...corners(), uColor: { value: hsl(40, 70, 88) }, uWeight: { value: 0 }, uReach: { value: 0 }, uTime: { value: 0 } }), [])
  const screenUniforms = React.useMemo(
    () => ({
      ...corners(), uMap: { value: null as Texture | null }, uHasMap: { value: 0 }, uTexel: { value: new Vector2(1 / 854, 1 / 480) },
      uTime: { value: 0 }, uWeight: { value: 0 }, uBright: { value: 1 }, uScreen: { value: 16 / 9 }, uFilm: { value: 16 / 9 },
    }),
    [],
  )
  const group = React.useRef<Group>(null)
  const lamp = React.useRef<ShaderMaterial>(null)
  const beam = React.useRef<ShaderMaterial>(null)
  const screen = React.useRef<ShaderMaterial>(null)
  const st = React.useRef({ start: -1, rewound: -1 })

  useFrame(({ size }) => {
    const g = group.current
    const lm = lamp.current
    const bm = beam.current
    const sm = screen.current
    const place = live.place
    if (!g || !lm || !bm || !sm || !place) return
    const w = live.tall ? 0 : shotWeight(place, 0) * (1 - live.readied)
    g.visible = w > 0.004
    if (!g.visible) return
    const s = st.current
    const now = live.time
    const aspect = size.width / Math.max(1, size.height)

    // the lamp, where the title's poster shows it
    const pm = heroState.posterMap
    // (in a poster with overscan its framing is S times nearer the middle: the lamp with it — rig.ts OVERSCAN)
    const os = held ? OVERSCAN : (pm?.s ?? 1)
    let lx: number = PROJECTOR.lamp[0] / os
    let ly: number = PROJECTOR.lamp[1] / os
    if (pm && !pm.tall) {
      lx = ((pm.x0 + ((lx + 1) / 2) * pm.pw * pm.k) / pm.w) * 2 - 1
      ly = 1 - ((pm.y0 + ((1 - ly) / 2) * pm.ph * pm.k) / pm.h) * 2
    }

    // the cycle: it shoots, the film plays ten seconds, the projection goes out, ten seconds' dark, again
    const running = !heroState.reduced && !held
    if (s.start < 0 && w > 0.5) s.start = now + PROJECTOR.first
    const t = s.start < 0 ? -1 : now - s.start
    const n = t < 0 ? 0 : Math.floor(t / PROJECTOR.cycle)
    const ph = t < 0 ? -1 : t - n * PROJECTOR.cycle
    const film = PROJECTOR.films[n % PROJECTOR.films.length]
    const reach = running && ph >= 0 ? clamp01(ph / PROJECTOR.shoot) : 0
    const out = 1 - smooth(PROJECTOR.on, PROJECTOR.on + PROJECTOR.fade, ph)
    const show = running && ph >= 0 ? smooth(PROJECTOR.shoot * 0.5, PROJECTOR.shoot + PROJECTOR.fade, ph) * out : 0
    const beamOn = running && ph >= 0 ? Math.min(1, ph / 0.15) * out : 0
    if (running) {
      // the next film fetched ahead; the one on screen asked for while it shows, round and round
      if (t < 0 || ph > PROJECTOR.cycle - 4) prefetchFilm(t < 0 ? PROJECTOR.films[0] : PROJECTOR.films[(n + 1) % PROJECTOR.films.length])
      if (show > 0.001) {
        loopFilm(film, true)
        wantFilm(film, w * show)
      } else if (ph > PROJECTOR.on + PROJECTOR.fade && s.rewound !== n) {
        s.rewound = n
        rewindFilm(film)
      }
    }

    // the lamp
    const r = PROJECTOR.lampSize / (held ? OVERSCAN : 1)
    const lu = lm.uniforms
    ;(lu.uP0.value as Vector2).set(lx - r / aspect, ly - r)
    ;(lu.uP1.value as Vector2).set(lx + r / aspect, ly - r)
    ;(lu.uP2.value as Vector2).set(lx + r / aspect, ly + r)
    ;(lu.uP3.value as Vector2).set(lx - r / aspect, ly + r)
    lu.uWeight.value = w
    lu.uOn.value = beamOn
    lu.uTime.value = now

    // the screen: above the title, in the room between the slate line and the heading, 16:9, centred over it
    const L = heroState.layout
    const top = L.slate + 0.025
    const bottom = L.titleTop - 0.035
    const left = L.edge
    const roomW = Math.max(0.05, L.titleRight - left)
    const roomH = Math.max(0.05, bottom - top)
    let hf = roomH * PROJECTOR.fill
    let wf = (hf * (16 / 9)) / aspect
    if (wf > roomW * PROJECTOR.fill) {
      wf = roomW * PROJECTOR.fill
      hf = (wf * aspect * 9) / 16
    }
    const cx = left + roomW * 0.46
    const cy = (top + bottom) / 2
    const x0 = (cx - wf / 2) * 2 - 1
    const x1 = (cx + wf / 2) * 2 - 1
    const y0 = 1 - (cy + hf / 2) * 2
    const y1 = 1 - (cy - hf / 2) * 2
    const su = sm.uniforms
    ;(su.uP0.value as Vector2).set(x0, y0)
    ;(su.uP1.value as Vector2).set(x1, y0)
    ;(su.uP2.value as Vector2).set(x1, y1)
    ;(su.uP3.value as Vector2).set(x0, y1)
    const pic = filmPicture(film)
    if (su.uMap.value !== pic) {
      su.uMap.value = pic
      su.uHasMap.value = pic ? 1 : 0
    }
    su.uScreen.value = (wf * size.width) / Math.max(1, hf * size.height)
    su.uFilm.value = HERO_FILMS.find((f) => f.id === film)?.aspect ?? 16 / 9
    su.uWeight.value = w * show * PROJECTOR.light * (pic ? 1 : 0)
    su.uTime.value = now

    // the beam: from the lamp to the two corners of the screen outermost as the lamp sees them
    const cs: [number, number][] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
    const ang = cs.map(([x, y]) => Math.atan2(y - ly, (x - lx) * aspect))
    let lo = 0
    let hi = 0
    ang.forEach((a, i) => {
      if (a < ang[lo]) lo = i
      if (a > ang[hi]) hi = i
    })
    const bu = bm.uniforms
    ;(bu.uP0.value as Vector2).set(lx, ly)
    ;(bu.uP1.value as Vector2).set(lx, ly)
    ;(bu.uP2.value as Vector2).set(cs[lo][0], cs[lo][1])
    ;(bu.uP3.value as Vector2).set(cs[hi][0], cs[hi][1])
    bu.uWeight.value = w * beamOn * PROJECTOR.beam
    bu.uReach.value = reach * 1.06
    bu.uTime.value = now
  })

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geo} renderOrder={-3.6} frustumCulled={false}>
        <shaderMaterial ref={beam} vertexShader={PROJ_VERT} fragmentShader={PROJ_BEAM_FRAG} uniforms={beamUniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
      </mesh>
      <mesh geometry={geo} renderOrder={-3.5} frustumCulled={false}>
        <shaderMaterial ref={screen} vertexShader={PROJ_VERT} fragmentShader={FILM_FRAG} defines={{ ERA: 2, PROJECTED: 1 }} uniforms={screenUniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
      </mesh>
      <mesh geometry={geo} renderOrder={-3.4} frustumCulled={false}>
        <shaderMaterial ref={lamp} vertexShader={PROJ_VERT} fragmentShader={PROJ_LAMP_FRAG} uniforms={lampUniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}
