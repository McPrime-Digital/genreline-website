'use client'
/**
 * A STATION — one space on the line: its tile (the logo's glyph), the rings
 * turning round it, its screens gathering round it as the camera arrives,
 * its own sky and its own structure behind it. The Client station turns to
 * its Stakeholders face every three seconds; the Suite is ringed by its tools.
 *
 * Everything moves in the frame loop from the shared timeline (heroState,
 * live); React renders a station once, and again only when the theme or the
 * frame's shape changes.
 */
import * as React from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Float32BufferAttribute, NormalBlending, PlaneGeometry, Vector3, type PerspectiveCamera,
  type Group, type Mesh, type MeshBasicMaterial, type ShaderMaterial, type Sprite, type SpriteMaterial, type Texture,
} from 'three'
import { hero, type HeroPanel } from '@/content/home'
import { heroState, presence, skyWeight } from '@/components/hero/state'
import { CHIPS, FACE, NODES, PANEL, SLOTS, TALL_KEEP, TILE, type Shot, type Vec3 } from '@/components/hero/scene/numbers'
import { live } from '@/components/hero/scene/rig'
import {
  BEAM_FRAG, BEAM_VERT, IRIS_FRAG, IRIS_VERT, MOTE_FRAG, MOTE_VERT, PALACE_FRAG, PALACE_VERT, PANEL_FRAG, PANEL_VERT, PROJECTOR_FRAG, PROJECTOR_VERT, SKY_FRAG, SKY_VERT, STRUCTURE_FRAG, STRUCTURE_VERT,
} from '@/components/hero/scene/shaders'
import { anamorphicTexture, chipTexture, crewReelTexture, decoHaloTexture, focusRingTexture, getScreenTexture, hsl, labelTexture, tileTexture, uploadSoon, type HeroSources, type HeroTheme, type TileKind } from '@/components/hero/scene/textures'

export type StationId = 'crew' | 'client' | 'suite'
const SHOT_OF: Record<StationId, Shot> = { crew: 1, client: 2, suite: 3 }
const ART = { capture: 0, script: 1, boards: 2, frame: 3, workflow: 4, waveform: 5, timeline: 6 } as const

const damp = (from: number, to: number, speed: number, dt: number) => from + (to - from) * Math.min(1, dt * speed)
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const LIFT = new Vector3()

/** The Client face's turn, for an element `delay` seconds behind the tile: its angle, which face shows, and (reduced motion) its fade. */
function faceTurn(delay: number) {
  const elapsed = (performance.now() - heroState.faceAt) / 1000 - delay
  const f = clamp01(elapsed / FACE.turn)
  const showing = f >= 0.5 ? heroState.face : ((1 - heroState.face) as 0 | 1)
  if (f >= 1) return { angle: 0, showing: heroState.face, fade: 1, turning: false }
  const angle = f < 0.5 ? f * Math.PI : (f - 1) * Math.PI
  return { angle, showing, fade: Math.abs(1 - 2 * f), turning: true }
}

// ── THE SKY AND THE STRUCTURE ───────────────────────────────────────────────

type HSL = [number, number, number]
type Palette = { a: HSL; b: HSL; a2?: HSL; b2?: HSL; accent: HSL }
const SKIES: Record<StationId, { dark: Palette; light: Palette }> = {
  // the Crew: tungsten — the warm light of a studio floor
  crew: { dark: { a: [30, 60, 30], b: [14, 46, 13], accent: [40, 70, 42] }, light: { a: [36, 85, 84], b: [26, 70, 91], accent: [40, 80, 74] } },
  // the Client: steel and teal, turning to a deep violet for the Stakeholders
  client: {
    dark: { a: [199, 46, 28], b: [222, 44, 13], a2: [250, 36, 32], b2: [270, 34, 14], accent: [190, 50, 40] },
    light: { a: [200, 70, 86], b: [215, 60, 92], a2: [252, 60, 89], b2: [268, 50, 93], accent: [195, 70, 78] },
  },
  // the Suite: violet and rose, the colours of a grading suite at night
  suite: { dark: { a: [284, 34, 30], b: [326, 36, 14], accent: [40, 70, 42] }, light: { a: [282, 55, 89], b: [330, 55, 92], accent: [40, 80, 76] } },
}

