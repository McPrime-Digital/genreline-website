'use client'
/**
 * THE SCENE: the Genreline logo's line through deep space, its three spaces
 * as stations along it — Crew, Client (turning to Stakeholders), the Suite —
 * each in its own light, ringed by its screens and tools, with stars that
 * streak as the camera rides the line and particles that stream along it and
 * part around the visitor's pointer.
 *
 * It renders inside <HeroCanvas>. Everything that moves reads the shared
 * timeline (heroState, live) in the frame loop; nothing here re-renders on
 * scroll.
 */
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Color, DataTexture, FloatType, NearestFilter, NormalBlending, PerspectiveCamera,
  PlaneGeometry, RGBAFormat, TubeGeometry, Vector2, Vector3, Vector4, type ShaderMaterial,
} from 'three'
import { heroState, shotWeight, storyAt } from '@/components/hero/state'
import { FLOW, FOV, LOGO_BOX, POINTER, QUALITY, STARS, TUBE, type Quality } from '@/components/hero/scene/numbers'
import { cameraAt, LINE, LINE_LENGTH, live, makeView, readyView } from '@/components/hero/scene/rig'
import {
  FLOW_FRAG, FLOW_VERT, GALAXY_FRAG, GALAXY_VERT, LINE_CORE_FRAG, LINE_HALO_FRAG, LINE_VERT, METEOR_FRAG, METEOR_VERT, SKYOBJ_FRAG, SKYOBJ_VERT, STAR_FRAG, STAR_VERT, STREAK_FRAG, STREAK_VERT,
} from '@/components/hero/scene/shaders'
import { SKIES, skyMotion, universe, updateUniverse, WARP, type SkyMotion, type Universe } from '@/components/hero/scene/universe'
import { Station } from '@/components/hero/scene/Station'
import { hsl, readTheme, releaseFootage, setFootagePlaying, softTexture, uploads, type HeroSources, type HeroTheme } from '@/components/hero/scene/textures'
import { TitleProjector } from '@/components/hero/scene/projector'
import { easeWatching } from '@/components/hero/scene/cinema'
import { directFilms, releaseFilms } from '@/components/hero/scene/films'

/** A seeded random, so the stars lie the same way on every visit (and in the posters). */
function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280)
}
const damp = (from: number, to: number, speed: number, dt: number) => from + (to - from) * Math.min(1, dt * speed)

// ── THE THEME, LIVE ─────────────────────────────────────────────────────────

/** What makes a theme this theme: its darkness and its colours (a new object for the same theme is no change). */
const themeKey = (t: HeroTheme) => [t.dark, t.background, t.core, t.glow, t.ink].map((v) => (typeof v === 'boolean' ? v : v.getHexString())).join('|')

