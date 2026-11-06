'use client'
/**
 * THE FAR WORLDS — three film things in the form of planets, very far off
 * (shaders.ts FAR_*): the Reel World, a planet wound from film with a ring of
 * film strip; the Can Moon, a film can; the Projector Star, a far lamp
 * throwing its beam across the sky.
 *
 * Each galaxy (universe.ts) has its own three, placed in the frame of its own
 * home shot (the title's for today's galaxy, each space's for its own), so
 * each space shows its own, kept clear of the words. They hang at infinity: a
 * fixed direction from the camera, DISTANCE out — the camera turning moves
 * them, its travelling never brings them nearer. On a journey between galaxies
 * the old ones drift out past the edges and fade, the new ones come in from
 * the middle distance.
 *
 * The pointer (or a finger) near one: it pops a little, on a spring, and
 * reveals what it holds — the Reel World's frames light from within, the
 * Can Moon's lid slides off a glowing reel, the Projector Star throws a frame.
 */
import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, NormalBlending, SRGBColorSpace, Texture, Vector3, Vector4, type Mesh, type PerspectiveCamera, type ShaderMaterial } from 'three'
import { heroState } from '@/components/hero/state'
import { live, makeView, pointerNear, readyView, shotView } from '@/components/hero/scene/rig'
import { FAR_FRAG, FAR_VERT } from '@/components/hero/scene/shaders'
import { GALAXIES, universe } from '@/components/hero/scene/universe'
import { hsl, uploadSoon } from '@/components/hero/scene/textures'
import { FILM_ATLAS } from '@/content/hero-films'
import type { Shot } from '@/components/hero/scene/numbers'

type Kind = 0 | 1 | 2
/** Where one hangs, in its home shot's frame (−1…1, y up); its size, a share of the frame's height; the beam's heading (the star). */
type Place = { kind: Kind; x: number; y: number; size: number; turn?: number }

/** Each galaxy's three, wide frames and tall. The Reel World is the nearest (the least haze), the star the farthest. */
const PLACES: readonly { wide: readonly Place[]; tall: readonly Place[] }[] = [
  // today — the title: the reel above the words, the can high on the right beyond the Suite, the projector low on the left under the buttons
  {
    wide: [{ kind: 0, x: -0.42, y: 0.6, size: 0.095 }, { kind: 1, x: 0.84, y: 0.5, size: 0.045 }, { kind: 2, x: -0.93, y: -0.45, size: 0.05, turn: 0 }],
    tall: [{ kind: 0, x: -0.8, y: 0.55, size: 0.075 }, { kind: 1, x: 0.6, y: 0.58, size: 0.035 }, { kind: 2, x: -0.88, y: -0.2, size: 0.04, turn: 0 }],
  },
  // the silent era — Crew
  {
    wide: [{ kind: 0, x: -0.84, y: 0.5, size: 0.1 }, { kind: 1, x: 0.9, y: 0.02, size: 0.045 }, { kind: 2, x: 0.3, y: 0.72, size: 0.05, turn: Math.PI }],
    tall: [{ kind: 0, x: -0.7, y: 0.62, size: 0.07 }, { kind: 1, x: -0.78, y: 0.15, size: 0.034 }, { kind: 2, x: 0.1, y: 0.8, size: 0.04, turn: Math.PI }],
  },
  // the golden age — Client
  {
    wide: [{ kind: 0, x: 0.86, y: 0.52, size: 0.1 }, { kind: 1, x: -0.9, y: 0.62, size: 0.045 }, { kind: 2, x: -0.5, y: 0.72, size: 0.05, turn: 0 }],
    tall: [{ kind: 0, x: 0.74, y: 0.36, size: 0.07 }, { kind: 1, x: -0.72, y: 0.7, size: 0.034 }, { kind: 2, x: -0.1, y: 0.8, size: 0.04, turn: 0 }],
  },
  // the digital present — the Suite
  {
    wide: [{ kind: 0, x: -0.86, y: 0.58, size: 0.1 }, { kind: 1, x: 0.9, y: 0.42, size: 0.045 }, { kind: 2, x: 0.2, y: 0.74, size: 0.05, turn: Math.PI }],
    tall: [{ kind: 0, x: -0.7, y: 0.64, size: 0.07 }, { kind: 1, x: 0.82, y: 0.2, size: 0.034 }, { kind: 2, x: 0.1, y: 0.8, size: 0.04, turn: Math.PI }],
  },
]
/** Today's three again at the close (the tour's end returns to today's galaxy): placed in its own frame, clear of its words. */
const PLACES_CLOSE: { wide: readonly Place[]; tall: readonly Place[] } = {
  wide: [{ kind: 0, x: -0.55, y: 0.42, size: 0.095 }, { kind: 1, x: 0.76, y: 0.18, size: 0.045 }, { kind: 2, x: 0.42, y: -0.5, size: 0.05, turn: 0 }],
  tall: [{ kind: 0, x: -0.72, y: 0.5, size: 0.075 }, { kind: 1, x: 0.66, y: 0.56, size: 0.035 }, { kind: 2, x: -0.88, y: 0.02, size: 0.04, turn: 0 }],
}
/** Each galaxy's home shot (today's: the title, or the close when the camera is there). */
const HOME: readonly Shot[] = [0, 1, 2, 3]
/** How far out they hang (inside the camera's far plane). */
const DISTANCE = 800
/** Per kind: how much distance haze, the body's radius on its square (for the pointer and the stars it hides), the projector's length. */
const KIND = [
  { haze: 0.1, body: 1 / 2.45, reach: 0.85 },
  { haze: 0.2, body: 1 / 1.3, reach: 1.1 },
  { haze: 0.28, body: 0, reach: 0 },
] as const
const STAR = { length: 7, lamp: 0.6 } as const

