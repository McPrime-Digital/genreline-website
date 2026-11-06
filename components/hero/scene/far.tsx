'use client'
/**
 * THE FAR WORLDS — film things in the form of planets, very far off (shaders.ts FAR_*): the Reel World (a
 * world whose face is a turning film reel, ringed by a strip of film), the Can Moon (a film can), and the
 * Projector Star (a far lamp throwing its beam — the owner, 2026-11-06: "i love the artifact that … throws
 * a projector for a short film in the outerspace … add two at every background change top and down").
 *
 * Every universe (universe.ts) has its own: drawn from its seed — one or two worlds, each its own metal or
 * lacquer and reel, and always two projectors, one high and one low, each its own lamp — placed in the
 * frame of the universe's home shot, clear of the words. When the universe changes they drift out with it
 * and the new ones come in with the new. They hang at infinity: a fixed direction from the camera.
 *
 * The pointer (or a finger) near one: it pops a little, on a spring, and reveals what it holds — the Reel
 * World's windows glow and its ring's frames light, the Can Moon's lid slides off a glowing reel, the
 * Projector Star throws a short film of the tour's frames.
 */
import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, NormalBlending, SRGBColorSpace, Texture, Vector3, Vector4, type Mesh, type PerspectiveCamera, type ShaderMaterial } from 'three'
import { heroState } from '@/components/hero/state'
import { live, makeView, pointerNear, readyView, shotView } from '@/components/hero/scene/rig'
import { FAR_FRAG, FAR_VERT } from '@/components/hero/scene/shaders'
import { PALETTES, universe, type Universe } from '@/components/hero/scene/universe'
import { uploadSoon } from '@/components/hero/scene/textures'
import { FILM_ATLAS } from '@/content/hero-films'
import type { Shot } from '@/components/hero/scene/numbers'

type Kind = 0 | 1 | 2
/** One far thing of a universe: its kind, where it hangs in its home frame (−1…1, y up), its size (a share of the frame's height), its look. */
type Body = { kind: Kind; x: number; y: number; size: number; turn: number; tint: [number, number, number]; variant: number }

/** Where they may hang: per frame (the title, the close, a space), wide and tall — worlds, a high projector, a low one. */
type Zones = { worlds: [number, number][]; high: [number, number, number][]; low: [number, number, number][] }
const ZONES: Record<'title' | 'close' | 'space', { wide: Zones; tall: Zones }> = {
  title: {
    wide: { worlds: [[-0.42, 0.6], [-0.74, 0.64], [0.86, 0.5], [-0.18, 0.66]], high: [[-0.6, 0.7, 0], [0.32, 0.7, Math.PI]], low: [[-0.93, -0.45, 0], [-0.93, -0.64, 0]] },
    tall: { worlds: [[-0.8, 0.55], [0.6, 0.58]], high: [[-0.86, 0.66, 0]], low: [[-0.88, -0.2, 0]] },
  },
  close: {
    wide: { worlds: [[-0.55, 0.42], [0.76, 0.18], [0.8, 0.55]], high: [[0.32, 0.7, Math.PI]], low: [[0.42, -0.5, 0]] },
    tall: { worlds: [[-0.72, 0.5], [0.66, 0.56]], high: [[-0.86, 0.66, 0]], low: [[-0.88, 0.02, 0]] },
  },
  space: {
    wide: { worlds: [[-0.86, 0.55], [0.88, 0.45], [-0.88, 0.18], [0.9, -0.02]], high: [[-0.52, 0.68, 0], [0.45, 0.68, Math.PI]], low: [[0.25, -0.78, 0], [0.95, -0.7, Math.PI]] },
    tall: { worlds: [[-0.7, 0.62], [0.82, 0.2]], high: [[-0.86, 0.52, 0]], low: [[0.86, -0.05, Math.PI]] },
  },
}
/** The worlds' metals and lacquers, and the lamps' lights. */
const REEL_METALS: [number, number, number][] = [[0.66, 0.52, 0.3], [0.62, 0.63, 0.66], [0.72, 0.44, 0.28], [0.3, 0.3, 0.34]]
const CAN_FINISHES: [number, number, number][] = [[0.5, 0.51, 0.55], [0.55, 0.13, 0.14], [0.17, 0.3, 0.56], [0.62, 0.5, 0.26]]
const LAMPS: [number, number, number][] = [[1.0, 0.93, 0.8], [0.84, 0.92, 1.0], [1.0, 0.8, 0.55]]