function useHeroTheme() {
  const [theme, setTheme] = React.useState<HeroTheme>(() => readTheme())
  React.useEffect(() => {
    // Only a real change of theme rebuilds the scene's materials and pictures. The root's style is touched
    // by others (ScrollTrigger sets its scroll-behavior on every refresh, as the tour starts): answering
    // each touch with a new theme reloaded every screen's picture at the click — a burst of decoding that
    // stalled the tour's first frames.
    let key = themeKey(readTheme())
    const mo = new MutationObserver(() => {
      const next = readTheme()
      const k = themeKey(next)
      if (k === key) return
      key = k
      setTheme(next)
    })
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

function Atmosphere({ theme }: { theme: HeroTheme }) {
  const get = useThree((s) => s.get)
  React.useEffect(() => {
    const { gl, invalidate } = get()
    gl.setClearColor(theme.background, 1)
    invalidate()
  }, [get, theme])
  return null
}

/** Pixels per world unit at depth 1, for sizing points the way the lens would. */
function pixelScale(height: number, dpr: number, fov: number) {
  return (height * dpr) / (2 * Math.tan(((fov / 2) * Math.PI) / 180))
}

// ── THE STARS, AND THEIR STREAKS ON A JOURNEY ───────────────────────────────

const SPAN = STARS.box.max[2] - STARS.box.min[2]
const WARP_VEL = new Vector3()
const SIDE = new Vector3()
/** The readying for the tour: how long the camera's move takes in, and back out (seconds). */
const READY = { in: 1.2, out: 0.9 } as const
/** This frame's change: how each sky moves, and how much of each shows (universe.ts skyMotion). */
const MOTION: SkyMotion = { a: [0, 0, 1, 0], b: [0, 0, 1, 0], wa: 1, wb: 0 }

function Stars({ theme, quality }: { theme: HeroTheme; quality: Quality }) {
  const geos = React.useMemo(() => {
    const rnd = seeded(4242)
    const n = STARS.count
    const pos = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const phase = new Float32Array(n)
    const tint = new Float32Array(n)
    const { min, max } = STARS.box
    for (let i = 0; i < n; i++) {
      pos[i * 3] = min[0] + rnd() * (max[0] - min[0])
      pos[i * 3 + 1] = min[1] + rnd() * (max[1] - min[1])
      pos[i * 3 + 2] = min[2] + rnd() * (max[2] - min[2])
      const big = rnd()
      size[i] = STARS.size * (0.45 + big * big * big * 2.2)
      phase[i] = rnd()
      tint[i] = rnd()
    }
    const stars = new BufferGeometry()
    stars.setAttribute('position', new BufferAttribute(pos, 3))
    stars.setAttribute('aSize', new BufferAttribute(size, 1))
    stars.setAttribute('aPhase', new BufferAttribute(phase, 1))
    stars.setAttribute('aTint', new BufferAttribute(tint, 1))
    // the streaks: two ends per star, for the first few hundred stars
    const m = STARS.streaks
    const spos = new Float32Array(m * 6)
    const end = new Float32Array(m * 2)
    for (let i = 0; i < m; i++) {
      for (let k = 0; k < 2; k++) {
        spos.set(pos.subarray(i * 3, i * 3 + 3), (i * 2 + k) * 3)
        end[i * 2 + k] = k
      }
    }
    const streaks = new BufferGeometry()
    streaks.setAttribute('position', new BufferAttribute(spos, 3))
    streaks.setAttribute('aEnd', new BufferAttribute(end, 1))
    return { stars, streaks }
  }, [])
  React.useEffect(() => () => { geos.stars.dispose(); geos.streaks.dispose() }, [geos])
  React.useEffect(() => geos.stars.setDrawRange(0, QUALITY[quality].stars), [geos, quality])

  const starUniforms = React.useMemo(
    () => ({
      uTime: { value: 0 }, uPixel: { value: 600 }, uWarm: { value: hsl(38, 90, 78) }, uCool: { value: hsl(212, 70, 80) },
      uInk: { value: theme.ink.clone() }, uDark: { value: theme.dark ? 1 : 0 }, uOpacity: { value: theme.dark ? 0.95 : 0.4 },
      uTravelled: { value: 0 }, uField: { value: [STARS.box.min[2], STARS.box.max[2]] }, uAspect: { value: 1 },
      // a change of sky runs across the stars too (CHANGE): the two skies' own stars, how much of each, the turn
      uRoll: { value: 0 }, uStars: { value: new Vector2(11, 11) }, uShow: { value: new Vector2(1, 0) }, uK: { value: 0 }, uStyle: { value: 0 }, uDir: { value: new Vector2(1, 0) },
    }),
    [theme],
  )
  const streakUniforms = React.useMemo(
    () => ({
      uVel: { value: new Vector3() }, uStretch: { value: 0.05 }, uColor: { value: theme.dark ? hsl(40, 60, 88) : theme.ink.clone() }, uOpacity: { value: theme.dark ? 0.55 : 0.25 },
      uTravelled: { value: 0 }, uField: { value: [STARS.box.min[2], STARS.box.max[2]] }, uRoll: { value: 0 },
    }),
    [theme],
  )
  const starMat = React.useRef<ShaderMaterial>(null)
  const streakMat = React.useRef<ShaderMaterial>(null)
  useFrame(({ size, viewport, camera }) => {
    if (starMat.current) {
      // the stars keep still under the pointer: only the logo, its particles and the film things answer it
      const u = starMat.current.uniforms
      u.uTime.value = live.time
      u.uPixel.value = pixelScale(size.height, viewport.dpr, (camera as PerspectiveCamera).fov)
      u.uTravelled.value = universe.travelled % SPAN
      u.uAspect.value = live.aspect
      const { from, to, k } = universe
      skyMotion(MOTION)
      u.uRoll.value = to ? from.roll + (to.roll - from.roll) * k : from.roll
      ;(u.uStars.value as Vector2).set(from.stars, to ? to.stars : from.stars)
      ;(u.uShow.value as Vector2).set(MOTION.wa, MOTION.wb)
      u.uK.value = to ? k : 0
      u.uStyle.value = universe.style
      ;(u.uDir.value as Vector2).set(universe.dir[0], universe.dir[1])
    }
    if (streakMat.current) {
      // the camera's own velocity, and the universe streaming past on a journey between galaxies
      const u = streakMat.current.uniforms
      ;(u.uVel.value as Vector3).copy(live.velocity).add(WARP_VEL.set(0, 0, -universe.warp * WARP.speed))
      // a whip pan: the stars streak sideways with it
      if (universe.sweep[0] || universe.sweep[1]) {
        SIDE.setFromMatrixColumn(camera.matrixWorld, 0).multiplyScalar(universe.sweep[0] * WARP.speed * 1.6)
        ;(u.uVel.value as Vector3).add(SIDE)
        SIDE.setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(universe.sweep[1] * WARP.speed * 1.6)
        ;(u.uVel.value as Vector3).add(SIDE)
      }
      u.uTravelled.value = universe.travelled % SPAN
      const { from, to, k } = universe
      u.uRoll.value = to ? from.roll + (to.roll - from.roll) * k : from.roll
    }
  })
  return (
    <>
      <points geometry={geos.stars} frustumCulled={false} renderOrder={-4}>
        <shaderMaterial ref={starMat} vertexShader={STAR_VERT} fragmentShader={STAR_FRAG} uniforms={starUniforms} transparent depthWrite={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
      </points>
      {/* always mounted (built once, up front); a quality without streaks just hides them */}
      <lineSegments geometry={geos.streaks} frustumCulled={false} renderOrder={-3} visible={QUALITY[quality].streaks}>
        <shaderMaterial ref={streakMat} vertexShader={STREAK_VERT} fragmentShader={STREAK_FRAG} uniforms={streakUniforms} transparent depthWrite={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
      </lineSegments>
    </>
  )
}

// ── THE DEEP SKY: THE QUIET SKY BEHIND EVERY SPACE ──────────────────────────

/** The deep sky's plane: far behind the logo, wider than any shot sees. */
const SKY = { z: -162, scale: [640, 380] as const }
const SKY_PLANE_Z = LOGO_BOX.center[2] + SKY.z

/** Where the camera's gaze meets the deep sky (world x, y), for the changes to run about. */
function gazeOnSky(camera: PerspectiveCamera, out: Vector3) {
  camera.getWorldDirection(out)
  const t = (SKY_PLANE_Z - camera.position.z) / (Math.abs(out.z) > 1e-4 ? out.z : -1e-4)
  return out.multiplyScalar(t).add(camera.position)
}
const GAZE = new Vector3()
const c3 = (v: readonly number[]) => hsl(v[0], v[1], v[2])
/** Each sky's five colours, in the shader's order: the nebula's two, its accent, the Milky Way's core and edge. */
const SKY_COLORS = SKIES.map((g) => [c3(g.a), c3(g.b), c3(g.accent), c3(g.band), c3(g.edge)])

/**
 * The deep sky (universe.ts, shaders.ts GALAXY_*): a quiet nebula and a faint Milky Way — two at once during
 * a change, the leaving one and the arriving one, moved and masked by the change across the whole sky.
 */
function DeepSky() {
  const geo = React.useMemo(() => new PlaneGeometry(1, 1, 128, 76), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const mat = React.useRef<ShaderMaterial>(null)
  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 }, uCentre: { value: new Vector2(0.5, 0.5) }, uSkyAspect: { value: SKY.scale[0] / SKY.scale[1] },
      uSA: { value: new Vector4() }, uSB: { value: new Vector4() }, uTA: { value: new Vector4(0, 0, 1, 0) }, uTB: { value: new Vector4(0, 0, 1, 0) },
      uPA: { value: new Vector4() }, uPB: { value: new Vector4() }, uNeb: { value: new Vector2(1, 1) },
      uColA: { value: SKY_COLORS[0].map((c) => c.clone()) }, uColB: { value: SKY_COLORS[0].map((c) => c.clone()) },
      uWA: { value: 1 }, uWB: { value: 0 }, uStrength: { value: 0.72 }, uMilky: { value: 1.1 }, uRes: { value: new Vector2(1, 1) },
      uK: { value: 0 }, uStyle: { value: 0 }, uDir: { value: new Vector2(1, 0) },
    }),
    [],
  )
  const [x, y] = LOGO_BOX.center
  useFrame(({ camera, gl }) => {
    const m = mat.current
    if (!m) return
    const u = m.uniforms
    const { from, to, k } = universe
    const put = (sky: Universe, s: Vector4, p: Vector4, col: Color[]) => {
      const look = SKIES[sky.sky]
      s.set(sky.seed, sky.angle, sky.width, look.milky)
      p.set(sky.nebAt[0], sky.nebAt[1], sky.bandAt[0], sky.bandAt[1])
      SKY_COLORS[sky.sky].forEach((c, i) => col[i].copy(c))
    }
    put(from, u.uSA.value as Vector4, u.uPA.value as Vector4, u.uColA.value as Color[])
    put(to ?? from, u.uSB.value as Vector4, u.uPB.value as Vector4, u.uColB.value as Color[])
    ;(u.uNeb.value as Vector2).set(SKIES[from.sky].nebula, SKIES[(to ?? from).sky].nebula)
    skyMotion(MOTION)
    ;(u.uTA.value as Vector4).set(...MOTION.a)
    ;(u.uTB.value as Vector4).set(...MOTION.b)
    u.uWA.value = MOTION.wa
    u.uWB.value = MOTION.wb
    u.uK.value = to ? k : 0
    u.uStyle.value = universe.style
    ;(u.uDir.value as Vector2).set(universe.dir[0], universe.dir[1])
    u.uTime.value = live.time
    gl.getDrawingBufferSize(u.uRes.value as Vector2)
    const g = gazeOnSky(camera as PerspectiveCamera, GAZE)
    ;(u.uCentre.value as Vector2).set((g.x - x) / SKY.scale[0] + 0.5, (g.y - y) / SKY.scale[1] + 0.5)
  })
  return (
    <mesh geometry={geo} position={[x, y, SKY_PLANE_Z]} scale={[SKY.scale[0], SKY.scale[1], 1]} renderOrder={-20} frustumCulled={false}>
      {/* premultiplied light added to the dark: the colour space is done in the shader, per sky */}
      <shaderMaterial ref={mat} vertexShader={GALAXY_VERT} fragmentShader={GALAXY_FRAG} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} premultipliedAlpha />
    </mesh>
  )
}

/** A few bright stars drawn the way a cinematographer's star filter draws them (shaders.ts SKYOBJ_*). */
function SkyObjects() {
  const [x, y] = LOGO_BOX.center
  const geo = React.useMemo(() => {
    const n = 7
    const corner = new Float32Array(n * 8)
    const centre = new Float32Array(n * 12)
    const size = new Float32Array(n * 4)
    const era = new Float32Array(n * 4)
    const look = new Float32Array(n * 16)
    const index: number[] = []
    const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
    const rnd = seeded(913)
    for (let i = 0; i < n; i++) {
      let px = 0
      let py = 0
      do {
        px = -150 + rnd() * 330
        py = -78 + rnd() * 170
      } while (Math.abs(px - x) < 40 && Math.abs(py - y) < 30)
      const sz = 2.8 + rnd() * 2.4
      const lk = [rnd() * Math.PI, 0.5, rnd(), rnd() * 3]
      for (let v = 0; v < 4; v++) {
        corner.set(C[v], (i * 4 + v) * 2)
        centre.set([px, py, SKY_PLANE_Z + 2], (i * 4 + v) * 3)
        size[i * 4 + v] = sz
        era[i * 4 + v] = 0
        look.set(lk, (i * 4 + v) * 4)
      }
      index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 12), 3))
    g.setAttribute('aCorner', new BufferAttribute(corner, 2))
    g.setAttribute('aCentre', new BufferAttribute(centre, 3))
    g.setAttribute('aSize', new BufferAttribute(size, 1))
    g.setAttribute('aEra', new BufferAttribute(era, 1))
    g.setAttribute('aLook', new BufferAttribute(look, 4))
    g.setIndex(index)
    return g
  }, [x, y])
  React.useEffect(() => () => geo.dispose(), [geo])
  const uniforms = React.useMemo(() => ({ uEraW: { value: new Vector4(1, 0, 0, 0) }, uEraZoom: { value: new Vector4(1, 1, 1, 1) }, uZoomCentre: { value: new Vector3() }, uTime: { value: 0 }, uOpacity: { value: 0.75 } }), [])
  const mat = React.useRef<ShaderMaterial>(null)
  useFrame(() => {
    if (mat.current) mat.current.uniforms.uTime.value = live.time
  })
  return (
    <mesh geometry={geo} frustumCulled={false} renderOrder={-18}>
      <shaderMaterial ref={mat} vertexShader={SKYOBJ_VERT} fragmentShader={SKYOBJ_FRAG} defines={{ KIND: 1 }} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
    </mesh>
  )
}