/** The bodies' discs on screen, for the stars to hide behind (read by HeroScene's Stars). */
export const farDiscs = [new Vector4(), new Vector4(), new Vector4(), new Vector4()]
/** The films' stills, once they have arrived (films.ts): the ring's frames and the projector's frame show them. */
export const farAtlas = { texture: null as Texture | null }

type Body = { galaxy: number; index: number }
const BODIES: Body[] = GALAXIES.flatMap((_, galaxy) => [0, 1, 2].map((index) => ({ galaxy, index })))

const HOME_VIEW = makeView()
const READY_VIEW = makeView()
const F = new Vector3()
const UP = new Vector3(0, 1, 0)
const POS = new Vector3()
const NDC = new Vector3()
const RIGHT = new Vector3()
const CUP = new Vector3()

export function FarWorlds() {
  const meshes = React.useRef<(Mesh | null)[]>([])
  const mats = React.useRef<(ShaderMaterial | null)[]>([])
  const state = React.useRef(BODIES.map((_, i) => ({ pop: 0, vel: 0, reveal: 0, spin: i * 1.7 })))
  const uniforms = React.useMemo(
    () =>
      BODIES.map(({ galaxy, index }) => {
        const kind = PLACES[galaxy].wide[index].kind
        const haze = hsl(...(GALAXIES[galaxy].b as [number, number, number])).multiplyScalar(1.6)
        return {
          uTime: { value: 0 }, uSpin: { value: 0 }, uReveal: { value: 0 }, uOpacity: { value: 0 }, uHazeK: { value: KIND[kind].haze }, uHaze: { value: haze },
          uAspect: { value: kind === 2 ? STAR.length * 2 : 1 }, uAtlas: { value: null as Texture | null }, uAtlasOn: { value: 0 },
        }
      }),
    [],
  )

  // the films' stills, for the frames the far worlds reveal: fetched once the scene has settled (a few KB)
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
    }, 2500)
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
    const travelling = from !== to
    RIGHT.setFromMatrixColumn(camera.matrixWorld, 0)
    CUP.setFromMatrixColumn(camera.matrixWorld, 1)
    let disc = 0
    for (const v of farDiscs) v.set(0, 0, 0, 0)
    // each visible galaxy's home view: where its three hang
    // (its lens is shifted to put its subject in the room the words leave: straight ahead lands at fx, fy on screen)
    const homes: Record<number, { f: Vector3; r: Vector3; u: Vector3; tan: number; fx: number; fy: number }> = {}
    const pl = live.place
    const atClose = !!pl && ((pl.seg.kind === 'hold' && pl.seg.shot === 4) || (pl.seg.kind === 'travel' && pl.seg.to === 4))
    const homeOf = (g: number): Shot => (g === 0 && atClose ? 4 : HOME[g])
    for (const g of travelling ? [from, to] : [from]) {
      shotView(homeOf(g), tall, aspect, 0.5, HOME_VIEW)
      // the title readied for the tour: the camera has turned to give the logo the whole stage — today's
      // three keep their places in the frame as it turns
      if (homeOf(g) === 0 && live.readied > 0.001) {
        readyView(tall, aspect, READY_VIEW)
        HOME_VIEW.pos.lerp(READY_VIEW.pos, live.readied)
        HOME_VIEW.look.lerp(READY_VIEW.look, live.readied)
        HOME_VIEW.fov += (READY_VIEW.fov - HOME_VIEW.fov) * live.readied
        HOME_VIEW.shift[0] += (READY_VIEW.shift[0] - HOME_VIEW.shift[0]) * live.readied
        HOME_VIEW.shift[1] += (READY_VIEW.shift[1] - HOME_VIEW.shift[1]) * live.readied
      }
      const f = HOME_VIEW.look.clone().sub(HOME_VIEW.pos).normalize()
      const r = f.clone().cross(UP).normalize()
      homes[g] = { f, r, u: r.clone().cross(f), tan: Math.tan((HOME_VIEW.fov * Math.PI) / 360), fx: 2 * HOME_VIEW.shift[0], fy: 2 * HOME_VIEW.shift[1] }
    }
    BODIES.forEach(({ galaxy, index }, i) => {
      const m = meshes.current[i]
      const mat = mats.current[i]
      if (!m || !mat) return
      const w = galaxy === from ? (travelling ? Math.pow(1 - k, 1.4) : 1) : galaxy === to && travelling ? Math.pow(k, 1.1) : 0
      m.visible = w > 0.004
      const s = state.current[i]
      if (!m.visible) {
        s.pop = s.vel = s.reveal = 0
        return
      }
      const set = galaxy === 0 && atClose ? PLACES_CLOSE : PLACES[galaxy]
      const place = (tall ? set.tall : set.wide)[index]
      const kind = place.kind
      // on a journey: the old drift outward past the frame, the new come in from the middle distance
      const leaving = travelling && galaxy === from
      const spread = leaving ? 1 + 0.55 * k : travelling ? 0.55 + 0.45 * k : 1
      const grow = leaving ? 1 + 0.35 * k : travelling ? 0.6 + 0.4 * k : 1
      const h = homes[galaxy]
      F.copy(h.f)
        .addScaledVector(h.r, (place.x * spread - h.fx) * h.tan * aspect)
        .addScaledVector(h.u, (place.y * spread - h.fy) * h.tan)
        .normalize()
      POS.copy(camera.position).addScaledVector(F, DISTANCE)
      // the pointer near it: pop on a spring, and reveal
      NDC.copy(POS).project(camera)
      const behind = NDC.z > 1
      const radius = (place.size / 2) * (kind === 2 ? 0.0 : KIND[kind].body)
      const near = behind ? 0 : pointerNear(NDC.x, NDC.y, kind === 2 ? 0.045 : (place.size / 2) * KIND[kind].reach)
      if (heroState.reduced) {
        s.pop = near
        s.reveal = near > 0.3 ? 1 : 0
      } else {
        s.vel += ((near - s.pop) * 170 - s.vel * 17) * d
        s.pop += s.vel * d
        s.reveal += ((near > 0.3 ? 1 : 0) - s.reveal) * Math.min(1, d * (near > 0.3 ? 3.2 : 2.2))
        s.spin += d * (kind === 0 ? 0.05 + s.reveal * 0.5 : 0.25 + s.reveal * 1.4)
      }
      const scale = place.size * 2 * DISTANCE * tanNow * grow * (1 + 0.12 * s.pop)
      m.quaternion.copy(camera.quaternion)
      if (kind === 2) {
        // the square is the beam: its lamp sits near one end, the frame it throws at the other
        const turn = place.turn ?? 0
        m.rotateZ(turn)
        m.scale.set(scale * STAR.length, scale, 1)
        const along = (STAR.length / 2 - (STAR.lamp * 1) / 2) * scale
        m.position.copy(POS).addScaledVector(RIGHT, Math.cos(turn) * along).addScaledVector(CUP, Math.sin(turn) * along)
      } else {
        m.scale.set(scale, scale, 1)
        m.position.copy(POS)
        // the stars behind its body are hidden
        if (disc < farDiscs.length && !behind) farDiscs[disc++].set(NDC.x, NDC.y, radius * 2 * grow * (1 + 0.12 * s.pop), w)
      }
      const u = mat.uniforms
      u.uTime.value = live.time
      u.uSpin.value = s.spin
      u.uReveal.value = Math.min(1, Math.max(0, s.reveal))
      u.uOpacity.value = w
      u.uAtlas.value = farAtlas.texture
      u.uAtlasOn.value = farAtlas.texture ? 1 : 0
    })
  })

  return (
    <group>
      {BODIES.map(({ galaxy, index }, i) => {
        const kind = PLACES[galaxy].wide[index].kind
        return (
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
        )
      })}
    </group>
  )
}
