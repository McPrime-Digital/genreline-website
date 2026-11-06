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
  AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Float32BufferAttribute, NormalBlending, PlaneGeometry, Vector3, type Color, type PerspectiveCamera,
  type Group, type LineBasicMaterial, type Mesh, type MeshBasicMaterial, type ShaderMaterial, type Sprite, type SpriteMaterial, type Texture,
} from 'three'
import { hero, type HeroPanel } from '@/content/home'
import { heroState, presence, skyWeight } from '@/components/hero/state'
import { CHIPS, FACE, NODES, PANEL, SLOTS, TALL_KEEP, TILE, type Shot, type Vec3 } from '@/components/hero/scene/numbers'
import { live, pointerNear } from '@/components/hero/scene/rig'
import { FilmScreen, watching } from '@/components/hero/scene/cinema'
import { filmPicture, filmPlaying, filmProgress, filmTone, prefetchFilm, rewindFilm, wantFilm } from '@/components/hero/scene/films'
import { farAtlas } from '@/components/hero/scene/far'
import { HERO_FILMS } from '@/content/hero-films'
import {
  BEAM_FRAG, BEAM_VERT, FILM_FRAG, FILM_VERT, MOTE_FRAG, MOTE_VERT, PALACE_FRAG, PALACE_VERT, PANEL_FRAG, PANEL_VERT, PROJECTOR_FRAG, PROJECTOR_VERT, PUFF_FRAG, PUFF_VERT, SKY_FRAG, SKY_VERT, STRUCTURE_FRAG, STRUCTURE_VERT, TICKET_FRAG, TICKET_VERT,
} from '@/components/hero/scene/shaders'
import { chipTexture, clapperTextures, getScreenTexture, hsl, labelTexture, ticketTextures, tileTexture, uploadSoon, type HeroSources, type HeroTheme, type TileKind } from '@/components/hero/scene/textures'

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
  suite: { mode: 2, size: [110, 80], at: [0, -10.5, -14], flat: true, opacity: [0.62, 0.3] },
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
      uHouse: { value: 1 }, uSpill: { value: hsl(214, 30, 86) }, uAtlas: { value: null as Texture | null }, uHasAtlas: { value: 0 },
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
    if (id === 'suite' && m.uniforms.uAtlas.value !== farAtlas.texture) {
      // the floor's finished frames: the films' stills, once they are here
      m.uniforms.uAtlas.value = farAtlas.texture
      m.uniforms.uHasAtlas.value = farAtlas.texture ? 1 : 0
    }
    if (id === 'client') {
      m.uniforms.uFace.value = damp(m.uniforms.uFace.value, heroState.face, 2.2, Math.min(dt, 0.1))
      // the house lights go down as the camera arrives and the film plays; its light falls on the floor
      m.uniforms.uHouse.value = 1 - 0.7 * presence(live.place, 2)
      const tone = filmTone('client')
      if (tone) (m.uniforms.uSpill.value as Color).copy(tone)
    }
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

// ── A PROJECTOR'S BEAM ──────────────────────────────────────────────────────

