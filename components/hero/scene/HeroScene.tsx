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
  AdditiveBlending, BufferAttribute, BufferGeometry, DataTexture, FloatType, NearestFilter, NormalBlending, PerspectiveCamera,
  PlaneGeometry, RGBAFormat, TubeGeometry, Vector3, type ShaderMaterial,
} from 'three'
import { heroState, storyAt } from '@/components/hero/state'
import { FLOW, FOV, LOGO_BOX, QUALITY, STARS, TUBE, VIEW, type Quality } from '@/components/hero/scene/numbers'
import { cameraAt, LINE, LINE_LENGTH, live, makeView } from '@/components/hero/scene/rig'
import {
  FLOW_FRAG, FLOW_VERT, LINE_CORE_FRAG, LINE_HALO_FRAG, LINE_VERT, SKY_FRAG, SKY_VERT, STAR_FRAG, STAR_VERT, STREAK_FRAG, STREAK_VERT,
} from '@/components/hero/scene/shaders'
import { Station } from '@/components/hero/scene/Station'
import { hsl, readTheme, releaseFootage, setFootagePlaying, softTexture, uploads, type HeroSources, type HeroTheme } from '@/components/hero/scene/textures'

/** A seeded random, so the stars lie the same way on every visit (and in the posters). */
function seeded(seed: number) {
  let s = seed
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280)
}
const damp = (from: number, to: number, speed: number, dt: number) => from + (to - from) * Math.min(1, dt * speed)

// ── THE THEME, LIVE ─────────────────────────────────────────────────────────

function useHeroTheme() {
  const [theme, setTheme] = React.useState<HeroTheme>(() => readTheme())
  React.useEffect(() => {
    const mo = new MutationObserver(() => setTheme(readTheme()))
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
    }),
    [theme],
  )
  const streakUniforms = React.useMemo(
    () => ({ uVel: { value: new Vector3() }, uStretch: { value: 0.05 }, uColor: { value: theme.dark ? hsl(40, 60, 88) : theme.ink.clone() }, uOpacity: { value: theme.dark ? 0.55 : 0.25 } }),
    [theme],
  )
  const starMat = React.useRef<ShaderMaterial>(null)
  const streakMat = React.useRef<ShaderMaterial>(null)
  useFrame(({ size, viewport, camera }) => {
    if (starMat.current) {
      starMat.current.uniforms.uTime.value = live.time
      starMat.current.uniforms.uPixel.value = pixelScale(size.height, viewport.dpr, (camera as PerspectiveCamera).fov)
    }
    if (streakMat.current) (streakMat.current.uniforms.uVel.value as Vector3).copy(live.velocity)
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

// ── THE DEEP SKY: THE SPACE BEHIND EVERY SPACE ──────────────────────────────

function DeepSky({ theme }: { theme: HeroTheme }) {
  const geo = React.useMemo(() => new PlaneGeometry(1, 1, 96, 60), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const mat = React.useRef<ShaderMaterial>(null)
  const uniforms = React.useMemo(() => {
    const a = theme.dark ? hsl(226, 52, 13) : hsl(40, 70, 92)
    const b = theme.dark ? hsl(252, 40, 7) : hsl(214, 50, 94)
    return {
      uA: { value: a }, uB: { value: b }, uA2: { value: a }, uB2: { value: b }, uAccent: { value: theme.dark ? hsl(36, 55, 20) : hsl(40, 80, 86) },
      uFace: { value: 0 }, uWeight: { value: 1 }, uStrength: { value: theme.dark ? 0.6 : 0.5 }, uTime: { value: 0 }, uSeed: { value: 3.3 },
    }
  }, [theme])
  useFrame(() => {
    if (mat.current) mat.current.uniforms.uTime.value = live.time
  })
  const [x, y, z] = LOGO_BOX.center
  return (
    <mesh geometry={geo} position={[x, y, z - 160]} scale={[640, 380, 1]} renderOrder={-20} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={SKY_VERT} fragmentShader={SKY_FRAG} uniforms={uniforms} transparent depthWrite={false} depthTest={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
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
    () => ({ uTime: { value: 0 }, uLength: { value: LINE_LENGTH }, uSpacing: { value: TUBE.pulse.spacing }, uSpeed: { value: TUBE.pulse.speed }, uHead: { value: 0 }, uHeadOn: { value: 0 } }),
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
  useFrame((_, dt) => {
    for (const m of [core.current, halo.current]) {
      if (!m) continue
      m.uniforms.uTime.value = live.time
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
  const rig = React.useRef({ view: makeView(), prev: new Vector3(), has: false, target: { x: 0, y: 0, on: 0 }, shift: [NaN, NaN, NaN, NaN] })

  React.useEffect(() => {
    const r = rig.current
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      r.target.x = (e.clientX / window.innerWidth) * 2 - 1
      r.target.y = -((e.clientY / window.innerHeight) * 2 - 1)
      r.target.on = 1
    }
    const leave = () => void (r.target.on = 0)
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
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
    const place = storyAt(heroState.current)
    live.place = place
    const v = r.view
    cameraAt(place, tall, aspect, v)

    // the pointer: the camera leans with it a little (not under reduced motion)
    const k = heroState.reduced ? 0 : VIEW.pointer.damping
    const p = live.pointer
    p.x = k ? damp(p.x, r.target.x, k, d) : 0
    p.y = k ? damp(p.y, r.target.y, k, d) : 0
    p.on = damp(p.on, r.target.on, 4, d)
    const reach = v.pos.distanceTo(v.look) / 25
    v.pos.x += p.x * VIEW.pointer.x * reach * p.on
    v.pos.y += p.y * VIEW.pointer.y * reach * p.on

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
      <DeepSky theme={theme} />
      <Stars theme={theme} quality={quality} />
      <Line theme={theme} />
      <Flow theme={theme} quality={quality} />
      {STATIONS.map((id) => (
        // every station's pictures start loading at once, in the order of the journey; they reach the GPU one a frame
        <Station key={id} id={id} theme={theme} sources={sources} soft={soft} anisotropy={anisotropy} tall={tall} maxWidth={maxWidth} armed />
      ))}
    </>
  )
}