// ── SHOOTING STARS ──────────────────────────────────────────────────────────

/** A few meteors at infinity (shaders.ts METEOR_*): three slots, each on its own irregular rhythm. */
function Meteors() {
  const geo = React.useMemo(() => {
    const n = 3
    const corner = new Float32Array(n * 4 * 2)
    const slot = new Float32Array(n * 4)
    const index: number[] = []
    const C = [[0, -1], [1, -1], [1, 1], [0, 1]]
    for (let i = 0; i < n; i++) {
      for (let v = 0; v < 4; v++) {
        corner.set(C[v], (i * 4 + v) * 2)
        slot[i * 4 + v] = i
      }
      index.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 4 * 3), 3))
    g.setAttribute('aCorner', new BufferAttribute(corner, 2))
    g.setAttribute('aSlot', new BufferAttribute(slot, 1))
    g.setIndex(index)
    return g
  }, [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const mat = React.useRef<ShaderMaterial>(null)
  const uniforms = React.useMemo(() => ({ uTime: { value: 0 }, uAspect: { value: 1 }, uOn: { value: 1 }, uColor: { value: hsl(44, 80, 90) }, uOpacity: { value: 0.85 } }), [])
  useFrame(({ size }) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uTime.value = live.time
    m.uniforms.uAspect.value = size.width / size.height
    m.uniforms.uOn.value = heroState.reduced ? 0 : 1
  })
  return (
    <mesh geometry={geo} frustumCulled={false} renderOrder={-12}>
      <shaderMaterial ref={mat} vertexShader={METEOR_VERT} fragmentShader={METEOR_FRAG} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
    </mesh>
  )
}