/** A beam from a lamp (a small square there) to a screen's four corners: four faces, divided along their length (aT 0 at the lamp, 1 at the screen). */
function beamGeometry(lamp: Vec3, corners: readonly Vec3[]) {
  const [lx, ly, lz] = lamp
  const near = [[-0.5, -0.4], [0.5, -0.4], [0.5, 0.4], [-0.5, 0.4]]
  const N = 14
  const pos: number[] = []
  const t: number[] = []
  const idx: number[] = []
  for (let f = 0; f < 4; f++) {
    const base = pos.length / 3
    for (let i = 0; i <= N; i++) {
      const k = i / N
      for (const corner of [f, (f + 1) % 4]) {
        const [fx, fy, fz] = corners[corner]
        pos.push(lx + near[corner][0] + (fx - lx - near[corner][0]) * k, ly + near[corner][1] + (fy - ly - near[corner][1]) * k, lz + (fz - lz) * k)
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

/**
 * The clapperboard behind the Crew's tile (in place of the reel — the owner, 2026-11-06: it must be "film
 * and movie and crew at the same time"): the slate and its sticks. As the camera arrives the sticks lift
 * and clap — a flash along them, a puff of chalk dust. Under the pointer (or a finger) they open and wait;
 * as it leaves, they clap.
 */
const CLAPPER = { at: [0, -0.4, -3.9] as Vec3, board: [9.6, 6.6] as const, stick: 1.0, open: 0.46 } as const
const PUFF = (() => {
  const n = 70
  const pos = new Float32Array(n * 3)
  const dir = new Float32Array(n * 3)
  let seed = 41
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280)
  const top = CLAPPER.board[1] / 2 + CLAPPER.stick
  for (let i = 0; i < n; i++) {
    pos.set([(rnd() * 2 - 1) * (CLAPPER.board[0] / 2 - 0.3), top, 0.1], i * 3)
    dir.set([(rnd() * 2 - 1) * 0.6, -0.2 + rnd() * 0.9, rnd() * 0.7], i * 3)
  }
  return { pos, dir }
})()

function Clapperboard({ anisotropy, soft }: { anisotropy: number; soft: Texture }) {
  const [maps, setMaps] = React.useState<{ board: Texture; arm: Texture; base: Texture } | null>(null)
  React.useEffect(() => {
    let alive = true
    let made: Texture[] = []
    clapperTextures(anisotropy).then(async (m) => {
      made = [m.board, m.arm, m.base]
      if (!alive) return made.forEach((t) => t.dispose())
      await Promise.all(made.map((t) => uploadSoon(t)))
      if (alive) setMaps(m)
    })
    return () => {
      alive = false
      made.forEach((t) => t.dispose())
    }
  }, [anisotropy])
  const puffGeo = React.useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(PUFF.pos, 3))
    g.setAttribute('aDir', new BufferAttribute(PUFF.dir, 3))
    return g
  }, [])
  React.useEffect(() => () => puffGeo.dispose(), [puffGeo])
  const puffUniforms = React.useMemo(() => ({ uAge: { value: -1 }, uPixel: { value: 600 }, uColor: { value: hsl(40, 30, 92) }, uOpacity: { value: 0.8 } }), [])
  const group = React.useRef<Group>(null)
  const pivot = React.useRef<Group>(null)
  const mats = React.useRef<(MeshBasicMaterial | null)[]>([])
  const flashMat = React.useRef<SpriteMaterial>(null)
  const puffMat = React.useRef<ShaderMaterial>(null)
  const st = React.useRef({ arm: 0, phase: 'rest' as 'rest' | 'lift' | 'held' | 'clap', liftAt: 0, clapAt: -10, prev: 0 })
  const centre = React.useMemo(() => new Vector3(...NODES.crew).add(new Vector3(...CLAPPER.at)), [])
  const ndc = React.useMemo(() => new Vector3(), [])
  const invalidate = useThree((s) => s.invalidate)
  useFrame(({ camera, size, viewport }, dt) => {
    const g = group.current
    if (!g || !live.place) return
    const d = Math.min(dt, 0.1)
    const w = skyWeight(live.place, 1)
    g.visible = w > 0.004 && !!maps
    if (!g.visible) return
    const near = presence(live.place, 1)
    const s = st.current
    const reduced = heroState.reduced
    // arriving: the sticks lift, then clap
    if (!reduced && near > 0.9 && s.prev <= 0.9) {
      s.phase = 'lift'
      s.liftAt = live.time
    }
    s.prev = near
    // the pointer on the slate: held open; leaving it, a clap
    ndc.copy(centre).project(camera)
    const hand = ndc.z < 1 ? pointerNear(ndc.x, ndc.y, 0.17) * near : 0
    if (hand > 0.35 && s.phase !== 'held') s.phase = 'held'
    else if (s.phase === 'held' && hand < 0.15) s.phase = 'clap'
    if (s.phase === 'lift' && live.time - s.liftAt > 0.65) s.phase = 'clap'
    if (s.phase === 'clap') {
      s.arm -= d * 9
      if (s.arm <= 0 || reduced) {
        s.arm = 0
        s.phase = 'rest'
        s.clapAt = live.time
      }
    } else s.arm += ((s.phase === 'rest' ? 0 : CLAPPER.open) - s.arm) * Math.min(1, d * (s.phase === 'held' ? 6 : 8))
    if (pivot.current) pivot.current.rotation.z = s.arm
    for (const m of mats.current) if (m) m.opacity = w
    const age = live.time - s.clapAt
    if (flashMat.current) flashMat.current.opacity = w * Math.max(0, 1 - age * 4.5) * 0.9
    const pm = puffMat.current
    if (pm) {
      pm.uniforms.uAge.value = age < 2 ? age : -1
      pm.uniforms.uOpacity.value = 0.8 * w
      pm.uniforms.uPixel.value = (size.height * viewport.dpr) / (2 * Math.tan(((camera as PerspectiveCamera).fov / 2) * (Math.PI / 180)))
    }
    if (s.phase !== 'rest' || age < 2) invalidate()
  })
  const [bw, bh] = CLAPPER.board
  const top = bh / 2
  const mat = (i: number, map: Texture | null) => (
    <meshBasicMaterial ref={(el) => void (mats.current[i] = el)} map={map} transparent toneMapped={false} />
  )
  return (
    <group ref={group} position={centre} visible={false}>
      <mesh renderOrder={7}>
        <planeGeometry args={[bw, bh]} />
        {mat(0, maps?.board ?? null)}
      </mesh>
      <mesh position={[0, top + CLAPPER.stick / 2, 0.01]} renderOrder={7}>
        <planeGeometry args={[bw, CLAPPER.stick]} />
        {mat(1, maps?.base ?? null)}
      </mesh>
      {/* the arm, hinged at its left end on the stick below */}
      <group ref={pivot} position={[-bw / 2, top + CLAPPER.stick, 0.03]}>
        <mesh position={[bw / 2, CLAPPER.stick / 2, 0]} renderOrder={7}>
          <planeGeometry args={[bw, CLAPPER.stick]} />
          {mat(2, maps?.arm ?? null)}
        </mesh>
      </group>
      <sprite position={[0, top + CLAPPER.stick, 0.2]} scale={[bw * 1.15, 1.4, 1]} renderOrder={8}>
        <spriteMaterial ref={flashMat} map={soft} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </sprite>
      <points geometry={puffGeo} frustumCulled={false} renderOrder={9}>
        <shaderMaterial ref={puffMat} vertexShader={PUFF_VERT} fragmentShader={PUFF_FRAG} uniforms={puffUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
      </points>
    </group>
  )
}

/**
 * The Crew's cinema: the silent era (the owner, 2026-11-06: "every space should have a different type of
 * cinema … each from a different era"). A canvas screen in a wooden frame, hung by two ropes at the back of
 * the soundstage, turned toward the stage; A Trip to the Moon on it in a silent print's look (cinema.tsx,
 * films.ts); its projector out of frame, up and to the left like a booth, its beam flickering through the
 * haze at sixteen frames a second.
 */
const SILENT = { at: [14, 6, -26] as Vec3, size: [20, 15] as const, turn: -0.25, lamp: [-26, 16, 16] as Vec3 } as const
function SilentCinema() {
  const [w, h] = SILENT.size
  const corners = React.useMemo(() => {
    const c = Math.cos(SILENT.turn)
    const sn = Math.sin(SILENT.turn)
    const [ax, ay, az] = SILENT.at
    return ([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as const).map(([x, y]) => [ax + x * c, ay + y, az - x * sn] as Vec3)
  }, [w, h])
  const beamGeo = React.useMemo(() => beamGeometry(SILENT.lamp, corners), [corners])
  const ropes = React.useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute([-w / 2 + 1, h / 2 + 0.4, -0.1, -w / 2 + 1.6, h / 2 + 40, -0.1, w / 2 - 1, h / 2 + 0.4, -0.1, w / 2 - 1.6, h / 2 + 40, -0.1], 3))
    return g
  }, [w, h])
  React.useEffect(() => () => { beamGeo.dispose(); ropes.dispose() }, [beamGeo, ropes])
  const beamUniforms = React.useMemo(() => ({ uColor: { value: hsl(42, 30, 88) }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.075 } }), [])
  const group = React.useRef<Group>(null)
  const beamMat = React.useRef<ShaderMaterial>(null)
  const frameMat = React.useRef<MeshBasicMaterial>(null)
  const ropeMat = React.useRef<LineBasicMaterial>(null)
  useFrame(() => {
    const g = group.current
    if (!g || !live.place) return
    const sw = skyWeight(live.place, 1)
    g.visible = sw > 0.004
    if (!g.visible) return
    if (frameMat.current) frameMat.current.opacity = sw
    if (ropeMat.current) ropeMat.current.opacity = sw * 0.55
    const bm = beamMat.current
    if (bm) {
      // the hand-cranked lamp's flicker, sixteen frames a second
      const f = Math.floor(live.time * 16)
      const flick = 0.82 + 0.18 * (((Math.sin(f * 12.9898) * 43758.5453) % 1) + 1) % 1
      bm.uniforms.uWeight.value = sw * (heroState.reduced ? 1 : flick)
      bm.uniforms.uTime.value = live.time
    }
  })
  return (
    <group ref={group} position={NODES.crew} visible={false}>
      <mesh geometry={beamGeo} renderOrder={-6} frustumCulled={false}>
        <shaderMaterial ref={beamMat} vertexShader={PROJECTOR_VERT} fragmentShader={PROJECTOR_FRAG} uniforms={beamUniforms} transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} />
      </mesh>
      <group position={SILENT.at} rotation-y={SILENT.turn}>
        {/* the wooden frame, a hand's width round the canvas */}
        <mesh position={[0, 0, -0.08]} renderOrder={-7}>
          <planeGeometry args={[w + 0.9, h + 0.9]} />
          <meshBasicMaterial ref={frameMat} color="#3a2716" transparent toneMapped={false} />
        </mesh>
        <lineSegments geometry={ropes} renderOrder={-7}>
          <lineBasicMaterial ref={ropeMat} color="#8a7356" transparent />
        </lineSegments>
        <FilmScreen film="crew" era={0} station="crew" size={[w, h]} weight={crewWeight} renderOrder={-6} />
      </group>
    </group>
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
  // the beam: from the lamp to the screen's edges
  const beamGeo = React.useMemo(() => {
    const { y, hw, hh } = PALACE.screen
    const z = PALACE.z
    return beamGeometry(PALACE.lamp, [[-hw, y - hh, z], [hw, y - hh, z], [hw, y + hh, z], [-hw, y + hh, z]])
  }, [])
  React.useEffect(() => () => { geo.dispose(); beamGeo.dispose() }, [geo, beamGeo])
  const screenUniforms = React.useMemo(
    () => ({
      uSize: { value: PALACE.size }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.5 }, uFace: { value: 0 },
      uSilver: { value: hsl(214, 30, 86) }, uGold: { value: theme.glow.clone() }, uVelvet: { value: hsl(350, 70, 34) }, uSpill: { value: hsl(214, 30, 86) },
    }),
    [theme],
  )
  const beamUniforms = React.useMemo(() => ({ uColor: { value: hsl(210, 40, 88) }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.085 } }), [])
  const screenMat = React.useRef<ShaderMaterial>(null)
  const beamMat = React.useRef<ShaderMaterial>(null)
  const maskMat = React.useRef<MeshBasicMaterial>(null)
  const group = React.useRef<Group>(null)
  useFrame((_, dt) => {
    if (!live.place || !group.current) return
    const w = skyWeight(live.place, 2)
    group.current.visible = w > 0.002
    if (!group.current.visible) return
    const tone = filmTone('client')
    const sm = screenMat.current
    if (sm) {
      sm.uniforms.uWeight.value = w
      sm.uniforms.uTime.value = live.time
      sm.uniforms.uFace.value = damp(sm.uniforms.uFace.value, heroState.face, 2.2, Math.min(dt, 0.1))
      if (tone) (sm.uniforms.uSpill.value as Color).copy(tone)
    }
    // the projector's beam carries the film's light
    const bm = beamMat.current
    if (bm) {
      bm.uniforms.uWeight.value = w * (0.35 + 0.65 * presence(live.place, 2))
      bm.uniforms.uTime.value = live.time
      if (tone) (bm.uniforms.uColor.value as Color).copy(tone)
    }
    if (maskMat.current) maskMat.current.opacity = w
  })
  return (
    <group ref={group} position={c} visible={false}>
      <mesh geometry={geo} position={[0, 0, PALACE.z]} scale={[PALACE.size[0], PALACE.size[1], 1]} renderOrder={-7}>
        <shaderMaterial ref={screenMat} vertexShader={PALACE_VERT} fragmentShader={PALACE_FRAG} uniforms={screenUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh geometry={beamGeo} renderOrder={-6} frustumCulled={false}>
        <shaderMaterial ref={beamMat} vertexShader={PROJECTOR_VERT} fragmentShader={PROJECTOR_FRAG} uniforms={beamUniforms} transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} />
      </mesh>
      {/* the screen's masking: black velvet across the whole wide screen; the film at its own (Academy) shape in the middle */}
      <mesh position={[0, PALACE.screen.y, PALACE.z + 0.02]} renderOrder={-7}>
        <planeGeometry args={[PALACE.screen.hw * 2, PALACE.screen.hh * 2]} />
        <meshBasicMaterial ref={maskMat} color="#050507" transparent toneMapped={false} />
      </mesh>
      <FilmScreen film="client" era={1} station="client" size={[PALACE.screen.hh * 2 * (4 / 3), PALACE.screen.hh * 2]} position={[0, PALACE.screen.y, PALACE.z + 0.05]} weight={clientWeight} renderOrder={-6} />
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
      // (they rise from behind the top of the screen: never across the picture)
      m.position.set(b.x + Math.sin(tilt) * (L / 2), PALACE.screen.y + PALACE.screen.hh + 2 - Math.cos(tilt) * (L / 2), PALACE.z - 4)
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

/**
 * Behind the Client's tile: a cinema ticket, ADMIT ONE, that turns over — with the tile, every three
 * seconds — into the Stakeholders' premiere pass, ALL ACCESS (textures.ts ticketTextures). Under the
 * pointer (or a finger) the ticket's stub tears a little along its perforation, and a sheen crosses the foil.
 */
const TICKET = { at: [0, -0.3, -3.9] as Vec3, size: [14.2, 6.4] as const, stub: 0.83 } as const
function Ticket({ anisotropy }: { anisotropy: number }) {
  const [maps, setMaps] = React.useState<{ ticket: Texture; pass: Texture } | null>(null)
  React.useEffect(() => {
    let alive = true
    let made: Texture[] = []
    ticketTextures(anisotropy).then(async (m) => {
      made = [m.ticket, m.pass]
      if (!alive) return made.forEach((t) => t.dispose())
      await Promise.all(made.map((t) => uploadSoon(t)))
      if (alive) setMaps(m)
    })
    return () => {
      alive = false
      made.forEach((t) => t.dispose())
    }
  }, [anisotropy])
  const [W, H] = TICKET.size
  const uniforms = React.useMemo(
    () => [0, 1].map((part) => ({ uMap: { value: null as Texture | null }, uU: { value: part === 0 ? [0, TICKET.stub] : [TICKET.stub, 1] }, uSheen: { value: -1 }, uOpacity: { value: 0 } })),
    [],
  )
  const group = React.useRef<Group>(null)
  const turn = React.useRef<Group>(null)
  const stub = React.useRef<Group>(null)
  const mats = React.useRef<(ShaderMaterial | null)[]>([])
  const st = React.useRef({ showing: -1, tear: 0, sheen: -1, held: false })
  const centre = React.useMemo(() => new Vector3(...NODES.client).add(new Vector3(...TICKET.at)), [])
  const ndc = React.useMemo(() => new Vector3(), [])
  const invalidate = useThree((s) => s.invalidate)
  useFrame(({ camera }, dt) => {
    const g = group.current
    if (!g || !live.place) return
    const d = Math.min(dt, 0.1)
    const w = skyWeight(live.place, 2)
    g.visible = w > 0.004 && !!maps
    if (!g.visible || !maps) return
    const s = st.current
    // turning with the tile, a beat behind it
    const ft = faceTurn(0.05)
    let fade = 1
    if (heroState.reduced) fade = ft.fade
    else if (turn.current) turn.current.rotation.y = ft.angle
    if (ft.turning) invalidate()
    if (ft.showing !== s.showing) {
      s.showing = ft.showing
      for (const m of mats.current) if (m) m.uniforms.uMap.value = ft.showing ? maps.pass : maps.ticket
    }
    // the hand on it: the ticket's stub tears a little; a sheen crosses the foil as it arrives
    ndc.copy(centre).project(camera)
    const hand = ndc.z < 1 ? pointerNear(ndc.x, ndc.y, 0.2) * presence(live.place, 2) : 0
    const on = hand > 0.35
    if (on && !s.held && !heroState.reduced) s.sheen = -0.4
    s.held = on
    s.tear += ((on && s.showing === 0 ? 1 : 0) - s.tear) * Math.min(1, d * (on ? 7 : 4))
    if (s.sheen < 1.6) s.sheen += d * 1.6
    if (stub.current) {
      stub.current.rotation.z = -0.1 * s.tear
      stub.current.position.x = -W / 2 + W * TICKET.stub + 0.32 * s.tear
    }
    for (const m of mats.current) {
      if (!m) continue
      m.uniforms.uOpacity.value = w * fade
      m.uniforms.uSheen.value = s.sheen
    }
    if (s.tear > 0.002 && s.tear < 0.998) invalidate()
  })
  const sw = W * (1 - TICKET.stub)
  const bw = W * TICKET.stub
  const face = (i: number) => (
    <shaderMaterial ref={(el) => void (mats.current[i] = el)} vertexShader={TICKET_VERT} fragmentShader={TICKET_FRAG} uniforms={uniforms[i]} transparent toneMapped={false} side={DoubleSide} />
  )
  return (
    <group ref={group} position={centre} visible={false}>
      <group ref={turn}>
        <mesh position={[-W / 2 + bw / 2, 0, 0]} renderOrder={7}>
          <planeGeometry args={[bw, H]} />
          {face(0)}
        </mesh>
        {/* the stub, hinged at the perforation */}
        <group ref={stub} position={[-W / 2 + bw, 0, 0.01]}>
          <mesh position={[sw / 2, 0, 0]} renderOrder={7}>
            <planeGeometry args={[sw, H]} />
            {face(1)}
          </mesh>
        </group>
      </group>
    </group>
  )
}

// ── THE SUITE: TODAY — A DECK OF FILM CARDS ─────────────────────────────────
//
// The Suite's cinema is not a screen but a deck (the owner, 2026-11-06: "multiple … videos … in a form of a
// film card or strip in a distance that switches to play the next video … they swipe off and disappears for
// the next to push a little forward and play"): four cards of film receding behind the station, the front
// one playing its clip; as it ends it swipes off to the right, turning, burning away from its trailing edge,
// and the next comes forward and plays; the spent card returns to the back of the deck. The front card
// leans toward the pointer; a click or a tap sends it on. Its floor (STRUCTURE mode 2) is the Suite's own
// work, from script to screen.

const DECK = { at: [-1.5, 5.6, -21] as Vec3, card: [17, 7.6] as const, step: [2.8, 1.1, -3.4] as Vec3, films: ['suite-1', 'suite-2', 'suite-3', 'suite-4'], swipe: 1.0, hold: 8.5 } as const

function FilmDeck() {
  const [W, H] = DECK.card
  const specs = React.useMemo(() => DECK.films.map((id) => HERO_FILMS.find((f) => f.id === id)), [])
  const uniforms = React.useMemo(
    () =>
      DECK.films.map((_, i) => ({
        uMap: { value: null as Texture | null }, uHasMap: { value: 0 }, uTexel: { value: [1 / 854, 1 / 358] }, uTime: { value: 0 }, uWeight: { value: 0 }, uBright: { value: 1 },
        uScreen: { value: W / (H * 0.74) }, uFilm: { value: specs[i]?.aspect ?? 2.39 }, uBurn: { value: 0 }, uSheen: { value: -1 },
      })),
    [W, H, specs],
  )
  const meshes = React.useRef<(Mesh | null)[]>([])
  const mats = React.useRef<(ShaderMaterial | null)[]>([])
  // the deck's order (front first), the swipe under way, and when the front card came forward
  const st = React.useRef({ order: [0, 1, 2, 3], swipeAt: -1, shownAt: 0, appearAt: [0, 0, 0, 0], tiltX: 0, tiltY: 0, prevW: 0 })
  const base = React.useMemo(() => new Vector3(...NODES.suite).add(new Vector3(...DECK.at)), [])
  const ndc = React.useMemo(() => new Vector3(), [])
  const invalidate = useThree((s) => s.invalidate)
  const send = React.useCallback(() => {
    const s = st.current
    if (s.swipeAt < 0) s.swipeAt = live.time
    invalidate()
  }, [invalidate])
  useFrame(({ camera }, dt) => {
    if (!live.place) return
    const d = Math.min(dt, 0.1)
    const w = skyWeight(live.place, 3)
    const s = st.current
    const reduced = heroState.reduced
    if (w > 0.004 && s.prevW <= 0.004) s.shownAt = live.time
    s.prevW = w
    const front = DECK.films[s.order[0]]
    if (w > 0.004) {
      wantFilm(front, w)
      if (w > 0.3) prefetchFilm(DECK.films[s.order[1]])
    }
    // the front card's clip has ended (or, where nothing plays, it has held a while): it moves on
    const ended = filmPlaying(front) ? filmProgress(front) > 0.975 : live.time - s.shownAt > DECK.hold
    if (s.swipeAt < 0 && w > 0.5 && ended && !reduced) s.swipeAt = live.time
    let k = s.swipeAt < 0 ? 0 : (live.time - s.swipeAt) / DECK.swipe
    if (k >= 1 || (reduced && s.swipeAt >= 0)) {
      const out = s.order.shift()!
      s.order.push(out)
      rewindFilm(DECK.films[out])
      s.appearAt[out] = live.time
      s.swipeAt = -1
      s.shownAt = live.time
      k = 0
    }
    const e = k * k * (3 - 2 * k)
    // the pointer on the front card: it leans toward it
    ndc.copy(base).project(camera)
    const hx = live.pointer.x - ndc.x
    const hy = live.pointer.y - ndc.y
    const near = ndc.z < 1 ? pointerNear(ndc.x, ndc.y, 0.26) * presence(live.place, 3) : 0
    s.tiltX += (-hy * 0.5 * near - s.tiltX) * Math.min(1, d * 6)
    s.tiltY += (hx * 0.35 * near - s.tiltY) * Math.min(1, d * 6)
    s.order.forEach((card, slot) => {
      const m = meshes.current[card]
      const mat = mats.current[card]
      if (!m || !mat) return
      m.visible = w > 0.004
      if (!m.visible) return
      const leaving = slot === 0 && k > 0
      // each card steps forward a place as the front one leaves
      const at = leaving ? 0 : slot - e
      m.position.set(base.x + DECK.step[0] * at, base.y + DECK.step[1] * at, base.z + DECK.step[2] * at)
      m.scale.setScalar(Math.pow(0.9, at))
      m.rotation.set(slot === 0 ? s.tiltX : 0, slot === 0 ? s.tiltY : 0, 0)
      if (leaving) {
        // off to the right, rising a little, turning away
        m.position.x += 30 * e
        m.position.y += 2.5 * e
        m.position.z += 3 * e
        m.rotation.z = -0.32 * e
        m.rotation.y = -0.7 * e
      }
      const appear = Math.min(1, (live.time - s.appearAt[card]) / 0.6)
      const u = mat.uniforms
      const pic = filmPicture(DECK.films[card])
      if (u.uMap.value !== pic) {
        u.uMap.value = pic
        u.uHasMap.value = pic ? 1 : 0
      }
      u.uTime.value = live.time
      u.uWeight.value = w * appear * (1 - 0.22 * at) * (1 - 0.6 * watching.suite.now * (slot === 0 ? 0 : 1))
      u.uBright.value = (slot === 0 ? 1 : 0.62) * (1 + 0.25 * watching.suite.now)
      u.uBurn.value = leaving ? e : 0
      u.uSheen.value = slot === 0 ? -0.5 + ((live.time - s.shownAt) * 0.6) % 3 : -1
      m.renderOrder = -6 - slot * 0.1
    })
    if (k > 0) invalidate()
  })
  const handlers = (card: number) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      if (st.current.order[0] !== card) return
      e.stopPropagation()
      watching.suite.to = 1
      document.body.style.cursor = 'pointer'
      invalidate()
    },
    onPointerOut: () => {
      watching.suite.to = 0
      document.body.style.cursor = ''
      invalidate()
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (st.current.order[0] !== card) return
      e.stopPropagation()
      send()
    },
  })
  return (
    <group>
      {DECK.films.map((id, i) => (
        <mesh key={id} ref={(el) => void (meshes.current[i] = el)} visible={false} {...handlers(i)}>
          <planeGeometry args={[W, H]} />
          <shaderMaterial ref={(el) => void (mats.current[i] = el)} vertexShader={FILM_VERT} fragmentShader={FILM_FRAG} defines={{ ERA: 2, CARD: 1 }} uniforms={uniforms[i]} transparent depthWrite={false} side={DoubleSide} />
        </mesh>
      ))}
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

    // gather from the tile out to the screen's place, then float there (each answers the hand on its own,
    // lifting under it; the screens never lean together with the pointer — the owner, 2026-11-06)
    const t = live.time
    g.position.set(
      centre[0] + slot[0] * a,
      centre[1] + slot[1] * a + Math.sin(t * 0.55 + index * 1.3) * 0.14 * a,
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
    g.rotation.set(-slot[1] * 0.012, -slot[0] * 0.03 + angle, 0)

    // the space's film being watched (its cinema under the pointer): the screens step back from it
    m.uniforms.uOpacity.value = a * fade * (1 - 0.72 * watching[station].now)
    m.uniforms.uHover.value = s.hover
    // the tools' work starts a few seconds in, so a still (reduced motion, a poster) shows it under way
    m.uniforms.uTime.value = t + 5 + index * 3.7
    // the glass catches the light once as the screen arrives, and follows the hand
    m.uniforms.uSheen.value = -0.9 + 2.6 * a - s.hover * 0.9
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

// ── THE CINEMAS' WEIGHTS ────────────────────────────────────────────────────

/** How present each space's cinema is: with its own sky (it shows on the way in, before the screens gather). */
const crewWeight = () => (live.place ? skyWeight(live.place, 1) : 0)
const clientWeight = () => (live.place ? skyWeight(live.place, 2) : 0)

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
          <Clapperboard anisotropy={anisotropy} soft={soft} />
          <SilentCinema />
        </>
      ) : id === 'client' ? (
        <>
          <Palace theme={theme} />
          <Ticket anisotropy={anisotropy} />
        </>
      ) : (
        <FilmDeck />
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
