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
  type Group, type Mesh, type MeshBasicMaterial, type ShaderMaterial, type Sprite, type SpriteMaterial, type Texture,
} from 'three'
import { hero, type HeroPanel } from '@/content/home'
import { heroState, presence, skyWeight } from '@/components/hero/state'
import { CHIPS, FACE, NODES, PANEL, SLOTS, TALL_KEEP, TILE, type Shot, type Vec3 } from '@/components/hero/scene/numbers'
import { live, pointerNear } from '@/components/hero/scene/rig'
import { FilmScreen, watching } from '@/components/hero/scene/cinema'
import { filmPicture, filmPlaying, filmProgress, filmTone, prefetchFilm, rewindFilm, wantFilm } from '@/components/hero/scene/films'
import { farAtlas } from '@/components/hero/scene/far'
import { DECK_FILMS, HERO_FILMS } from '@/content/hero-films'
import {
  BEAM_FRAG, BEAM_VERT, COMET_FRAG, FILM_FRAG, FILM_VERT, MOTE_FRAG, MOTE_VERT, HALL_FRAG, HALL_VERT, PANEL_FRAG, PANEL_VERT, POOL_FRAG, PROJECTOR_FRAG, PROJECTOR_VERT, SKY_FRAG, SKY_VERT, STRUCTURE_FRAG, STRUCTURE_VERT,
} from '@/components/hero/scene/shaders'
import { chipTexture, getScreenTexture, hsl, labelTexture, tileTexture, uploadSoon, type HeroSources, type HeroTheme, type TileKind } from '@/components/hero/scene/textures'

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
      // a faint wash of the space's own light: the universe behind (universe.ts) gives each space its sky now
      // (the owner, 2026-11-06: the dusty nebula "is just the only thing used throughout the whole spaces")
      uFace: { value: 0 }, uWeight: { value: 0 }, uStrength: { value: theme.dark ? 0.38 : 0.75 },
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
  // the cinema's floor, below the screens, the screen's wall at its far side (HALL)
  client: { mode: 1, size: [110, 80], at: [0, -10.5, -14], flat: true, opacity: [1, 1] },
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
      // the cinema's room, in the floor's own frame (+y away from the camera): its walls' x, the screen's y, its open end's y
      uRoom: { value: [HALL.wall, -(HALL.z - s.at[2]), -(HALL.z + HALL.depth - s.at[2])] }, uAisle: { value: HALL.aisle },
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
      m.uniforms.uHouse.value = 1 - 0.75 * presence(live.place, 2)
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
      // (the cinema's floor is dark, hiding the sky under the room: drawn after the stars, with premultiplied alpha)
      renderOrder={id === 'client' ? -2.9 : -5}
    >
      <shaderMaterial
        ref={mat}
        vertexShader={STRUCTURE_VERT}
        fragmentShader={STRUCTURE_FRAG}
        defines={{ MODE: s.mode }}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        premultipliedAlpha={id === 'client'}
        blending={id === 'client' || !theme.dark ? NormalBlending : AdditiveBlending}
      />
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
 * The Crew's cinema: a modern film set's LED volume (the owner, 2026-11-06: the Crew's cinema "very small as
 * i want it bigger … real human modern era video a bit longer") — a curved wall of LED panels round the back
 * of the soundstage, a crew at work playing across it (films.ts). Large, and a little dimmed: the logo and
 * its screens are the focus; the film is the world behind them.
 */
const VOLUME = { centre: [0, 1.5, 5] as [number, number, number], radius: 36, length: 62, height: 26 }
function LedVolume() {
  return (
    <group position={NODES.crew}>
      <FilmScreen film="crew" era={2} station="crew" size={[VOLUME.length, VOLUME.height]} curve={VOLUME.radius} position={VOLUME.centre} weight={crewWeight} bright={0.6} renderOrder={-7} />
    </group>
  )
}

// ── THE CLIENT: THE CINEMA → PREMIERE NIGHT ─────────────────────────────────
//
// A modern auditorium behind the tile, its house lights down (HALL_*): the screen spanning its wall at the
// film's own 2.39 : 1, dark walls with sconces, a ceiling of fibre-optic stars, rows of seats in silhouette,
// the floor's aisles of step lights (STRUCTURE mode 1), the projector's beam over it all (PROJECTOR_*). The
// owner, 2026-11-06: set back a little but not made smaller (it is scaled up to match), "properly advanced
// cinema with dim lights". As the station turns to its Stakeholders face, premiere night: the lights turn
// gold and the aisles are carpeted red.

const CLIENT_FILM = HERO_FILMS.find((f) => f.id === 'client')
/** The room, in the station's frame: the screen wall at z, the room open toward the camera at z + depth. */
const HALL = (() => {
  const hw = 22.4
  const hh = hw / (CLIENT_FILM?.aspect ?? 2.39)
  return {
    z: -22, depth: 20, wall: hw + 3.2, floor: -10.5, ceiling: 17.2, aisle: 8.6,
    screen: { y: 1.8, hw, hh },
    /** The projector's lamp: above and in front, off the top of the frame. */
    lamp: [0, 15, 16] as Vec3,
    /** The rows of seats: [z, the top of their backs], nearest the screen first, the floor raked toward the back. */
    rows: [[-17, -7.2], [-14, -7.5], [-11, -7.8], [-8, -8.1]] as const,
  }
})()

/** Quads from their corners (counter-clockwise as seen from inside the room), each with its own uv. */
function quads(list: { at: Vec3[]; uv: [number, number][] }[]) {
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (const q of list) {
    const b = pos.length / 3
    q.at.forEach((p) => pos.push(...p))
    q.uv.forEach((u) => uv.push(...u))
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3)
  }
  const g = new BufferGeometry()
  g.setAttribute('position', new Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

function Hall({ theme }: { theme: HeroTheme }) {
  const c = NODES.client
  const { z, depth, wall: W, floor: F, ceiling: C, screen } = HALL
  const near = z + depth
  const geos = React.useMemo(() => {
    // the screen wall: a frame round the screen (the film covers the middle, so nothing is drawn under it)
    const bz = z - 0.05
    const sb = screen.y - screen.hh
    const st = screen.y + screen.hh
    const rect = (x0: number, y0: number, x1: number, y1: number) => {
      const u = (x: number) => (x + W) / (2 * W)
      const v = (y: number) => (y - F) / (C - F)
      return { at: [[x0, y0, bz], [x1, y0, bz], [x1, y1, bz], [x0, y1, bz]] as Vec3[], uv: [[u(x0), v(y0)], [u(x1), v(y0)], [u(x1), v(y1)], [u(x0), v(y1)]] as [number, number][] }
    }
    const back = quads([rect(-W, st, W, C), rect(-W, F, W, sb), rect(-W, sb, -screen.hw, st), rect(screen.hw, sb, W, st)])
    // the side walls: u from the screen's end, v from the floor
    const sides = quads([
      { at: [[-W, F, near], [-W, F, z], [-W, C, z], [-W, C, near]], uv: [[1, 0], [0, 0], [0, 1], [1, 1]] },
      { at: [[W, F, z], [W, F, near], [W, C, near], [W, C, z]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] },
    ])
    // the ceiling: u across, v from the screen's end
    const ceiling = quads([{ at: [[W, C, near], [-W, C, near], [-W, C, z], [W, C, z]], uv: [[1, 1], [0, 1], [0, 0], [1, 0]] }])
    const rw = W - 0.6
    const rows = quads(HALL.rows.map(([rz, top]) => ({ at: [[-rw, top - 1.35, rz], [rw, top - 1.35, rz], [rw, top + 0.25, rz], [-rw, top + 0.25, rz]], uv: [[0, 0], [1, 0], [1, 1], [0, 1]] })))
    const beam = beamGeometry(HALL.lamp, [[-screen.hw, screen.y - screen.hh, z], [screen.hw, screen.y - screen.hh, z], [screen.hw, screen.y + screen.hh, z], [-screen.hw, screen.y + screen.hh, z]])
    return { back, sides, ceiling, rows, beam }
  }, [z, near, W, F, C, screen])
  React.useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  // one set of uniforms per part (their sizes differ; each frame sets the same light on all of them)
  const parts = React.useMemo(() => {
    const part = (size: [number, number], offset: [number, number] = [0, 0]) => ({
      uTime: { value: 0 }, uWeight: { value: 0 }, uFace: { value: 0 }, uHouse: { value: 1 },
      uSpill: { value: hsl(214, 30, 86) }, uLamp: { value: hsl(32, 80, 62) }, uGold: { value: theme.glow.clone() },
      uSize: { value: size }, uScreen: { value: [screen.hw, screen.hh] }, uOffset: { value: offset },
    })
    return [
      { geo: geos.back, PART: 0, uniforms: part([2 * W, C - F], [0, screen.y - (F + C) / 2]) },
      { geo: geos.sides, PART: 1, uniforms: part([depth, C - F]) },
      { geo: geos.ceiling, PART: 2, uniforms: part([2 * W, depth]) },
      { geo: geos.rows, PART: 3, uniforms: part([2 * (W - 0.6), 1.6], [HALL.aisle, 0]) },
    ]
  }, [geos, theme, W, F, C, depth, screen])
  const beamUniforms = React.useMemo(() => ({ uColor: { value: hsl(210, 40, 88) }, uTime: { value: 0 }, uWeight: { value: 0 }, uOpacity: { value: 0.06 } }), [])
  const beamMat = React.useRef<ShaderMaterial>(null)
  const partMats = React.useRef<(ShaderMaterial | null)[]>([])
  const face = React.useRef(0)
  const group = React.useRef<Group>(null)
  useFrame((_, dt) => {
    if (!live.place || !group.current) return
    const w = skyWeight(live.place, 2)
    group.current.visible = w > 0.002
    if (!group.current.visible) return
    const here = presence(live.place, 2)
    const tone = filmTone('client')
    face.current = damp(face.current, heroState.face, 2.2, Math.min(dt, 0.1))
    for (const m of partMats.current) {
      if (!m) continue
      const u = m.uniforms
      u.uWeight.value = w
      u.uTime.value = live.time
      u.uFace.value = face.current
      u.uHouse.value = 1 - 0.75 * here
      if (tone) (u.uSpill.value as Color).copy(tone)
    }
    // the projector's beam carries the film's light
    const bm = beamMat.current
    if (bm) {
      bm.uniforms.uWeight.value = w * (0.35 + 0.65 * here)
      bm.uniforms.uTime.value = live.time
      if (tone) (bm.uniforms.uColor.value as Color).copy(tone)
    }
  })
  return (
    <group ref={group} position={c} visible={false}>
      {parts.map((p) => (
        <mesh key={p.PART} geometry={p.geo} renderOrder={p.PART === 3 ? -2.5 : -2.8} frustumCulled={false}>
          <shaderMaterial ref={(el) => void (partMats.current[p.PART] = el)} vertexShader={HALL_VERT} fragmentShader={HALL_FRAG} defines={{ PART: p.PART }} uniforms={p.uniforms} transparent premultipliedAlpha depthWrite={false} />
        </mesh>
      ))}
      <FilmScreen film="client" era={2} station="client" size={[screen.hw * 2, screen.hh * 2]} position={[0, screen.y, z + 0.02]} weight={clientWeight} bright={0.72} renderOrder={-2.6} />
      <mesh geometry={geos.beam} renderOrder={-2.4} frustumCulled={false}>
        <shaderMaterial ref={beamMat} vertexShader={PROJECTOR_VERT} fragmentShader={PROJECTOR_FRAG} uniforms={beamUniforms} transparent depthWrite={false} side={DoubleSide} blending={AdditiveBlending} />
      </mesh>
    </group>
  )
}

// ── THE SUITE: TODAY — A CINEMA ON THE FLOOR ────────────────────────────────
//
// The Suite's films come one at a time, each a card of film standing on the floor behind the station, large,
// its light pooling at its foot (the owner, 2026-11-06: "make the bigger at the background and sit on the
// floor"). Each comes and goes its own way, chosen at random ("enter as a shooting star then turns into the
// strip then plays then after it throws randomly and disappear or turns back into the star … or can also fall
// on the floor and turn into one of the floor cards"):
//  · in: a shooting star streaks down and bursts into a line of light that opens into the card; or one of the
//    floor's frames stands up and grows into the card;
//  · out: thrown off to either side, turning, burning away; or folded back into a star that shoots off; or
//    tipped back onto the floor, where it shrinks into one of the floor's frames (never the same way twice
//    running).
// Its films (DECK_FILMS: the cartoons, nature, wildlife, time-lapses, an era montage) come from a shuffled bag,
// so none returns before the rest have played. The card leans toward the pointer; a click or a tap sends it
// on. Under reduced motion a card only fades, and changes only on a click.

const CINEMA = {
  /** Where its foot stands, from the station: on the floor (Structure's y), behind the screens. */
  at: [0, -10.5, -28] as Vec3,
  /** The picture's height (the card is taller by its strip; as wide as its film's own shape). */
  picture: 14,
  /** Seconds for each way in and out; the next card follows the last this long after it begins to leave. */
  enter: { star: 1.7, rise: 1.3, fade: 0.45 },
  leave: { throw: 1.15, star: 1.5, fall: 1.7, fade: 0.45 },
  overlap: 0.35,
  /** Where nothing plays (a still, or the film refused), a card holds this long. */
  hold: 9,
} as const
type Entry = keyof typeof CINEMA.enter
type Exit = keyof typeof CINEMA.leave
/** The picture's share of a card's height (FILM_FRAG's CARD: the strip's perforated edges take the rest). */
const STRIP = 0.74
/** The Suite floor's frames (STRUCTURE_FRAG mode 2): a cell, a frame's width inside it, the grid's origin. */
const FLOOR_CELL = { size: [5.4, 3.3], frame: 4.56, origin: 40 } as const
const CARD_SLOTS = [0, 1] as const

type Card = {
  film: string
  aspect: number
  phase: 'in' | 'play' | 'out'
  /** When its phase began (it may begin a moment ahead: the next card follows the last). */
  at: number
  entry: Entry
  exit: Exit
  /** Which way it is thrown, or its star flies (±1), which way it spins, how high it goes (−0.3 to 0.9). */
  side: number
  spin: number
  lift: number
  /** The floor frame it falls into: x and z from its foot. */
  cell: [number, number]
}

const easeIn = (t: number) => t * t
const easeInOut = (t: number) => t * t * (3 - 2 * t)
/** Past the end and back: a card standing up overshoots upright a little. */
const easeBack = (t: number) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2

/** The Suite's films in a shuffled order, each once before any returns, never the same twice running. */
class FilmBag {
  private bag: string[] = []
  private last = ''
  /** `first`: the film to start with (a held shot, a poster, always shows the same). */
  constructor(first?: string) {
    if (first) this.bag = [first]
  }
  peek() {
    if (!this.bag.length) {
      const b = [...DECK_FILMS]
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[b[i], b[j]] = [b[j], b[i]]
      }
      if (b.length > 1 && b[b.length - 1] === this.last) [b[0], b[b.length - 1]] = [b[b.length - 1], b[0]]
      this.bag = b
    }
    return this.bag[this.bag.length - 1]
  }
  next() {
    const f = this.peek()
    this.bag.pop()
    this.last = f
    return f
  }
}

function newCard(film: string, entry: Entry, at: number): Card {
  const spec = HERO_FILMS.find((f) => f.id === film)
  // a floor frame near its foot (the floor's grid in its own frame, +y away from the camera)
  const i = Math.floor(Math.random() * 6) - 3
  const j = 15 + Math.floor(Math.random() * 3)
  const fx = (i + 0.5) * FLOOR_CELL.size[0]
  const fy = (j + 0.5) * FLOOR_CELL.size[1] - FLOOR_CELL.origin
  const floorZ = STRUCTURE.suite.at[2]
  return {
    film, aspect: spec?.aspect ?? 16 / 9, phase: 'in', at, entry, exit: 'fade',
    side: Math.random() < 0.5 ? -1 : 1, spin: Math.random() < 0.5 ? -1 : 1, lift: Math.random() * 1.2 - 0.3,
    cell: [fx - CINEMA.at[0], floorZ - fy - CINEMA.at[2]],
  }
}

function pickExit(last: Exit | ''): Exit {
  const ways = (['throw', 'star', 'fall'] as const).filter((e) => e !== last)
  return ways[Math.floor(Math.random() * ways.length)]
}

function FloorCinema() {
  const geo = React.useMemo(() => new PlaneGeometry(1, 1), [])
  React.useEffect(() => () => geo.dispose(), [geo])
  // a held shot (`?shot=`, the posters): the first card already standing, always the same film, and it stays
  const posed = React.useMemo(() => new URLSearchParams(window.location.search).has('shot'), [])
  const bag = React.useMemo(() => new FilmBag(posed ? DECK_FILMS[0] : undefined), [posed])
  const cardUniforms = React.useMemo(
    () =>
      CARD_SLOTS.map(() => ({
        uMap: { value: null as Texture | null }, uHasMap: { value: 0 }, uTexel: { value: [1 / 854, 1 / 358] }, uTime: { value: 0 }, uWeight: { value: 0 }, uBright: { value: 1 },
        uScreen: { value: 16 / 9 }, uFilm: { value: 16 / 9 }, uBurn: { value: 0 }, uSheen: { value: -1 },
      })),
    [],
  )
  const cometUniforms = React.useMemo(() => CARD_SLOTS.map(() => ({ uColor: { value: hsl(42, 70, 90) }, uWeight: { value: 0 }, uLen: { value: 8 }, uWid: { value: 1.6 }, uFlare: { value: 0 } })), [])
  const poolUniforms = React.useMemo(() => ({ uColor: { value: hsl(214, 30, 86) }, uWeight: { value: 0 } }), [])
  const pivots = React.useRef<(Group | null)[]>([])
  const cardMeshes = React.useRef<(Mesh | null)[]>([])
  const cardMats = React.useRef<(ShaderMaterial | null)[]>([])
  const cometMeshes = React.useRef<(Mesh | null)[]>([])
  const cometMats = React.useRef<(ShaderMaterial | null)[]>([])
  const pool = React.useRef<Mesh>(null)
  const poolMat = React.useRef<ShaderMaterial>(null)
  const st = React.useRef({ cards: [null, null] as (Card | null)[], cur: 0, lastExit: '' as Exit | '', send: false, tiltX: 0, tiltY: 0 })
  const foot = React.useMemo(() => new Vector3(...NODES.suite).add(new Vector3(...CINEMA.at)), [])
  const tmp = React.useMemo(() => ({ head: new Vector3(), tail: new Vector3(), dir: new Vector3(), centre: new Vector3(), ndc: new Vector3(), ndc2: new Vector3() }), [])
  const invalidate = useThree((s) => s.invalidate)

  useFrame(({ camera, size }, dt) => {
    if (!live.place) return
    const d = Math.min(dt, 0.1)
    const w = skyWeight(live.place, 3)
    const s = st.current
    const now = live.time
    const reduced = heroState.reduced
    const Hc = CINEMA.picture / STRIP
    if (w <= 0.004) {
      for (const p of pivots.current) if (p) p.visible = false
      for (const m of cometMeshes.current) if (m) m.visible = false
      if (pool.current) pool.current.visible = false
      return
    }
    // the first card comes as the camera arrives
    let cur = s.cards[s.cur]
    if (!cur && presence(live.place, 3) > 0.5) cur = s.cards[s.cur] = newCard(bag.next(), reduced || posed ? 'fade' : 'star', posed ? now - 1 : now)
    if (cur) {
      prefetchFilm(cur.film)
      if (cur.phase === 'in' && now - cur.at >= CINEMA.enter[cur.entry]) {
        cur.phase = 'play'
        cur.at = now
      }
      // its film plays from as the card opens
      if (cur.phase === 'play' || (cur.phase === 'in' && now - cur.at > CINEMA.enter[cur.entry] * 0.6)) wantFilm(cur.film, w)
      if (cur.phase === 'play') {
        prefetchFilm(bag.peek())
        const ended = filmPlaying(cur.film) ? filmProgress(cur.film) > 0.975 : now - cur.at > CINEMA.hold
        const free = !s.cards[1 - s.cur]
        if (free && (s.send || (ended && w > 0.5 && !reduced && !posed))) {
          cur.phase = 'out'
          cur.at = now
          cur.exit = reduced ? 'fade' : pickExit(s.lastExit)
          s.lastExit = cur.exit
          s.cur = 1 - s.cur
          s.cards[s.cur] = newCard(bag.next(), reduced ? 'fade' : Math.random() < 0.6 ? 'star' : 'rise', now + (reduced ? 0 : CINEMA.overlap))
        }
      }
    }
    s.send = false
    for (const i of CARD_SLOTS) {
      const c = s.cards[i]
      if (c && c.phase === 'out' && now - c.at >= CINEMA.leave[c.exit]) {
        rewindFilm(c.film)
        s.cards[i] = null
      }
    }
    // the pointer on the playing card: it leans toward it
    tmp.ndc.set(foot.x, foot.y + Hc / 2, foot.z).project(camera)
    const near = tmp.ndc.z < 1 ? pointerNear(tmp.ndc.x, tmp.ndc.y, 0.3) * presence(live.place, 3) : 0
    s.tiltX += (-(live.pointer.y - tmp.ndc.y) * 0.4 * near - s.tiltX) * Math.min(1, d * 6)
    s.tiltY += ((live.pointer.x - tmp.ndc.x) * 0.3 * near - s.tiltY) * Math.min(1, d * 6)

    let stand = 0
    let moving = false
    for (const i of CARD_SLOTS) {
      const c = s.cards[i]
      const pivot = pivots.current[i]
      const card = cardMeshes.current[i]
      const comet = cometMeshes.current[i]
      const cm = cardMats.current[i]
      const km = cometMats.current[i]
      if (!pivot || !card || !comet || !cm || !km) continue
      if (!c || now < c.at) {
        pivot.visible = false
        comet.visible = false
        continue
      }
      const W = CINEMA.picture * c.aspect
      const el = now - c.at
      const centre = tmp.centre.set(foot.x, foot.y + Hc / 2, foot.z)
      let sx = 1, sy = 1, scale = 1, alpha = 1, bright = 0.72, burn = 0, up = 1
      let px = 0, py = 0, pz = 0, rx = 0, ry = 0, rz = 0
      let star = 0, flare = 0
      const head = tmp.head
      const dir = tmp.dir.set(0, 0, 0)
      if (c.phase === 'in') {
        moving = true
        const k = clamp01(el / CINEMA.enter[c.entry])
        if (c.entry === 'star') {
          if (k < 0.5) {
            // from high to one side and behind, down onto the card's middle, faster and faster
            const t = easeIn(k / 0.5)
            head.set(centre.x + c.side * 38 * (1 - t), centre.y + 26 * (1 - t) + Math.sin(t * Math.PI) * 3, centre.z - 12 * (1 - t))
            dir.set(-c.side * 38, -26, 12).normalize().multiplyScalar(4 + 14 * t)
            star = Math.min(1, k / 0.06)
            alpha = 0
            up = 0
          } else {
            // the burst: a line of light that widens into the strip, then opens into the picture
            const u = (k - 0.5) / 0.5
            head.copy(centre)
            star = (1 - u) ** 2
            flare = 1 - u * 0.5
            sx = easeOut(clamp01(u / 0.5))
            sy = u < 0.5 ? 0.03 : 0.03 + 0.97 * easeOut((u - 0.5) / 0.5)
            bright = 0.72 + 1.6 * (1 - u)
            up = sx * sy
          }
        } else if (c.entry === 'rise') {
          // one of the floor's frames stands up, growing into the card
          const t = easeBack(k)
          rx = (-Math.PI / 2) * (1 - t)
          scale = 0.3 + 0.7 * easeOut(k)
          alpha = clamp01(k * 4)
          up = clamp01(t)
        } else {
          alpha = easeOut(k)
          up = alpha
        }
      } else if (c.phase === 'out') {
        moving = true
        const k = clamp01(el / CINEMA.leave[c.exit])
        if (c.exit === 'throw') {
          const t = easeIn(k)
          px = c.side * 40 * t
          py = (2 + c.lift * 10) * t
          pz = 6 * t
          ry = -c.side * 1.0 * t
          rz = c.spin * 0.5 * t
          burn = c.side * clamp01((k - 0.08) / 0.92)
          alpha = 1 - clamp01((k - 0.85) / 0.15)
          up = 1 - t
        } else if (c.exit === 'star') {
          // folded to a line, the line to a point, the point a star flying off
          sy = 1 - 0.97 * easeIn(clamp01(k / 0.36))
          sx = 1 - easeIn(clamp01((k - 0.36) / 0.22))
          bright = 0.72 + 1.8 * clamp01(k / 0.5)
          alpha = sx > 0.01 ? 1 : 0
          up = sx * sy
          if (k > 0.5) {
            const u = clamp01((k - 0.5) / 0.5)
            const t = easeIn(u)
            head.set(centre.x + c.side * 34 * t, centre.y + (8 + c.lift * 10) * t, centre.z - 30 * t)
            dir.set(c.side * 34, 8 + c.lift * 10, -30).normalize().multiplyScalar(2 + 16 * t)
            star = Math.min(1, (k - 0.5) / 0.08) * (1 - clamp01((u - 0.7) / 0.3))
            flare = 1 - u
          } else if (k > 0.4) {
            head.copy(centre)
            star = (k - 0.4) / 0.1
            flare = star
          }
        } else if (c.exit === 'fall') {
          // tipped back onto the floor, faster and faster, a small bounce as it lands; then it shrinks into
          // one of the floor's frames and fades into it
          const u1 = clamp01(k / 0.5)
          const bounce = k > 0.5 ? Math.sin(clamp01((k - 0.5) / 0.14) * Math.PI) * 0.06 : 0
          rx = (-Math.PI / 2) * easeIn(u1) + bounce
          const u2 = easeInOut(clamp01((k - 0.58) / 0.3))
          scale = 1 + (FLOOR_CELL.frame / W - 1) * u2
          px = c.cell[0] * u2
          py = 0.05 * u1
          pz = (c.cell[1] + (Hc * scale) / 2) * u2
          alpha = 1 - clamp01((k - 0.82) / 0.18)
          up = 1 - u1
        } else {
          alpha = 1 - easeOut(k)
          up = alpha
        }
      }
      const playing = c.phase === 'play'
      pivot.visible = alpha > 0.002
      pivot.position.set(foot.x + px, foot.y + py, foot.z + pz)
      pivot.rotation.set(rx, ry, rz)
      pivot.scale.setScalar(scale)
      card.position.set(0, Hc / 2, 0)
      card.scale.set(W * Math.max(sx, 0.001), Hc * Math.max(sy, 0.001), 1)
      card.rotation.set(playing ? s.tiltX : 0, playing ? s.tiltY : 0, 0)
      const u = cm.uniforms
      const pic = filmPicture(c.film)
      if (u.uMap.value !== pic) {
        u.uMap.value = pic
        u.uHasMap.value = pic ? 1 : 0
      }
      u.uScreen.value = c.aspect
      u.uFilm.value = c.aspect
      u.uTime.value = now
      u.uWeight.value = w * alpha
      u.uBright.value = bright * (1 + 0.25 * (i === s.cur ? watching.suite.now : 0))
      u.uBurn.value = burn
      u.uSheen.value = playing ? -0.5 + ((now - c.at) * 0.6) % 3 : -1
      if (i === s.cur) stand = Math.max(stand, up * alpha)
      // the star: a quad facing the camera, along its flight on screen
      comet.visible = star > 0.002
      if (comet.visible) {
        const wid = 1.6 * (1 + flare * 1.2)
        const len = dir.length()
        tmp.tail.copy(head).sub(dir)
        comet.position.copy(head).add(tmp.tail).multiplyScalar(0.5)
        comet.quaternion.copy(camera.quaternion)
        tmp.ndc.copy(head).project(camera)
        tmp.ndc2.copy(tmp.tail).project(camera)
        const aspect = size.width / Math.max(1, size.height)
        comet.rotateZ(len > 0.01 ? Math.atan2(tmp.ndc.y - tmp.ndc2.y, (tmp.ndc.x - tmp.ndc2.x) * aspect) : 0)
        comet.scale.set(len + wid, wid, 1)
        const k = km.uniforms
        k.uLen.value = len + wid
        k.uWid.value = wid
        k.uFlare.value = flare
        k.uWeight.value = w * star
      }
    }
    // the card's light on the floor at its foot
    const pm = poolMat.current
    const cur2 = s.cards[s.cur]
    if (pool.current && pm) {
      pool.current.visible = stand > 0.01 && !!cur2
      if (cur2) {
        pool.current.scale.set(CINEMA.picture * cur2.aspect * 1.25, 7, 1)
        const tone = filmTone(cur2.film)
        if (tone) (pm.uniforms.uColor.value as Color).copy(tone)
      }
      pm.uniforms.uWeight.value = w * stand
    }
    if (moving) invalidate()
  })
  const handlers = (i: number) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      const c = st.current.cards[i]
      if (st.current.cur !== i || c?.phase !== 'play') return
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
      const c = st.current.cards[i]
      if (st.current.cur !== i || c?.phase !== 'play') return
      e.stopPropagation()
      st.current.send = true
      invalidate()
    },
  })
  return (
    <group>
      {CARD_SLOTS.map((i) => (
        <group key={i} ref={(el) => void (pivots.current[i] = el)} visible={false}>
          <mesh ref={(el) => void (cardMeshes.current[i] = el)} geometry={geo} renderOrder={-6} {...handlers(i)}>
            <shaderMaterial ref={(el) => void (cardMats.current[i] = el)} vertexShader={FILM_VERT} fragmentShader={FILM_FRAG} defines={{ ERA: 2, CARD: 1 }} uniforms={cardUniforms[i]} transparent depthWrite={false} side={DoubleSide} />
          </mesh>
        </group>
      ))}
      {CARD_SLOTS.map((i) => (
        <mesh key={i} ref={(el) => void (cometMeshes.current[i] = el)} geometry={geo} renderOrder={-5.5} visible={false} frustumCulled={false}>
          <shaderMaterial ref={(el) => void (cometMats.current[i] = el)} vertexShader={FILM_VERT} fragmentShader={COMET_FRAG} uniforms={cometUniforms[i]} transparent depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ))}
      <mesh ref={pool} geometry={geo} position={[foot.x, foot.y + 0.03, foot.z + 3.5]} rotation-x={-Math.PI / 2} renderOrder={-5.9} visible={false}>
        <shaderMaterial ref={poolMat} vertexShader={FILM_VERT} fragmentShader={POOL_FRAG} uniforms={poolUniforms} transparent depthWrite={false} blending={AdditiveBlending} />
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
          <LedVolume />
        </>
      ) : id === 'client' ? (
        <>
          <Hall theme={theme} />
        </>
      ) : (
        <FloorCinema />
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
