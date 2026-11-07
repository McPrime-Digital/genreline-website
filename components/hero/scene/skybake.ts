/**
 * THE SKY'S PAINTER — each showing of the sky (universe.ts) painted once into a picture of the whole sky
 * (shaders.ts SKYBAKE_FRAG), so the deep sky can be rich in detail and still cost two texture reads a frame
 * (the owner, 2026-11-07: "give me better and more advanced backgrounds"; and a laptop's graphics must stay
 * smooth: HANDOFF "Smooth on Windows").
 *
 * The next sky is painted ahead, a strip a frame over a few frames, while the one before it holds — never a
 * whole picture in one frame. Only a sky needed this very frame and not yet painted (the landing, a poster,
 * a scroll faster than the look-ahead) is painted at once. Four pictures at most; the oldest one not wanted
 * is painted over. The size is fixed at the starting quality, so a step down never repaints.
 */
import {
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector4,
  WebGLRenderTarget,
  LinearFilter,
  LinearMipmapLinearFilter,
  type Color,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { SKYBAKE_FRAG, SKYBAKE_VERT } from '@/components/hero/scene/shaders'
import { SKIES, SKY_ASPECT, type Universe } from '@/components/hero/scene/universe'
import { hsl } from '@/components/hero/scene/textures'
import type { Quality } from '@/components/hero/scene/numbers'

/** The picture's size at each quality, and how many strips it is painted in. */
export const BAKE = { size: [[1024, 608], [1536, 912], [2048, 1216]] as const, strips: [24, 12, 8] as const, pool: 4 } as const

const c3 = (v: readonly number[]) => hsl(v[0], v[1], v[2])
const COLOURS = SKIES.map((s) => [c3(s.a), c3(s.b), c3(s.accent), c3(s.band), c3(s.edge), c3(s.glow)])

type Slot = { rt: WebGLRenderTarget; id: number; row: number; used: number }

export class SkyBaker {
  private slots: Slot[] = []
  private wanted: Universe[] = []
  private readonly w: number
  private readonly h: number
  private readonly strips: number
  private readonly scene = new Scene()
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  private readonly geometry = new PlaneGeometry(1, 1)
  private readonly material: ShaderMaterial
  private clock = 0

  constructor(quality: Quality) {
    ;[this.w, this.h] = BAKE.size[quality]
    this.strips = BAKE.strips[quality]
    this.material = new ShaderMaterial({
      vertexShader: SKYBAKE_VERT,
      fragmentShader: SKYBAKE_FRAG,
      uniforms: {
        uCol: { value: COLOURS[0].map((c) => c.clone()) },
        uL1: { value: new Vector4() },
        uL2: { value: new Vector4() },
        uShape: { value: new Vector4() },
        uBandP: { value: new Vector4() },
        uNebP: { value: new Vector4() },
        uMore: { value: new Vector4() },
        uGlints: { value: Array.from({ length: 6 }, () => new Vector4()) },
        uAspect: { value: SKY_ASPECT },
      },
      depthTest: false,
      depthWrite: false,
      blending: NoBlending,
    })
    const mesh = new Mesh(this.geometry, this.material)
    mesh.frustumCulled = false
    this.scene.add(mesh)
  }

  /** The finished picture of a showing, or null while it is still to be painted. */
  picture(u: Universe): Texture | null {
    const slot = this.slots.find((s) => s.id === u.id)
    if (!slot || slot.row < this.h) return null
    slot.used = ++this.clock
    return slot.rt.texture
  }

  /** The showings wanted soon, most wanted first: they are painted ahead, and kept. */
  want(list: (Universe | null | undefined)[]) {
    this.wanted = list.filter((u): u is Universe => !!u)
  }

  /** Paints one strip of the first wanted showing not yet painted. */
  step(gl: WebGLRenderer) {
    for (const u of this.wanted) {
      const found = this.slots.find((s) => s.id === u.id)
      if (found && found.row >= this.h) continue
      const slot = found ?? this.claim(u)
      if (!slot) return
      this.paint(gl, slot, u, Math.ceil(this.h / this.strips))
      return
    }
  }

  /** Paints a showing whole, now (it is needed this frame), and returns its picture. */
  now(gl: WebGLRenderer, u: Universe): Texture {
    const slot = this.slots.find((s) => s.id === u.id) ?? this.claim(u, true)!
    if (slot.row < this.h) this.paint(gl, slot, u, this.h)
    slot.used = ++this.clock
    return slot.rt.texture
  }

  dispose() {
    for (const s of this.slots) s.rt.dispose()
    this.slots = []
    this.material.dispose()
    this.geometry.dispose()
  }

  /** A picture to paint a showing into: a new one, else the oldest not wanted (or, forced, the least wanted). */
  private claim(u: Universe, force = false): Slot | null {
    let slot: Slot | undefined
    if (this.slots.length < BAKE.pool) {
      const rt = new WebGLRenderTarget(this.w, this.h, { depthBuffer: false, generateMipmaps: true, minFilter: LinearMipmapLinearFilter, magFilter: LinearFilter })
      rt.texture.mipmapsAutoUpdate = false
      slot = { rt, id: -1, row: 0, used: 0 }
      this.slots.push(slot)
    } else {
      const keep = new Set(this.wanted.map((w) => w.id))
      const free = this.slots.filter((s) => !keep.has(s.id)).sort((a, b) => a.used - b.used)
      slot = free[0]
      if (!slot && force) {
        // every picture is wanted: give up the least wanted
        const rank = (s: Slot) => this.wanted.findIndex((w) => w.id === s.id)
        slot = [...this.slots].sort((a, b) => rank(b) - rank(a))[0]
      }
    }
    if (!slot) return null
    slot.id = u.id
    slot.row = 0
    slot.used = ++this.clock
    return slot
  }

  private paint(gl: WebGLRenderer, slot: Slot, u: Universe, rows: number) {
    const s = SKIES[u.sky]
    const un = this.material.uniforms
    ;(un.uCol.value as Color[]).forEach((c, i) => c.copy(COLOURS[u.sky][i]))
    ;(un.uL1.value as Vector4).set(s.clouds, s.threads, s.milky, s.dust)
    ;(un.uL2.value as Vector4).set(s.glowing, s.ribbon, s.streaks, s.halos)
    ;(un.uShape.value as Vector4).set(s.cover, s.scale, s.stars, s.light)
    ;(un.uBandP.value as Vector4).set(u.angle, u.width, u.bandAt[0], u.bandAt[1])
    ;(un.uNebP.value as Vector4).set(u.nebAt[0], u.nebAt[1], u.glow, u.seed)
    ;(un.uMore.value as Vector4).set(s.split, (u.seed % 1) * 0.6 - 0.3, 0, 0)
    ;(un.uGlints.value as Vector4[]).forEach((g, i) => g.fromArray(u.glints, i * 4))
    const n = Math.min(rows, this.h - slot.row)
    const rt = slot.rt
    rt.scissor.set(0, slot.row, this.w, n)
    rt.scissorTest = true
    // the picture's levels of detail are made once, with its last strip
    rt.texture.mipmapsAutoUpdate = slot.row + n >= this.h
    const target = gl.getRenderTarget()
    const autoClear = gl.autoClear
    gl.autoClear = false
    gl.setRenderTarget(rt)
    gl.render(this.scene, this.camera)
    gl.setRenderTarget(target)
    gl.autoClear = autoClear
    rt.scissorTest = false
    rt.texture.mipmapsAutoUpdate = false
    slot.row += n
  }
}