function Sky({ id, theme }: { id: StationId; theme: HeroTheme }) {
  const geo = React.useMemo(() => new PlaneGeometry(1, 1, 96, 60), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const mat = React.useRef<ShaderMaterial>(null)
  const mesh = React.useRef<Mesh>(null)
  const p = theme.dark ? SKIES[id].dark : SKIES[id].light
  const uniforms = React.useMemo(
    () => ({
      uA: { value: hsl(...p.a) }, uB: { value: hsl(...p.b) },
      uA2: { value: hsl(...(p.a2 ?? p.a)) }, uB2: { value: hsl(...(p.b2 ?? p.b)) },
      uAccent: { value: hsl(...p.accent) },
      uFace: { value: 0 }, uWeight: { value: 0 }, uStrength: { value: theme.dark ? 1.25 : 0.75 },
      uTime: { value: 0 }, uSeed: { value: { crew: 1.7, client: 6.3, suite: 11.1 }[id] },
    }),
    [p, id, theme.dark],
  )
  const c = NODES[id]
  useFrame((_, dt) => {
    const m = mat.current
    if (!m || !mesh.current || !live.place) return
    const w = skyWeight(live.place, SHOT_OF[id])
    mesh.current.visible = w > 0.002
    m.uniforms.uWeight.value = w
    m.uniforms.uTime.value = live.time
    m.uniforms.uFace.value = damp(m.uniforms.uFace.value, id === 'client' ? heroState.face : 0, 2.2, Math.min(dt, 0.1))
  })
  return (
    <mesh ref={mesh} geometry={geo} position={[c[0], c[1] + 2, c[2] - 46]} scale={[200, 124, 1]} renderOrder={-10} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={SKY_VERT}
        fragmentShader={SKY_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={theme.dark ? AdditiveBlending : NormalBlending}
      />
    </mesh>
  )
}

const STRUCTURE: Record<StationId, { mode: number; size: [number, number]; at: Vec3; flat: boolean; opacity: [number, number] }> = {
  // the studio floor, below the screens, receding into the distance
  crew: { mode: 0, size: [110, 80], at: [0, -10.5, -14], flat: true, opacity: [0.34, 0.3] },
  // the picture palace's floor, below the screens, the great screen standing at its far side
  client: { mode: 1, size: [110, 80], at: [0, -10.5, -14], flat: true, opacity: [0.4, 0.3] },
  // the cutting room's floor: an edit timeline running to the horizon, below the tools
  suite: { mode: 2, size: [110, 80], at: [0, -10.5, -14], flat: true, opacity: [0.5, 0.3] },
}

function Structure({ id, theme }: { id: StationId; theme: HeroTheme }) {
  const s = STRUCTURE[id]
  const geo = React.useMemo(() => new PlaneGeometry(1, 1), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const mat = React.useRef<ShaderMaterial>(null)
  const mesh = React.useRef<Mesh>(null)
  const uniforms = React.useMemo(
    () => ({
      uSize: { value: [s.size[0], s.size[1]] }, uColor: { value: theme.dark ? theme.glow.clone() : theme.core.clone() },
      uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: theme.dark ? s.opacity[0] : s.opacity[1] }, uFace: { value: 0 },
    }),
    [s, theme],
  )
  const c = NODES[id]
  useFrame((_, dt) => {
    const m = mat.current
    if (!m || !mesh.current || !live.place) return
    const w = presence(live.place, SHOT_OF[id]) * 0.65 + skyWeight(live.place, SHOT_OF[id]) * 0.35
    mesh.current.visible = w > 0.002
    m.uniforms.uWeight.value = w
    m.uniforms.uTime.value = live.time
    if (id === 'client') m.uniforms.uFace.value = damp(m.uniforms.uFace.value, heroState.face, 2.2, Math.min(dt, 0.1))
  })
  return (
    <mesh
      ref={mesh}
      geometry={geo}
      position={[c[0] + s.at[0], c[1] + s.at[1], c[2] + s.at[2]]}
      rotation-x={s.flat ? -Math.PI / 2 : 0}
      scale={[s.size[0], s.size[1], 1]}
      renderOrder={-5}
    >
      <shaderMaterial ref={mat} vertexShader={STRUCTURE_VERT} fragmentShader={STRUCTURE_FRAG} defines={{ MODE: s.mode }} uniforms={uniforms} transparent depthWrite={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
    </mesh>
  )
}

// ── THE TILE AND ITS RINGS ──────────────────────────────────────────────────

function Tile({ id, theme, soft, anisotropy }: { id: StationId; theme: HeroTheme; soft: Texture; anisotropy: number }) {
  const kinds: TileKind[] = id === 'client' ? ['client', 'stakeholders'] : [id]
  const maps = React.useMemo(() => kinds.map((k) => tileTexture(k, theme, anisotropy)), [theme, anisotropy]) // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => () => maps.forEach((m) => m.dispose()), [maps])
  const card = React.useRef<Mesh>(null)
  const cardMat = React.useRef<MeshBasicMaterial>(null)
  const glow = React.useRef<Sprite>(null)
  const hover = React.useRef({ to: 0, now: 0 })
  const showing = React.useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const c = React.useMemo(() => new Vector3(...NODES[id]), [id])
  const shot = SHOT_OF[id]
  const glowBase = theme.dark ? 0.55 : 0.32

  useFrame(({ camera }, dt) => {
    const m = card.current
    if (!m || !live.place) return
    const d = Math.min(dt, 0.1)
    const h = hover.current
    h.now = heroState.reduced ? h.to : damp(h.now, h.to, 10, d)
    const near = presence(live.place, shot)
    // never smaller on screen than a set share of the frame, so the logo reads in the wide shots
    const size = Math.max(TILE.size, camera.position.distanceTo(c) * TILE.minScreen) * (1 + 0.08 * h.now)
    m.quaternion.copy(camera.quaternion)
    let fade = 1
    if (id === 'client') {
      const turn = faceTurn(0)
      if (heroState.reduced) fade = turn.fade
      else m.rotateY(turn.angle)
      if (turn.showing !== showing.current && cardMat.current) {
        showing.current = turn.showing
        cardMat.current.map = maps[turn.showing]
      }
      if (turn.turning) invalidate()
    }
    m.scale.setScalar(size)
    if (cardMat.current) cardMat.current.opacity = fade
    if (glow.current) {
      glow.current.scale.setScalar(size * (2.5 + 0.5 * near + 0.3 * h.now))
      ;(glow.current.material as SpriteMaterial).opacity = Math.min(1, glowBase * (0.8 + 0.6 * near + 0.5 * h.now))
    }
  })

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      hover.current.to = 1
      document.body.style.cursor = 'pointer'
      invalidate()
    },
    onPointerOut: () => {
      hover.current.to = 0
      document.body.style.cursor = ''
      invalidate()
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      heroState.goToShot(shot)
    },
  }

  return (
    <group position={c}>
      <sprite ref={glow} renderOrder={18}>
        <spriteMaterial map={soft} color={theme.dark ? '#ffffff' : theme.core} transparent opacity={glowBase} depthWrite={false} depthTest={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
      </sprite>
      {/* The tile always draws over the line, so the line meets it the way it meets the tile in the logo. */}
      <mesh ref={card} renderOrder={20} {...handlers}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={cardMat} map={maps[0]} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── THE CREW: THE STUDIO ERA ────────────────────────────────────────────────
//
// The soundstage, floating in the night: tungsten lamps above the deck, their beams falling through haze
// into pools on the floor (STRUCTURE mode 0 draws the pools, the tape and the track), dust drifting in
// the light, and a 35 mm reel turning behind the tile.

/** The lamps: across the deck behind the screens, each beam ending in its pool (shaders.ts STRUCTURE 0). */
const CREW_BEAMS = [
  // the lamps hang outside the set and angle in, each beam falling to its pool (x, z), leaning by `tilt`
  { x: -11, z: -11, seed: 1.3, tilt: 0.36 },
  { x: 0, z: -8, seed: 4.7, tilt: 0.1 },
  { x: 11, z: -11, seed: 8.2, tilt: -0.36 },
] as const
const BEAM = { length: 28, floor: -10.5, width: 9.4 } as const
/** A beam's centre, from its pool on the floor up along its tilt. */
const beamCentre = (b: (typeof CREW_BEAMS)[number]): [number, number] => [b.x - Math.sin(b.tilt) * (BEAM.length / 2), BEAM.floor + Math.cos(b.tilt) * (BEAM.length / 2)]

function CrewLights({ theme }: { theme: HeroTheme }) {
  const c = NODES.crew
  const beamGeo = React.useMemo(() => new PlaneGeometry(1, 1, 8, 28), [])
  const motes = React.useMemo(() => {
    const n = 180
    const pos = new Float32Array(n * 3)
    const phase = new Float32Array(n)
    let seed = 77
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
    for (let i = 0; i < n; i++) {
      const b = CREW_BEAMS[i % 3]
      // somewhere along the beam (from the floor up), within its width there
      const along = 0.03 + rnd() * 0.75
      const half = (0.48 - (0.48 - 0.07) * along) * BEAM.width * 0.8
      const across = (rnd() * 2 - 1) * half
      const x = b.x - Math.sin(b.tilt) * along * BEAM.length + Math.cos(b.tilt) * across
      const y = BEAM.floor + Math.cos(b.tilt) * along * BEAM.length + Math.sin(b.tilt) * across
      pos.set([c[0] + x, c[1] + y, c[2] + b.z + (rnd() * 2 - 1) * 1.5], i * 3)
      phase[i] = rnd()
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aPhase', new BufferAttribute(phase, 1))
    return g
  }, [c])
  React.useEffect(() => () => { beamGeo.dispose(); motes.dispose() }, [beamGeo, motes])
  const tungsten = React.useMemo(() => hsl(36, 85, 68), [])
  const beamUniforms = React.useMemo(
    () => CREW_BEAMS.map((b) => ({ uColor: { value: tungsten }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: theme.dark ? 0.22 : 0.1 }, uSeed: { value: b.seed } })),
    [tungsten, theme.dark],
  )
  const moteUniforms = React.useMemo(() => ({ uColor: { value: hsl(40, 90, 82) }, uTime: { value: 0 }, uPixel: { value: 600 }, uWeight: { value: 0 } }), [])
  const beams = React.useRef<(ShaderMaterial | null)[]>([])
  const group = React.useRef<Group>(null)
  const moteMat = React.useRef<ShaderMaterial>(null)
  useFrame(({ size, viewport, camera }) => {
    if (!live.place || !group.current) return
    const w = skyWeight(live.place, 1)
    group.current.visible = w > 0.002
    if (!group.current.visible) return
    for (const m of beams.current) {
      if (!m) continue
      m.uniforms.uWeight.value = w
      m.uniforms.uTime.value = live.time
    }
    const mm = moteMat.current
    if (mm) {
      mm.uniforms.uWeight.value = w
      mm.uniforms.uTime.value = live.time
      mm.uniforms.uPixel.value = (size.height * viewport.dpr) / (2 * Math.tan(((camera as PerspectiveCamera).fov / 2) * (Math.PI / 180)))
    }
  })
  return (
    <group ref={group} visible={false}>
      {CREW_BEAMS.map((b, i) => (
        <mesh key={i} geometry={beamGeo} position={[c[0] + beamCentre(b)[0], c[1] + beamCentre(b)[1], c[2] + b.z]} rotation-z={b.tilt} scale={[BEAM.width, BEAM.length, 1]} renderOrder={-6}>
          <shaderMaterial ref={(el) => void (beams.current[i] = el)} vertexShader={BEAM_VERT} fragmentShader={BEAM_FRAG} uniforms={beamUniforms[i]} transparent depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
      <points geometry={motes} frustumCulled={false} renderOrder={-5}>
        <shaderMaterial ref={moteMat} vertexShader={MOTE_VERT} fragmentShader={MOTE_FRAG} uniforms={moteUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  )
}

/** The reel behind the Crew's tile, turning slowly; nearer, brighter. */
function CrewReel({ theme }: { theme: HeroTheme }) {
  const map = React.useMemo(() => crewReelTexture(theme), [theme])
  React.useEffect(() => () => map.dispose(), [map])
  const mesh = React.useRef<Mesh>(null)
  const mat = React.useRef<MeshBasicMaterial>(null)
  const c = React.useMemo(() => new Vector3(...NODES.crew).add(new Vector3(0, 0, -1.4)), [])
  useFrame(({ camera }) => {
    const m = mesh.current
    if (!m || !live.place) return
    const near = presence(live.place, 1)
    m.quaternion.copy(camera.quaternion)
    m.rotateZ(-live.time * 0.12)
    m.scale.setScalar(9.6 * (0.82 + 0.18 * near))
    if (mat.current) mat.current.opacity = 0.14 + 0.5 * near
  })
  return (
    <mesh ref={mesh} position={c} renderOrder={7}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial ref={mat} map={map} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}

// ── THE CLIENT: THE PICTURE PALACE → PREMIERE NIGHT ─────────────────────────
//
// The great screen behind the tile (PALACE_*), the projector's beam over the audience (PROJECTOR_*),
// the deco floor (STRUCTURE mode 1), a sunburst round the tile; and, as the station turns to its
// Stakeholders face, premiere night: searchlights sweeping the sky behind the screen.

/** The screen's plane, behind the tile, and the projector's lamp, above and in front, off the top of the frame. */
const PALACE = { size: [64, 34] as [number, number], z: -16, lamp: [0, 15, 16] as Vec3, screen: { y: 1.5, hw: 19, hh: 7.95 } } as const

function Palace({ theme }: { theme: HeroTheme }) {
  const c = NODES.client
  const geo = React.useMemo(() => new PlaneGeometry(1, 1), [])
  // the beam: four faces from a small square at the lamp to the screen's edges, divided along their length
  const beamGeo = React.useMemo(() => {
    const [lx, ly, lz] = PALACE.lamp
    const { y, hw, hh } = PALACE.screen
    const near = [[-0.5, -0.4], [0.5, -0.4], [0.5, 0.4], [-0.5, 0.4]]
    const far = [[-hw, y - hh], [hw, y - hh], [hw, y + hh], [-hw, y + hh]]
    const N = 14
    const pos: number[] = []
    const t: number[] = []
    const idx: number[] = []
    for (let f = 0; f < 4; f++) {
      const a = f
      const b = (f + 1) % 4
      const base = pos.length / 3
      for (let i = 0; i <= N; i++) {
        const k = i / N
        for (const corner of [a, b]) {
          pos.push(lx + near[corner][0] + (far[corner][0] - lx - near[corner][0]) * k, ly + near[corner][1] + (far[corner][1] - ly - near[corner][1]) * k, lz + (PALACE.z - lz) * k)
          t.push(k)
        }
      }
      for (let i = 0; i < N; i++) {
        const q = base + i * 2
        idx.push(q, q + 1, q + 3, q, q + 3, q + 2)
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(pos, 3))
    g.setAttribute('aT', new Float32BufferAttribute(t, 1))
    g.setIndex(idx)
    return g
  }, [])
  React.useEffect(() => () => { geo.dispose(); beamGeo.dispose() }, [geo, beamGeo])
  const screenUniforms = React.useMemo(
    () => ({
      uSize: { value: PALACE.size }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.5 }, uFace: { value: 0 },
      uSilver: { value: hsl(214, 30, 86) }, uGold: { value: theme.glow.clone() }, uVelvet: { value: hsl(350, 70, 34) },
    }),
    [theme],
  )
  const beamUniforms = React.useMemo(() => ({ uColor: { value: hsl(210, 40, 88) }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.07 } }), [])
  const screenMat = React.useRef<ShaderMaterial>(null)
  const beamMat = React.useRef<ShaderMaterial>(null)
  const group = React.useRef<Group>(null)
  useFrame((_, dt) => {
    if (!live.place || !group.current) return
    const w = skyWeight(live.place, 2)
    group.current.visible = w > 0.002
    if (!group.current.visible) return
    const sm = screenMat.current
    if (sm) {
      sm.uniforms.uWeight.value = w
      sm.uniforms.uTime.value = live.time
      sm.uniforms.uFace.value = damp(sm.uniforms.uFace.value, heroState.face, 2.2, Math.min(dt, 0.1))
    }
    const bm = beamMat.current
    if (bm) {
      bm.uniforms.uWeight.value = w * presence(live.place, 2)
      bm.uniforms.uTime.value = live.time
    }
  })
  return (
    <group ref={group} position={c} visible={false}>
      <mesh geometry={geo} position={[0, 0, PALACE.z]} scale={[PALACE.size[0], PALACE.size[1], 1]} renderOrder={-7}>
        <shaderMaterial ref={screenMat} vertexShader={PALACE_VERT} fragmentShader={PALACE_FRAG} uniforms={screenUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh geometry={beamGeo} renderOrder={-6} frustumCulled={false}>
        <shaderMaterial ref={beamMat} vertexShader={PROJECTOR_VERT} fragmentShader={PROJECTOR_FRAG} uniforms={beamUniforms} transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} />
      </mesh>
      <Searchlights />
    </group>
  )
}

/** Premiere night: searchlights rising from behind the screen, sweeping slowly — only on the Stakeholders face. */
const SEARCH = [
  { x: -24, seed: 2.1, phase: 0 },
  { x: -9, seed: 5.3, phase: 1.9 },
  { x: 9, seed: 7.7, phase: 3.4 },
  { x: 24, seed: 9.4, phase: 5.0 },
] as const
function Searchlights() {
  const geo = React.useMemo(() => new PlaneGeometry(1, 1, 6, 24), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  const uniforms = React.useMemo(
    () => SEARCH.map((b) => ({ uColor: { value: hsl(44, 60, 86) }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.2 }, uSeed: { value: b.seed } })),
    [],
  )
  const mats = React.useRef<(ShaderMaterial | null)[]>([])
  const meshes = React.useRef<(Mesh | null)[]>([])
  const face = React.useRef(0)
  useFrame((_, dt) => {
    if (!live.place) return
    face.current = damp(face.current, heroState.face, 2.2, Math.min(dt, 0.1))
    const w = skyWeight(live.place, 2) * face.current
    SEARCH.forEach((b, i) => {
      const m = meshes.current[i]
      const mat = mats.current[i]
      if (!m || !mat) return
      m.visible = w > 0.004
      // each sweeps on its own slow arc, leaning outward; the base stays put behind the screen
      const tilt = Math.PI + Math.sign(b.x) * 0.22 + Math.sin(live.time * 0.35 + b.phase) * 0.32
      const L = 70
      m.rotation.z = tilt
      // (a plane turned by `tilt` has its narrow end — the lamp — at its local top: the centre sits half a length back from it)
      m.position.set(b.x + Math.sin(tilt) * (L / 2), -6 - Math.cos(tilt) * (L / 2), PALACE.z - 4)
      mat.uniforms.uWeight.value = w
      mat.uniforms.uTime.value = live.time
    })
  })
  return (
    <>
      {SEARCH.map((b, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} geometry={geo} scale={[6, 70, 1]} renderOrder={-8} visible={false}>
          <shaderMaterial ref={(el) => void (mats.current[i] = el)} vertexShader={BEAM_VERT} fragmentShader={BEAM_FRAG} uniforms={uniforms[i]} transparent depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
    </>
  )
}

/** The sunburst round the Client's tile (in place of the rings). */
function DecoHalo({ theme }: { theme: HeroTheme }) {
  const map = React.useMemo(() => decoHaloTexture(theme), [theme])
  React.useEffect(() => () => map.dispose(), [map])
  const mesh = React.useRef<Mesh>(null)
  const mat = React.useRef<MeshBasicMaterial>(null)
  const c = React.useMemo(() => new Vector3(...NODES.client).add(new Vector3(0, 0, -1.4)), [])
  useFrame(({ camera }) => {
    const m = mesh.current
    if (!m || !live.place) return
    const near = presence(live.place, 2)
    m.quaternion.copy(camera.quaternion)
    m.rotateZ(live.time * 0.03)
    m.scale.setScalar(10.5 * (0.82 + 0.18 * near))
    if (mat.current) mat.current.opacity = 0.12 + 0.5 * near
  })
  return (
    <mesh ref={mesh} position={c} renderOrder={7}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial ref={mat} map={map} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
    </mesh>
  )
}

// ── THE SUITE: THE MODERN LENS ──────────────────────────────────────────────
//
// Behind the tile, a cine lens seen down its barrel: the iris opening as the camera arrives (IRIS_*),
// the focus ring turning back and forth round it (a focus pull), and an anamorphic flare crossing the
// frame through the tile. The floor is the edit timeline (STRUCTURE mode 2).

function SuiteLens({ theme }: { theme: HeroTheme }) {
  const maps = React.useMemo(() => ({ ring: focusRingTexture(theme), flare: anamorphicTexture() }), [theme])
  React.useEffect(() => () => Object.values(maps).forEach((t) => t.dispose()), [maps])
  const c = React.useMemo(() => new Vector3(...NODES.suite), [])
  const irisUniforms = React.useMemo(() => ({ uOpen: { value: 0 }, uTime: { value: 0 }, uWeight: { value: 0 }, uGold: { value: theme.glow.clone() }, uLean: { value: [0, 0] } }), [theme])
  const iris = React.useRef<Mesh>(null)
  const irisMat = React.useRef<ShaderMaterial>(null)
  const ring = React.useRef<Mesh>(null)
  const ringMat = React.useRef<MeshBasicMaterial>(null)
  const flare = React.useRef<Mesh>(null)
  const flareMat = React.useRef<MeshBasicMaterial>(null)
  useFrame(({ camera }) => {
    if (!live.place) return
    const near = presence(live.place, 3)
    const w = skyWeight(live.place, 3)
    for (const m of [iris.current, ring.current, flare.current]) {
      if (!m) continue
      m.visible = w > 0.002
      m.quaternion.copy(camera.quaternion)
    }
    if (!iris.current?.visible) return
    const im = irisMat.current
    if (im) {
      // the iris opens as the camera arrives, and breathes a little while it holds
      im.uniforms.uOpen.value = near * (0.86 + 0.08 * Math.sin(live.time * 0.4))
      im.uniforms.uTime.value = live.time
      im.uniforms.uWeight.value = w * (0.35 + 0.65 * near)
      im.uniforms.uLean.value = [live.pointer.x * live.pointer.on, live.pointer.y * live.pointer.on]
    }
    // the focus pull: the ring turns slowly one way and back, the distances passing the mark
    if (ring.current) ring.current.rotateZ(Math.sin(live.time * 0.22) * 0.45)
    if (ringMat.current) ringMat.current.opacity = w * (0.25 + 0.6 * near)
    if (flareMat.current) flareMat.current.opacity = w * near * (0.4 + 0.1 * Math.sin(live.time * 0.9))
  })
  return (
    <group>
      <mesh ref={iris} position={[c.x, c.y, c.z - 2.2]} scale={11} renderOrder={-4} visible={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={irisMat} vertexShader={IRIS_VERT} fragmentShader={IRIS_FRAG} uniforms={irisUniforms} transparent depthWrite={false} />
      </mesh>
      <mesh ref={ring} position={[c.x, c.y, c.z - 2.0]} scale={13.4} renderOrder={-3} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={ringMat} map={maps.ring} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flare} position={[c.x, c.y, c.z + 0.6]} scale={[46, 1.1, 1]} renderOrder={22} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={flareMat} map={maps.flare} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ── THE SCREENS ─────────────────────────────────────────────────────────────

type Face = { capture?: string; icon: string; label: string; art: number }

/** Which screen the pointer is on, per station, so the others step back. */
const hovered: Record<StationId, number> = { crew: -1, client: -1, suite: -1 }

function Panel({
  station, index, count, faces, slot, width, theme, sources, anisotropy, maxWidth, armed,
}: {
  station: StationId; index: number; count: number; faces: Face[]; slot: Vec3; width: number
  theme: HeroTheme; sources: HeroSources; anisotropy: number; maxWidth: number; armed: boolean
}) {
  const height = width * PANEL.aspect
  const labelH = PANEL.label * (width / PANEL.width)
  const shot = SHOT_OF[station]
  const centre = NODES[station]
  const mesh = React.useRef<Mesh>(null)
  const group = React.useRef<Group>(null)
  const mat = React.useRef<ShaderMaterial>(null)
  const state = React.useRef({ hover: 0, hoverTo: 0, showing: 0 })
  const invalidate = useThree((s) => s.invalidate)

  // Each face's picture and label: asked for once the station is near, kept until the theme changes.
  const [pictures, setPictures] = React.useState<{ key: string; maps: (Texture | null)[]; labels: (Texture | null)[] } | null>(null)
  const key = `${theme.dark}`
  React.useEffect(() => {
    if (!armed) return
    let alive = true
    const made: Texture[] = []
    // made off the main thread where possible, then handed to the GPU one a frame (textures.ts uploadSoon)
    const keep = async (t: Texture | null) => {
      if (!t) return null
      if (!alive) {
        t.dispose()
        return null
      }
      made.push(t)
      await uploadSoon(t)
      return t
    }
    Promise.all(
      faces.map(async (f) => {
        const map = f.capture ? await keep(await getScreenTexture(f.capture, theme.dark, sources, anisotropy, maxWidth, !heroState.reduced)) : null
        const label = await keep(await labelTexture(f.label, sources.icons[f.icon], theme, width / labelH, anisotropy))
        return { map, label }
      }),
    ).then((out) => {
      if (alive) setPictures({ key, maps: out.map((o) => o.map), labels: out.map((o) => o.label) })
    })
    return () => {
      alive = false
      made.forEach((t) => t.dispose())
    }
  }, [armed, faces, theme, sources, anisotropy, maxWidth, width, labelH, key])

  const uniforms = React.useMemo(
    () => ({
      uMap: { value: null as Texture | null }, uLabel: { value: null as Texture | null }, uHasMap: { value: 0 }, uHasLabel: { value: 0 },
      uSize: { value: [width, height] }, uLabelH: { value: labelH }, uRadius: { value: width * 0.028 },
      uOpacity: { value: 0 }, uHover: { value: 0 }, uFocus: { value: 1 }, uTime: { value: 0 }, uSheen: { value: -1 }, uDark: { value: theme.dark ? 1 : 0 },
      uRim: { value: theme.dark ? theme.glow.clone() : theme.core.clone() }, uGlass: { value: theme.glass.clone() }, uInk: { value: theme.ink.clone() },
      uGold: { value: theme.primary.clone() }, uPointer: { value: [0, 0] },
    }),
    [width, height, labelH, theme],
  )

  const show = React.useCallback(
    (face: number) => {
      const m = mat.current
      if (!m) return
      const ready = pictures?.key === key ? pictures : null
      const map = ready?.maps[face] ?? null
      const label = ready?.labels[face] ?? null
      m.uniforms.uMap.value = map
      m.uniforms.uHasMap.value = map ? 1 : 0
      m.uniforms.uLabel.value = label
      m.uniforms.uHasLabel.value = label ? 1 : 0
    },
    [pictures, key],
  )
  React.useEffect(() => {
    show(state.current.showing)
    invalidate()
  }, [show, invalidate])

  const stagger = 0.06
  useFrame(({ camera }, dt) => {
    const g = group.current
    const m = mat.current
    if (!g || !m || !live.place) return
    const d = Math.min(dt, 0.1)
    const s = state.current
    const p = presence(live.place, shot)
    const a = easeOut(clamp01((p - index * stagger) / (1 - stagger * (count - 1))))
    g.visible = a > 0.001
    if (!g.visible) return
    s.hover = heroState.reduced ? s.hoverTo : damp(s.hover, s.hoverTo, 9, d)
    const anyHover = hovered[station] >= 0
    const focus = !anyHover || hovered[station] === index ? 1 : 0
    m.uniforms.uFocus.value = damp(m.uniforms.uFocus.value, focus, 7, d)

    // gather from the tile out to the screen's place, then float there, leaning toward the pointer
    const t = live.time
    const px = live.pointer.x * live.pointer.on
    const py = live.pointer.y * live.pointer.on
    const depth = 0.5 + Math.max(0, slot[2] + 4) * 0.12
    g.position.set(
      centre[0] + slot[0] * a + px * 0.35 * depth,
      centre[1] + slot[1] * a + Math.sin(t * 0.55 + index * 1.3) * 0.14 * a + py * 0.22 * depth,
      centre[2] + slot[2] * a - (1 - a) * 2,
    )
    // under the hand: lift toward the camera
    LIFT.copy(camera.position).sub(g.position).normalize().multiplyScalar(1.1 * s.hover)
    g.position.add(LIFT)
    g.scale.setScalar((0.35 + 0.65 * a) * (1 + 0.05 * s.hover))

    let fade = 1
    let angle = 0
    if (station === 'client') {
      const turn = faceTurn(0.08 + index * 0.06)
      if (heroState.reduced) fade = turn.fade
      else angle = turn.angle
      if (turn.showing !== s.showing) {
        s.showing = turn.showing
        show(turn.showing)
      }
      if (turn.turning) invalidate()
    }
    g.rotation.set(-slot[1] * 0.012 + py * 0.05 * a, -slot[0] * 0.03 + px * 0.07 * a + angle, 0)

    m.uniforms.uOpacity.value = a * fade
    m.uniforms.uHover.value = s.hover
    // the tools' work starts a few seconds in, so a still (reduced motion, a poster) shows it under way
    m.uniforms.uTime.value = t + 5 + index * 3.7
    // the glass catches the light once as the screen arrives, and follows the hand
    m.uniforms.uSheen.value = -0.9 + 2.6 * a - s.hover * (0.9 - px * 0.4)
    if (s.hover > 0.001 && s.hover < 0.999) invalidate()
  })

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      state.current.hoverTo = 1
      hovered[station] = index
      if (station === 'client') heroState.holdFace = true
      invalidate()
    },
    onPointerOut: () => {
      state.current.hoverTo = 0
      if (hovered[station] === index) hovered[station] = -1
      if (station === 'client') heroState.holdFace = false
      invalidate()
    },
  }

  return (
    <group ref={group} visible={false}>
      <mesh ref={mesh} position-y={-labelH / 2} scale={[width, height + labelH, 1]} renderOrder={10} {...handlers}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial ref={mat} vertexShader={PANEL_VERT} fragmentShader={PANEL_FRAG} defines={{ ART: faces[0].art }} uniforms={uniforms} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── THE SUITE'S TOOL CHIPS ──────────────────────────────────────────────────

function Chips({ theme, sources, anisotropy, armed }: { theme: HeroTheme; sources: HeroSources; anisotropy: number; armed: boolean }) {
  const [maps, setMaps] = React.useState<Texture[] | null>(null)
  React.useEffect(() => {
    if (!armed) return
    let alive = true
    let made: Texture[] = []
    Promise.all(hero.tools.map(async (t) => {
      const chip = await chipTexture(sources.icons[t.icon], theme, anisotropy)
      await uploadSoon(chip)
      return chip
    })).then((list) => {
      if (alive) {
        made = list
        setMaps(list)
      } else list.forEach((t) => t.dispose())
    })
    return () => {
      alive = false
      made.forEach((t) => t.dispose())
    }
  }, [armed, theme, sources, anisotropy])
  const sprites = React.useRef<(Sprite | null)[]>([])
  const c = NODES.suite
  const n = hero.tools.length
  useFrame(() => {
    if (!live.place) return
    const p = presence(live.place, 3)
    for (let i = 0; i < n; i++) {
      const s = sprites.current[i]
      if (!s) continue
      const a = easeOut(clamp01((p - i * 0.05) / (1 - 0.05 * (n - 1))))
      s.visible = a > 0.001 && !!maps
      const ang = (i / n) * Math.PI * 2 + (live.time / CHIPS.period) * Math.PI * 2
      const r = CHIPS.radius * (0.4 + 0.6 * a)
      const x = Math.cos(ang) * r
      const z = Math.sin(ang) * r
      s.position.set(c[0] + x, c[1] + z * Math.sin(CHIPS.tilt) + Math.sin(live.time * 0.8 + i) * 0.12, c[2] + z * Math.cos(CHIPS.tilt))
      s.scale.setScalar(CHIPS.size * (0.4 + 0.6 * a) * (0.86 + 0.14 * (z / CHIPS.radius + 1) / 2))
      s.renderOrder = z > 0 ? 21 : 15
      ;(s.material as SpriteMaterial).opacity = a * (0.55 + 0.45 * (z / CHIPS.radius + 1) / 2)
    }
  })
  return (
    <group>
      {hero.tools.map((t, i) => (
        <sprite key={t.stage} ref={(el) => void (sprites.current[i] = el)} visible={false}>
          <spriteMaterial map={maps?.[i] ?? null} transparent depthWrite={false} depthTest={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
}

// ── THE STATION ─────────────────────────────────────────────────────────────

function facesFor(id: StationId): Face[][] {
  if (id === 'suite') {
    return hero.tools.map((t) => [{ capture: 'capture' in t ? t.capture : undefined, icon: t.icon, label: t.label, art: ART[t.art] }])
  }
  const own = hero.panels[id] as readonly HeroPanel[]
  if (id === 'client') {
    const other = hero.panels.stakeholders as readonly HeroPanel[]
    return own.map((p, i) => [
      { capture: p.capture, icon: p.icon, label: p.label, art: 0 },
      { capture: other[i].capture, icon: other[i].icon, label: other[i].label, art: 0 },
    ])
  }
  return own.map((p) => [{ capture: p.capture, icon: p.icon, label: p.label, art: 0 }])
}

export function Station({
  id, theme, sources, soft, anisotropy, tall, maxWidth, armed,
}: {
  id: StationId; theme: HeroTheme; sources: HeroSources; soft: Texture; anisotropy: number; tall: boolean; maxWidth: number; armed: boolean
}) {
  const faces = React.useMemo(() => facesFor(id), [id])
  const keep: readonly number[] = tall ? TALL_KEEP[id] : faces.map((_, i) => i)
  const slots = tall ? SLOTS[id].tall : SLOTS[id].wide
  const width = tall ? PANEL.tallWidth : id === 'suite' ? PANEL.toolWidth : PANEL.width
  return (
    <>
      <Sky id={id} theme={theme} />
      <Structure id={id} theme={theme} />
      {id === 'crew' ? (
        <>
          <CrewLights theme={theme} />
          <CrewReel theme={theme} />
        </>
      ) : id === 'client' ? (
        <>
          <Palace theme={theme} />
          <DecoHalo theme={theme} />
        </>
      ) : (
        <SuiteLens theme={theme} />
      )}
      {keep.map((fi, slotIndex) => (
        <Panel
          key={`${fi}-${tall}`}
          station={id}
          index={slotIndex}
          count={keep.length}
          faces={faces[fi]}
          slot={slots[slotIndex]}
          width={width}
          theme={theme}
          sources={sources}
          anisotropy={anisotropy}
          maxWidth={maxWidth}
          armed={armed}
        />
      ))}
      {id === 'suite' && <Chips theme={theme} sources={sources} anisotropy={anisotropy} armed={armed} />}
      <Tile id={id} theme={theme} soft={soft} anisotropy={anisotropy} />
    </>
  )
}