/** How far out they hang (inside the camera's far plane). */
const DISTANCE = 800
/** Per kind: how much distance haze, the body's radius on its square, how far round it the pointer reaches. */
const KIND = [
  { haze: 0.1, body: 1 / 2.45, reach: 0.85 },
  { haze: 0.2, body: 1 / 1.3, reach: 1.1 },
  { haze: 0.22, body: 0, reach: 0 },
] as const
const STAR = { length: 7, lamp: 0.6 } as const
/** The pool: how many of each kind can show at once (two universes during a change). */
const POOL: readonly Kind[] = [0, 0, 1, 1, 2, 2, 2, 2]

/** The bodies' discs on screen, for the stars to hide behind (slots 0–2; the sky keeps slot 3). */
export const farDiscs = [new Vector4(), new Vector4(), new Vector4(), new Vector4()]
/** The films' stills, once they have arrived: the ring's frames, the projector's short film, the Suite's floor. */
export const farAtlas = { texture: null as Texture | null }

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
/** A universe's far things, drawn from its seed (and kept for its life). */
const BODIES = new WeakMap<Universe, { wide: Body[]; tall: Body[] }>()
function bodiesOf(u: Universe) {
  let b = BODIES.get(u)
  if (b) return b
  const make = (tall: boolean): Body[] => {
    const r = rng(u.seed * 7919 + u.kind * 131 + u.palette * 17 + (tall ? 3 : 0))
    const zones = ZONES[u.home === 0 ? 'title' : u.home === 4 ? 'close' : 'space'][tall ? 'tall' : 'wide']
    const out: Body[] = []
    const pal = PALETTES[u.palette]
    // one or two worlds, in two different places
    const spots = zones.worlds.map((z) => ({ z, o: r() })).sort((a, b) => a.o - b.o).map((s) => s.z)
    const nWorlds = 1 + (r() < 0.55 ? 1 : 0)
    for (let i = 0; i < Math.min(nWorlds, spots.length); i++) {
      const kind: Kind = r() < 0.55 ? 0 : 1
      const [x, y] = spots[i]
      out.push({
        kind,
        x: x + (r() - 0.5) * 0.06,
        y: y + (r() - 0.5) * 0.05,
        size: (kind === 0 ? 0.085 + r() * 0.03 : 0.038 + r() * 0.014) * (tall ? 0.78 : 1),
        turn: 0,
        tint: kind === 0 ? REEL_METALS[Math.floor(r() * REEL_METALS.length)] : CAN_FINISHES[Math.floor(r() * CAN_FINISHES.length)],
        variant: r(),
      })
    }
    // two projectors: one high, one low, each throwing toward the middle of the frame
    for (const list of [zones.high, zones.low]) {
      const [x, y, turn] = list[Math.floor(r() * list.length)]
      const lamp: [number, number, number] = r() < 0.4 ? [pal[2][0], pal[2][1], pal[2][2]] : LAMPS[Math.floor(r() * LAMPS.length)]
      out.push({ kind: 2, x, y: y + (r() - 0.5) * 0.04, size: (0.05 + r() * 0.012) * (tall ? 0.8 : 1), turn, tint: lamp, variant: r() })
    }
    return out
  }
  b = { wide: make(false), tall: make(true) }
  BODIES.set(u, b)
  return b
}

const HOME_VIEW = makeView()
const READY_VIEW = makeView()
const F = new Vector3()
const UP = new Vector3(0, 1, 0)
const POS = new Vector3()
const NDC = new Vector3()
const RIGHT = new Vector3()
const CUP = new Vector3()

type Home = { f: Vector3; r: Vector3; u: Vector3; tan: number; fx: number; fy: number }
function homeOf(shot: Shot, tall: boolean, aspect: number): Home {
  shotView(shot, tall, aspect, 0.5, HOME_VIEW)
  // the title readied for the tour: the camera turned to give the logo the whole stage — its far things keep their places
  if (shot === 0 && live.readied > 0.001) {
    readyView(tall, aspect, READY_VIEW)
    HOME_VIEW.pos.lerp(READY_VIEW.pos, live.readied)
    HOME_VIEW.look.lerp(READY_VIEW.look, live.readied)
    HOME_VIEW.fov += (READY_VIEW.fov - HOME_VIEW.fov) * live.readied
    HOME_VIEW.shift[0] += (READY_VIEW.shift[0] - HOME_VIEW.shift[0]) * live.readied
    HOME_VIEW.shift[1] += (READY_VIEW.shift[1] - HOME_VIEW.shift[1]) * live.readied
  }
  const f = HOME_VIEW.look.clone().sub(HOME_VIEW.pos).normalize()
  const r = f.clone().cross(UP).normalize()
  return { f, r, u: r.clone().cross(f), tan: Math.tan((HOME_VIEW.fov * Math.PI) / 360), fx: 2 * HOME_VIEW.shift[0], fy: 2 * HOME_VIEW.shift[1] }
}