// ── THE LINE ────────────────────────────────────────────────────────────────

function Line({ theme }: { theme: HeroTheme }) {
  const geos = React.useMemo(
    () => ({
      core: new TubeGeometry(LINE, TUBE.segments, TUBE.core.radius, TUBE.radialSegments, false),
      halo: new TubeGeometry(LINE, Math.round(TUBE.segments / 2), TUBE.halo.radius, TUBE.radialSegments, false),
    }),
    [],
  )
  React.useEffect(() => () => { geos.core.dispose(); geos.halo.dispose() }, [geos])
  const light = React.useMemo(
    () => ({
      uTime: { value: 0 }, uLength: { value: LINE_LENGTH }, uSpacing: { value: TUBE.pulse.spacing }, uSpeed: { value: TUBE.pulse.speed }, uHead: { value: 0 }, uHeadOn: { value: 0 },
      uMask: { value: new Vector4() }, uMaskOn: { value: 0 }, uTrackY: { value: 0.95 }, uTrackOn: { value: 0 }, uTopY: { value: 0.12 }, uRes: { value: new Vector2(1, 1) },
      uPointer: { value: new Vector2(0.5, 0.5) }, uPointerOn: { value: 0 },
    }),
    [],
  )
  const coreUniforms = React.useMemo(
    () => ({ ...light, uRadius: { value: TUBE.core.radius }, uPerDistance: { value: TUBE.core.perDistance }, uColor: { value: theme.core.clone() }, uHot: { value: theme.hot.clone() } }),
    [light, theme],
  )
  const haloUniforms = React.useMemo(
    () => ({ ...light, uRadius: { value: TUBE.halo.radius }, uPerDistance: { value: TUBE.halo.perDistance }, uColor: { value: theme.glow.clone() }, uOpacity: { value: theme.dark ? 0.26 : 0.22 } }),
    [light, theme],
  )
  const core = React.useRef<ShaderMaterial>(null)
  const halo = React.useRef<ShaderMaterial>(null)
  // the line's own clock: it runs faster while the pointer is on the play control
  const clock = React.useRef({ t: 0, boost: 0 })
  useFrame(({ gl }, dt) => {
    const c = clock.current
    const d = heroState.reduced ? 0 : Math.min(dt, 0.1)
    // it quickens under the play control, and — before the tour — as the universe is about to change, through
    // the change and a while after (the owner, 2026-11-06), easing back to its own pace
    c.boost = damp(c.boost, Math.max(heroState.playHover, heroState.tour ? 0 : universe.hurry), 2.2, Math.min(dt, 0.1))
    c.t += d * (1 + c.boost * 3)
    // behind the words on screen the line steps back: the caption of the space on screen, or the close
    // (the core and the halo share these uniforms: written once, through the core's material)
    const u = core.current?.uniforms
    if (live.place && u) {
      const L = heroState.layout
      let on = 0
      const m = u.uMask.value as Vector4
      for (const shot of [1, 2, 3, 4] as const) {
        const w = shotWeight(live.place, shot)
        if (w <= on) continue
        on = w
        const cap = shot === 4 ? { top: L.closeTop, right: L.closeRight } : (L.captions[shot - 1] ?? { top: L.captionTop, right: L.captionRight })
        m.set(Math.max(0, L.edge - 0.01), cap.top - 0.01, cap.right + 0.01, 1)
      }
      u.uMaskOn.value = on
      u.uTrackY.value = L.bottom + 0.012
      u.uTopY.value = L.slate + 0.008
      u.uTrackOn.value = damp(u.uTrackOn.value as number, heroState.tour ? 1 : 0, 4, Math.min(dt, 0.1))
      gl.getDrawingBufferSize(u.uRes.value as Vector2)
    }
    if (u) {
      // the pointer, in the frame's fractions from the bottom left (gl_FragCoord's own)
      ;(u.uPointer.value as Vector2).set(live.pointer.x * 0.5 + 0.5, live.pointer.y * 0.5 + 0.5)
      u.uPointerOn.value = live.pointer.on
    }
    for (const m of [core.current, halo.current]) {
      if (!m) continue
      m.uniforms.uTime.value = c.t
      m.uniforms.uHead.value = live.head
      m.uniforms.uHeadOn.value = damp(m.uniforms.uHeadOn.value, live.headOn, 6, Math.min(dt, 0.1))
    }
  })
  return (
    <group>
      <mesh geometry={geos.halo} renderOrder={4} frustumCulled={false}>
        <shaderMaterial ref={halo} vertexShader={LINE_VERT} fragmentShader={LINE_HALO_FRAG} uniforms={haloUniforms} transparent depthWrite={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
      </mesh>
      <mesh geometry={geos.core} renderOrder={5} frustumCulled={false}>
        <shaderMaterial ref={core} vertexShader={LINE_VERT} fragmentShader={LINE_CORE_FRAG} uniforms={coreUniforms} />
      </mesh>
    </group>
  )
}

/** The line baked for the GPU: 512 points by arc length, with the normal and binormal at each (rows 0–2). */
function bakeLine() {
  const N = 512
  const frames = LINE.computeFrenetFrames(N - 1, false)
  const data = new Float32Array(N * 3 * 4)
  const p = new Vector3()
  for (let i = 0; i < N; i++) {
    LINE.getPointAt(i / (N - 1), p)
    const rows = [p, frames.normals[i], frames.binormals[i]]
    rows.forEach((v, r) => data.set([v.x, v.y, v.z, 1], (r * N + i) * 4))
  }
  const tex = new DataTexture(data, N, 3, RGBAFormat, FloatType)
  tex.minFilter = NearestFilter
  tex.magFilter = NearestFilter
  tex.needsUpdate = true
  return { tex, N }
}

function Flow({ theme, quality }: { theme: HeroTheme; quality: Quality }) {
  const baked = React.useMemo(() => bakeLine(), [])
  React.useEffect(() => () => baked.tex.dispose(), [baked])
  const geo = React.useMemo(() => {
    const rnd = seeded(2600)
    const n = FLOW.count
    const attr = (k: number) => new Float32Array(n * k)
    const pos = attr(3)
    const t = attr(1)
    const speed = attr(1)
    const angle = attr(1)
    const radius = attr(1)
    const size = attr(1)
    for (let i = 0; i < n; i++) {
      t[i] = rnd()
      speed[i] = FLOW.speed[0] + rnd() * (FLOW.speed[1] - FLOW.speed[0])
      angle[i] = rnd() * Math.PI * 2
      // most hug the line; a few wander wide
      const r = rnd()
      radius[i] = 0.12 + Math.pow(r, 2.2) * 1.0
      size[i] = FLOW.size * (0.6 + rnd() * rnd() * 2.2)
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aT', new BufferAttribute(t, 1))
    g.setAttribute('aSpeed', new BufferAttribute(speed, 1))
    g.setAttribute('aAngle', new BufferAttribute(angle, 1))
    g.setAttribute('aRadius', new BufferAttribute(radius, 1))
    g.setAttribute('aSize', new BufferAttribute(size, 1))
    return g
  }, [])
  React.useEffect(() => () => geo.dispose(), [geo])
  React.useEffect(() => geo.setDrawRange(0, QUALITY[quality].flow), [geo, quality])
  const uniforms = React.useMemo(
    () => ({
      uCurve: { value: baked.tex }, uCurveSize: { value: baked.N }, uFlow: { value: 0 }, uTime: { value: 0 }, uSpread: { value: FLOW.radius },
      uPixel: { value: 600 }, uPointer: { value: [0, 0] }, uPointerOn: { value: 0 }, uAspect: { value: 1 },
      uColor: { value: theme.dark ? theme.glow.clone() : theme.core.clone() }, uHot: { value: theme.hot.clone() }, uOpacity: { value: theme.dark ? 0.85 : 0.6 },
    }),
    [baked, theme],
  )
  const mat = React.useRef<ShaderMaterial>(null)
  const flow = React.useRef(0)
  useFrame(({ size, viewport, camera }, dt) => {
    const m = mat.current
    if (!m) return
    // the stream runs faster while the visitor scrolls
    if (!heroState.reduced) flow.current += Math.min(dt, 0.1) * (1 + Math.min(40, Math.abs(heroState.speed) * 260))
    m.uniforms.uFlow.value = flow.current
    m.uniforms.uTime.value = live.time
    m.uniforms.uPixel.value = pixelScale(size.height, viewport.dpr, (camera as PerspectiveCamera).fov)
    m.uniforms.uPointer.value = [live.pointer.x, live.pointer.y]
    m.uniforms.uPointerOn.value = live.pointer.on
    m.uniforms.uAspect.value = size.width / size.height
  })
  return (
    <points geometry={geo} frustumCulled={false} renderOrder={8}>
      <shaderMaterial ref={mat} vertexShader={FLOW_VERT} fragmentShader={FLOW_FRAG} uniforms={uniforms} transparent depthWrite={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
    </points>
  )
}

// ── THE CAMERA ──────────────────────────────────────────────────────────────

function CameraRig() {
  const rig = React.useRef({
    view: makeView(), prev: new Vector3(), has: false, target: { x: 0, y: 0, on: 0 }, shift: [NaN, NaN, NaN, NaN], ready: 0, ready2: makeView(),
    // the readying's own timeline: from where it was, to where it goes, since when (seconds, the page's clock)
    readyFrom: 0, readyTo: 0, readyAt: -1,
  })

  // The pointer — a mouse, or a finger — for the things that answer it (the line, its particles, the
  // film things). The camera itself never follows it: the owner, 2026-11-06, the whole page moving with
  // the mouse "makes it unreal space". A touch holds for a moment after the finger lifts, then fades.
  React.useEffect(() => {
    const r = rig.current
    let lift = 0
    const at = (x: number, y: number) => {
      r.target.x = (x / window.innerWidth) * 2 - 1
      r.target.y = -((y / window.innerHeight) * 2 - 1)
      r.target.on = 1
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') at(e.clientX, e.clientY)
    }
    const touch = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      window.clearTimeout(lift)
      at(t.clientX, t.clientY)
    }
    const untouch = () => {
      window.clearTimeout(lift)
      lift = window.setTimeout(() => void (r.target.on = 0), POINTER.touchHold)
    }
    // (a finger fires pointerleave as it lifts: the touch keeps its own hold instead)
    const leave = (e: PointerEvent) => void (e.pointerType !== 'touch' && (r.target.on = 0))
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('touchstart', touch, { passive: true })
    window.addEventListener('touchmove', touch, { passive: true })
    window.addEventListener('touchend', untouch, { passive: true })
    window.addEventListener('touchcancel', untouch, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.clearTimeout(lift)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('touchstart', touch)
      window.removeEventListener('touchmove', touch)
      window.removeEventListener('touchend', untouch)
      window.removeEventListener('touchcancel', untouch)
      document.documentElement.removeEventListener('pointerleave', leave)
    }
  }, [])

  useFrame(({ camera, size }, dt) => {
    const r = rig.current
    const d = Math.min(dt, 0.1)
    if (!heroState.reduced) live.time += d
    const aspect = size.width / size.height
    const tall = aspect < FOV.tallBelowAspect
    live.tall = tall
    live.aspect = aspect
    const place = storyAt(heroState.current)
    live.place = place
    updateUniverse(place, live.time, d)
    const v = r.view
    cameraAt(place, tall, aspect, v)
    // the tour taken: the stage readies — the title's words step aside and the camera moves round to give
    // the logo the whole stage, then waits for the scroll. A timed move on an ease-in-out (it starts gently
    // and lands cleanly), not a chase that lurches off and then crawls; a cut under reduced motion.
    const goal = heroState.tour ? 1 : 0
    const clock = performance.now() / 1000
    if (goal !== r.readyTo) {
      r.readyFrom = r.ready
      r.readyTo = goal
      r.readyAt = clock
    }
    if (heroState.reduced) r.ready = goal
    else {
      const k = Math.min(1, Math.max(0, (clock - r.readyAt) / (goal ? READY.in : READY.out)))
      r.ready = r.readyFrom + (r.readyTo - r.readyFrom) * k * k * k * (k * (k * 6 - 15) + 10)
    }
    live.readied = r.ready
    const atTitle = shotWeight(place, 0) * r.ready
    if (atTitle > 0.001) {
      const ready = r.ready2
      readyView(tall, aspect, ready)
      v.pos.lerp(ready.pos, atTitle)
      v.look.lerp(ready.look, atTitle)
      v.fov += (ready.fov - v.fov) * atTitle
      v.shift[0] += (ready.shift[0] - v.shift[0]) * atTitle
      v.shift[1] += (ready.shift[1] - v.shift[1]) * atTitle
    }

    // the pointer, eased (under reduced motion it jumps, and nothing it moves travels on its own)
    const p = live.pointer
    // (arriving from nowhere — a first touch, the mouse coming back — it starts where it lands)
    const k = heroState.reduced || p.on < 0.02 ? 0 : POINTER.damping
    p.x = k ? damp(p.x, r.target.x, k, d) : r.target.x
    p.y = k ? damp(p.y, r.target.y, k, d) : r.target.y
    p.on = heroState.reduced ? r.target.on : damp(p.on, r.target.on, 5, d)

    camera.position.copy(v.pos)
    camera.lookAt(v.look)
    const lens = camera as PerspectiveCamera
    const w = size.width
    const h = size.height
    if (lens.fov !== v.fov || r.shift[0] !== v.shift[0] || r.shift[1] !== v.shift[1] || r.shift[2] !== w || r.shift[3] !== h) {
      lens.fov = v.fov
      lens.setViewOffset(w, h, -v.shift[0] * w, v.shift[1] * h, w, h)
      lens.updateProjectionMatrix()
      r.shift = [v.shift[0], v.shift[1], w, h]
    }

    // its velocity, for the streaks (zero on the first frame and after a cut)
    if (r.has && d > 0) {
      const vx = (v.pos.x - r.prev.x) / d
      const vy = (v.pos.y - r.prev.y) / d
      const vz = (v.pos.z - r.prev.z) / d
      const big = Math.hypot(vx, vy, vz) > 400 || heroState.reduced
      live.velocity.set(big ? 0 : damp(live.velocity.x, vx, 10, d), big ? 0 : damp(live.velocity.y, vy, 10, d), big ? 0 : damp(live.velocity.z, vz, 10, d))
    }
    r.prev.copy(v.pos)
    r.has = true
  }, -1)
  return null
}

// ── UPLOADS ─────────────────────────────────────────────────────────────────

/** Hands the queued pictures to the GPU, one a frame, once the scene is up (textures.ts uploadSoon). */
function Uploader() {
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  React.useEffect(() => {
    uploads.wake = () => invalidate()
    return () => {
      uploads.wake = () => {}
      uploads.queue.length = 0
    }
  }, [invalidate])
  useFrame(() => {
    if (!live.ready || uploads.queue.length === 0) return
    const next = uploads.queue.shift()!
    gl.initTexture(next.texture)
    // a decoded bitmap's pixels now live on the GPU: let the browser free its copy
    const img = next.texture.image as { close?: () => void } | null
    if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) img.close?.()
    live.busyUntil = performance.now() + 150
    next.done()
    if (uploads.queue.length) invalidate()
  })
  return null
}

// ── THE PROJECTIONIST ───────────────────────────────────────────────────────

/** Once a frame, after every cinema has asked for its film: the nearest plays, the others wait (films.ts). */
function Projectionist() {
  useFrame((_, dt) => {
    easeWatching(Math.min(dt, 0.1))
    directFilms()
  })
  React.useEffect(() => () => releaseFilms(), [])
  return null
}

// ── THE WHOLE SCENE ─────────────────────────────────────────────────────────

const STATIONS = ['crew', 'client', 'suite'] as const

export function HeroScene({ sources, quality, reduced }: { sources: HeroSources; quality: Quality; reduced: boolean }) {
  const theme = useHeroTheme()
  const gl = useThree((s) => s.gl)
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const anisotropy = React.useMemo(() => Math.min(8, gl.capabilities.getMaxAnisotropy()), [gl])
  const soft = React.useMemo(() => softTexture(), [])
  React.useEffect(() => () => soft.dispose(), [soft])
  const tall = size.width / size.height < FOV.tallBelowAspect
  // a screen's picture no wider than it can be shown, even close up, and no wider than the quality allows
  // (fixed at the starting quality, so a step down never reloads pictures)
  const [startQuality] = React.useState(quality)
  const maxWidth = Math.round(Math.min(QUALITY[startQuality].texture, Math.max(640, size.width * Math.min(window.devicePixelRatio || 1, 1.5) * 0.5)))


  React.useEffect(() => {
    heroState.invalidate = () => invalidate()
    return () => {
      heroState.invalidate = () => {}
    }
  }, [invalidate])
  React.useEffect(() => {
    heroState.reduced = reduced
    setFootagePlaying(!reduced)
    invalidate()
  }, [reduced, invalidate])
  React.useEffect(
    () => () => {
      document.body.style.cursor = ''
      releaseFootage()
    },
    [],
  )

  return (
    <>
      <Atmosphere theme={theme} />
      <CameraRig />
      <Uploader />
      <DeepSky />
      <SkyObjects />
      <TitleProjector />
      <Meteors />
      <Stars theme={theme} quality={quality} />
      <Line theme={theme} />
      <Flow theme={theme} quality={quality} />
      {STATIONS.map((id) => (
        // every station's pictures start loading at once, in the order of the journey; they reach the GPU one a frame
        <Station key={id} id={id} theme={theme} sources={sources} soft={soft} anisotropy={anisotropy} tall={tall} maxWidth={maxWidth} armed />
      ))}
      <Projectionist />
    </>
  )
}