type Show = { body: Body; u: Universe; w: number; leaving: boolean; key: string }

export function FarWorlds() {
  const meshes = React.useRef<(Mesh | null)[]>([])
  const mats = React.useRef<(ShaderMaterial | null)[]>([])
  // each pool slot's state: whose body it shows, and its pop, spring and reveal
  const slots = React.useRef(POOL.map(() => ({ key: '', pop: 0, vel: 0, reveal: 0, spin: 0 })))
  const uniforms = React.useMemo(
    () =>
      POOL.map((kind) => ({
        uTime: { value: 0 }, uSpin: { value: 0 }, uReveal: { value: 0 }, uOpacity: { value: 0 }, uHazeK: { value: KIND[kind].haze }, uHaze: { value: new Vector3(0.1, 0.1, 0.14) },
        uAspect: { value: kind === 2 ? STAR.length * 2 : 1 }, uAtlas: { value: null as Texture | null }, uAtlasOn: { value: 0 }, uTint: { value: new Vector3(1, 1, 1) }, uVariant: { value: 0 },
      })),
    [],
  )

  // the films' stills, for the frames the far worlds reveal: fetched as soon as the scene is up (a few KB)
  React.useEffect(() => {
    let alive = true
    let made: Texture | null = null
    const t = window.setTimeout(() => {
      fetch(FILM_ATLAS)
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((blob) => createImageBitmap(blob, { imageOrientation: 'flipY' }))
        .then(async (bitmap) => {
          if (!alive) return
          const tex = new Texture(bitmap as unknown as HTMLImageElement)
          tex.colorSpace = SRGBColorSpace
          tex.flipY = false
          tex.needsUpdate = true
          made = tex
          await uploadSoon(tex)
          if (alive) farAtlas.texture = tex
        })
        .catch(() => {})
    }, 600)
    return () => {
      alive = false
      window.clearTimeout(t)
      farAtlas.texture = null
      made?.dispose()
    }
  }, [])

  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.1)
    const lens = camera as PerspectiveCamera
    const tall = live.tall
    const aspect = live.aspect
    const tanNow = Math.tan((lens.fov * Math.PI) / 360)
    const { from, to, k } = universe
    RIGHT.setFromMatrixColumn(camera.matrixWorld, 0)
    CUP.setFromMatrixColumn(camera.matrixWorld, 1)
    for (let i = 0; i < 3; i++) farDiscs[i].set(0, 0, 0, 0)
    let disc = 0
    // the bodies to show: the leaving universe's and the arriving one's
    const shows: Show[] = []
    const add = (u: Universe | null, w: number, leaving: boolean) => {
      if (!u || w < 0.004) return
      bodiesOf(u)[tall ? 'tall' : 'wide'].forEach((body, i) => shows.push({ body, u, w, leaving, key: `${u.seed}.${u.kind}.${u.palette}.${u.home}.${i}` }))
    }
    add(from, to ? Math.pow(1 - k, 1.4) : 1, !!to)
    add(to, to ? Math.pow(k, 1.1) : 0, false)
    const homes = new Map<Shot, Home>()
    // a body keeps the pool slot it had, so its pop and reveal carry on; the rest take free slots of their kind
    const assigned: (Show | null)[] = POOL.map(() => null)
    for (const sh of shows) {
      const keep = slots.current.findIndex((st, i) => st.key === sh.key && POOL[i] === sh.body.kind && !assigned[i])
      const free = keep >= 0 ? keep : POOL.findIndex((kind, i) => kind === sh.body.kind && !assigned[i] && !shows.some((o) => o !== sh && slots.current[i].key === o.key))
      if (free >= 0) assigned[free] = sh
    }
    POOL.forEach((kind, i) => {
      const m = meshes.current[i]
      const mat = mats.current[i]
      if (!m || !mat) return
      const a = assigned[i]
      const st = slots.current[i]
      m.visible = !!a
      if (!a) {
        st.key = ''
        st.pop = st.vel = st.reveal = 0
        return
      }
      const { body, u, w, leaving } = a
      // the title's own far things stand exactly where its poster shows them: the poster is scaled and placed
      // to put the logo where the camera does, and the same scaling places them — so when the scene takes
      // over from the poster, at any screen's shape, nothing jumps
      let bx = body.x
      let by = body.y
      let bs = body.size
      const pm = heroState.posterMap
      if (u.home === 0 && pm && pm.tall === tall) {
        bx = ((pm.x0 + ((body.x + 1) / 2) * pm.pw * pm.k) / pm.w) * 2 - 1
        by = 1 - ((pm.y0 + ((1 - body.y) / 2) * pm.ph * pm.k) / pm.h) * 2
        bs = (body.size * pm.ph * pm.k) / pm.h
      }
      if (st.key !== a.key) {
        st.key = a.key
        st.pop = st.vel = st.reveal = 0
        st.spin = body.variant * 6
      }
      let h = homes.get(u.home)
      if (!h) homes.set(u.home, (h = homeOf(u.home, tall, aspect)))
      // on a change: the old drift out past the frame, the new come in from the middle distance
      const arriving = !!to && u === to
      const spread = leaving ? 1 + 0.55 * k : arriving ? 0.55 + 0.45 * k : 1
      const grow = leaving ? 1 + 0.35 * k : arriving ? 0.6 + 0.4 * k : 1
      F.copy(h.f)
        .addScaledVector(h.r, (bx * spread - h.fx) * h.tan * aspect)
        .addScaledVector(h.u, (by * spread - h.fy) * h.tan)
        .normalize()
      POS.copy(camera.position).addScaledVector(F, DISTANCE)
      NDC.copy(POS).project(camera)
      const behind = NDC.z > 1
      const near = behind ? 0 : pointerNear(NDC.x, NDC.y, kind === 2 ? 0.05 : (bs / 2) * KIND[kind].reach)
      if (heroState.reduced) {
        st.pop = near
        st.reveal = near > 0.3 ? 1 : 0
      } else {
        st.vel += ((near - st.pop) * 170 - st.vel * 17) * d
        st.pop += st.vel * d
        st.reveal += ((near > 0.3 ? 1 : 0) - st.reveal) * Math.min(1, d * (near > 0.3 ? 3.2 : 2.2))
        st.spin += d * (kind === 0 ? 0.05 + st.reveal * 0.5 : 0.25 + st.reveal * 1.4)
      }
      const scale = bs * 2 * DISTANCE * tanNow * grow * (1 + 0.12 * st.pop)
      m.quaternion.copy(camera.quaternion)
      if (kind === 2) {
        // the square is the beam: its lamp near one end, the frame it throws at the other
        m.rotateZ(body.turn)
        m.scale.set(scale * STAR.length, scale, 1)
        const along = (STAR.length / 2 - STAR.lamp / 2) * scale
        m.position.copy(POS).addScaledVector(RIGHT, Math.cos(body.turn) * along).addScaledVector(CUP, Math.sin(body.turn) * along)
      } else {
        m.scale.set(scale, scale, 1)
        m.position.copy(POS)
        if (disc < 3 && !behind) farDiscs[disc++].set(NDC.x, NDC.y, (bs / 2) * KIND[kind].body * 2 * grow * (1 + 0.12 * st.pop), w)
      }
      const un = mat.uniforms
      un.uTime.value = live.time
      un.uSpin.value = st.spin
      un.uReveal.value = Math.min(1, Math.max(0, st.reveal))
      un.uOpacity.value = w
      ;(un.uTint.value as Vector3).set(body.tint[0], body.tint[1], body.tint[2])
      un.uVariant.value = body.variant
      const pal = PALETTES[u.palette][1]
      ;(un.uHaze.value as Vector3).set(pal[0] * 0.18, pal[1] * 0.18, pal[2] * 0.2)
      un.uAtlas.value = farAtlas.texture
      un.uAtlasOn.value = farAtlas.texture ? 1 : 0
    })
  })

  return (
    <group>
      {POOL.map((kind, i) => (
        <mesh key={i} ref={(el) => void (meshes.current[i] = el)} renderOrder={-15} frustumCulled={false} visible={false}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            ref={(el) => void (mats.current[i] = el)}
            vertexShader={FAR_VERT}
            fragmentShader={FAR_FRAG}
            defines={{ KIND: kind }}
            uniforms={uniforms[i]}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={kind === 2 ? AdditiveBlending : NormalBlending}
          />
        </mesh>
      ))}
    </group>
  )
}
