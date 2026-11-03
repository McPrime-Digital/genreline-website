'use client'
/**
 * THE SCENE (batch W-3D-1 §2): the logo's gold line through its three tiles
 * — Crew, Client, Suite — with each space's screen floating behind its tile,
 * dust for depth, and a camera that follows the line as the visitor scrolls.
 *
 * It renders inside <HeroCanvas>. Everything that moves reads heroState
 * (components/hero/state.ts) in the frame loop; nothing here re-renders on
 * scroll. With Motion off the scene draws only when asked (a cut, a theme
 * change, a hover), and nothing moves on its own.
 */
import * as React from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, FogExp2, Group, MeshBasicMaterial,
  NormalBlending, PerspectiveCamera, Shape, ShapeGeometry, Sprite, SpriteMaterial, Texture, TubeGeometry, Vector3,
  type LineBasicMaterial,
} from 'three'
import { heroState } from '@/components/hero/state'
import {
  CAMERA_PATH, CAMERA_PATH_TALL, DUST, FOG_DENSITY, FOV, LINE_POINTS, LOOK_PATH, LOOK_PATH_TALL, NODES, NODE_GLOW_OPACITY, NODE_GLOW_SIZE, NODE_SIZE,
  PLAYHEAD, POINTER, SCREENS, SCREEN_WIDTH, SHOTS, TUBE, viewShift, type Vec3,
} from '@/components/hero/scene/numbers'
import {
  getScreenTexture, nodeTexture, readTheme, setFootagePlaying, sheenTexture, softTexture, type HeroTheme, type ScreenSlot, type ScreenSources,
} from '@/components/hero/scene/textures'

const v3 = (p: Vec3) => new Vector3(p[0], p[1], p[2])
const ORDER: ScreenSlot[] = ['crew', 'client', 'suite']
/** The captures' own aspect (2248 × 1616). */
const SCREEN_HEIGHT = SCREEN_WIDTH * (1616 / 2248)

/** How near the camera is to a node's shot: 1 at the shot, 0 a full shot away. */
function nearness(index: number) {
  const d = Math.abs(heroState.current * (SHOTS - 1) - (index + 1))
  return Math.max(0, 1 - d)
}

/** A seeded random, so the dust lies the same way on every visit (and in the poster). */
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
    const { gl, scene, invalidate } = get()
    gl.setClearColor(theme.background, 1)
    scene.fog = new FogExp2(theme.background.getHex(), theme.dark ? FOG_DENSITY.dark : FOG_DENSITY.light)
    invalidate()
  }, [get, theme])
  return null
}

// ── THE LINE ────────────────────────────────────────────────────────────────

const LINE = new CatmullRomCurve3(LINE_POINTS.map(v3), false, 'centripetal')

function Line({ theme, lowered, soft }: { theme: HeroTheme; lowered: boolean; soft: Texture }) {
  const geos = React.useMemo(
    () => ({
      core: new TubeGeometry(LINE, TUBE.core.segments, TUBE.core.radius, TUBE.radialSegments, false),
      a: new TubeGeometry(LINE, TUBE.glowA.segments, TUBE.glowA.radius, TUBE.radialSegments, false),
      b: new TubeGeometry(LINE, TUBE.glowB.segments, TUBE.glowB.radius, TUBE.radialSegments, false),
    }),
    [],
  )
  React.useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const blending = theme.dark ? AdditiveBlending : NormalBlending
  const playhead = React.useRef<Sprite>(null)
  const clock = React.useRef(0)
  useFrame((_, dt) => {
    const p = playhead.current
    if (!p) return
    p.visible = heroState.motion
    if (!heroState.motion) return
    clock.current += Math.min(dt, 0.1)
    LINE.getPointAt((clock.current / PLAYHEAD.seconds) % 1, p.position)
  })
  return (
    <group>
      {!lowered && (
        <mesh geometry={geos.b} renderOrder={1}>
          <meshBasicMaterial color={theme.glow} transparent opacity={theme.dark ? TUBE.glowB.opacity.dark : TUBE.glowB.opacity.light} depthWrite={false} blending={blending} />
        </mesh>
      )}
      <mesh geometry={geos.a} renderOrder={2}>
        <meshBasicMaterial color={theme.glow} transparent opacity={theme.dark ? TUBE.glowA.opacity.dark : TUBE.glowA.opacity.light} depthWrite={false} blending={blending} />
      </mesh>
      <mesh geometry={geos.core} renderOrder={3}>
        <meshBasicMaterial color={theme.core} />
      </mesh>
      <sprite ref={playhead} scale={[PLAYHEAD.size, PLAYHEAD.size, 1]} renderOrder={4}>
        <spriteMaterial map={soft} color={theme.dark ? '#ffffff' : theme.core} transparent depthWrite={false} blending={blending} />
      </sprite>
    </group>
  )
}

// ── THE NODES ───────────────────────────────────────────────────────────────

function Node({ id, index, theme, soft, anisotropy }: { id: ScreenSlot; index: number; theme: HeroTheme; soft: Texture; anisotropy: number }) {
  const map = React.useMemo(() => nodeTexture(id, theme, anisotropy), [id, theme, anisotropy])
  React.useEffect(() => () => map.dispose(), [map])
  const tile = React.useRef<Sprite>(null)
  const glow = React.useRef<Sprite>(null)
  const hover = React.useRef({ to: 0, now: 0 })
  const invalidate = useThree((s) => s.invalidate)
  const glowBase = theme.dark ? NODE_GLOW_OPACITY.dark : NODE_GLOW_OPACITY.light

  useFrame((_, dt) => {
    const h = hover.current
    h.now = heroState.motion ? damp(h.now, h.to, 10, Math.min(dt, 0.1)) : h.to
    const near = nearness(index)
    if (tile.current) tile.current.scale.setScalar(NODE_SIZE * (1 + 0.08 * h.now))
    if (glow.current) {
      glow.current.scale.setScalar(NODE_GLOW_SIZE * (1 + 0.18 * near + 0.12 * h.now))
      ;(glow.current.material as SpriteMaterial).opacity = Math.min(1, glowBase * (1 + 0.5 * near + 0.5 * h.now))
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
      heroState.goToShot(index + 1)
    },
  }

  return (
    <group position={v3(NODES[id])}>
      <sprite ref={glow} scale={NODE_GLOW_SIZE} renderOrder={9}>
        <spriteMaterial map={soft} color={theme.dark ? '#ffffff' : theme.core} transparent opacity={glowBase} depthWrite={false} depthTest={false} blending={theme.dark ? AdditiveBlending : NormalBlending} />
      </sprite>
      {/* The tile always draws over the line, so the line meets it the way it meets the tile in the logo. */}
      <sprite ref={tile} scale={NODE_SIZE} renderOrder={10} {...handlers}>
        <spriteMaterial map={map} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  )
}

// ── THE SCREENS ─────────────────────────────────────────────────────────────

/** A rounded rectangle whose UVs run 0–1 across it, so a picture maps edge to edge. */
function roundedRect(w: number, h: number, r: number, uv = true) {
  const s = new Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  if (!uv) return s
  const g = new ShapeGeometry(s, 10)
  const pos = g.attributes.position
  const uvs = g.attributes.uv
  for (let i = 0; i < pos.count; i++) uvs.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h)
  uvs.needsUpdate = true
  return g
}

function Screen({ slot, index, theme, sources, anisotropy, sheen }: { slot: ScreenSlot; index: number; theme: HeroTheme; sources: ScreenSources; anisotropy: number; sheen: Texture }) {
  const conf = SCREENS[slot]
  const geos = React.useMemo(() => {
    const face = roundedRect(SCREEN_WIDTH, SCREEN_HEIGHT, 0.09) as ShapeGeometry
    const edge = new BufferGeometry().setFromPoints((roundedRect(SCREEN_WIDTH + 0.05, SCREEN_HEIGHT + 0.05, 0.11, false) as Shape).getPoints(24))
    return { face, edge }
  }, [])
  React.useEffect(() => () => { geos.face.dispose(); geos.edge.dispose() }, [geos])

  // What the screen shows comes from getScreenTexture — and only from there:
  // its placeholder at once, the real picture when it has loaded. A new
  // picture is asked for only when the theme flips between light and dark.
  const dark = theme.dark
  const job = React.useMemo(
    () => getScreenTexture(slot, dark, sources, anisotropy, heroState.motion),
    [slot, dark, sources, anisotropy],
  )
  const [loaded, setLoaded] = React.useState<{ job: typeof job; texture: Texture } | null>(null)
  React.useEffect(() => {
    let live = true
    let final: Texture | null = null
    job.ready.then((texture) => {
      final = texture
      if (live) setLoaded({ job, texture })
      else if (texture !== job.placeholder) texture.dispose()
    })
    return () => {
      live = false
      job.placeholder.dispose()
      final?.dispose()
    }
  }, [job])
  const map = loaded?.job === job ? loaded.texture : job.placeholder

  const sheenMap = React.useMemo(() => sheen.clone(), [sheen])
  React.useEffect(() => () => sheenMap.dispose(), [sheenMap])

  const group = React.useRef<Group>(null)
  const frameMat = React.useRef<LineBasicMaterial>(null)
  const sheenMat = React.useRef<MeshBasicMaterial>(null)
  const hover = React.useRef({ to: 0, now: 0, clock: index * 1.7 })
  const invalidate = useThree((s) => s.invalidate)
  const base = React.useMemo(() => v3(conf.position), [conf])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const h = hover.current
    const d = Math.min(dt, 0.1)
    h.now = heroState.motion ? damp(h.now, h.to, 8, d) : h.to
    if (heroState.motion) h.clock += d
    const near = nearness(index)
    // a slow float while Motion is on; a lift toward the viewer under the hand
    const float = heroState.motion ? Math.sin(h.clock * 0.6) * 0.045 : 0
    g.position.set(base.x, base.y + float, base.z)
    g.translateZ(0.35 * h.now)
    g.scale.setScalar(1 + 0.03 * h.now)
    if (frameMat.current) frameMat.current.opacity = 0.7 + 0.3 * Math.max(h.now, near * 0.6)
    // the glass catches the light as the camera and the pointer move
    const cam = state.camera.position
    const glass = sheenMat.current
    if (glass?.map) {
      glass.map.offset.x = 0.55 - (cam.x - base.x) * 0.09 - (cam.y - base.y) * 0.03 + (heroState.motion ? Math.sin(h.clock * 0.25) * 0.08 : 0)
      glass.opacity = (theme.dark ? 0.07 : 0.16) * (0.6 + 0.4 * near + 0.8 * h.now)
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
      heroState.goToShot(index + 1)
    },
  }

  return (
    <group ref={group} position={base} rotation-y={conf.rotationY}>
      <mesh geometry={geos.face} {...handlers}>
        <meshBasicMaterial map={map} toneMapped={false} fog={false} side={DoubleSide} />
      </mesh>
      <mesh geometry={geos.face} position-z={0.004} renderOrder={5}>
        <meshBasicMaterial ref={sheenMat} map={sheenMap} transparent depthWrite={false} fog={false} blending={theme.dark ? AdditiveBlending : NormalBlending} opacity={0.08} />
      </mesh>
      <lineLoop geometry={geos.edge} position-z={0.006}>
        <lineBasicMaterial ref={frameMat} color={theme.core} transparent opacity={0.7} />
      </lineLoop>
    </group>
  )
}

// ── THE DUST ────────────────────────────────────────────────────────────────

/** Dust: drifting points for depth, each a soft round speck (a square point reads as a pixel up close). */
function Dust({ theme, lowered, soft }: { theme: HeroTheme; lowered: boolean; soft: Texture }) {
  const geo = React.useMemo(() => {
    const rnd = seeded(1400)
    const pos = new Float32Array(DUST.count * 3)
    for (let i = 0; i < DUST.count; i++) {
      pos[i * 3] = (rnd() - 0.5) * DUST.spread[0]
      pos[i * 3 + 1] = (rnd() - 0.5) * DUST.spread[1]
      pos[i * 3 + 2] = -rnd() * DUST.spread[2] + DUST.nearZ
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    return g
  }, [])
  React.useEffect(() => () => geo.dispose(), [geo])
  React.useEffect(() => geo.setDrawRange(0, lowered ? DUST.lowered : DUST.count), [geo, lowered])
  const ref = React.useRef<Group>(null)
  const clock = React.useRef(0)
  useFrame((_, dt) => {
    if (!ref.current || !heroState.motion) return
    clock.current += Math.min(dt, 0.1)
    ref.current.rotation.y = Math.sin(clock.current * 0.05) * 0.04
    ref.current.position.y = Math.sin(clock.current * 0.11) * 0.15
  })
  return (
    <group ref={ref}>
      <points geometry={geo}>
        <pointsMaterial
          map={soft}
          color={theme.dark ? theme.glow : theme.core}
          size={DUST.size * 1.6}
          transparent
          opacity={theme.dark ? DUST.opacity.dark : DUST.opacity.light}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

// ── THE CAMERA ──────────────────────────────────────────────────────────────

const curve = (points: readonly Vec3[]) => new CatmullRomCurve3(points.map(v3), false, 'centripetal')
const PATHS = {
  wide: { cam: curve(CAMERA_PATH), look: curve(LOOK_PATH) },
  tall: { cam: curve(CAMERA_PATH_TALL), look: curve(LOOK_PATH_TALL) },
}

function CameraRig() {
  const size = useThree((s) => s.size)
  const get = useThree((s) => s.get)
  const rig = React.useRef({ pos: new Vector3(), look: new Vector3(), pointer: { x: 0, y: 0 }, eased: { x: 0, y: 0 }, path: PATHS.wide })

  React.useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      rig.current.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      rig.current.pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  // The lens: wider when the frame is tall, and shifted (like a shift lens) so
  // the scene sits in the part of the frame the words leave open.
  React.useLayoutEffect(() => {
    const { camera, invalidate } = get()
    const lens = camera as PerspectiveCamera
    const aspect = size.width / size.height
    const tall = aspect < FOV.tallBelowAspect
    lens.fov = tall ? FOV.tall : FOV.wide
    rig.current.path = tall ? PATHS.tall : PATHS.wide
    const [sx, sy] = viewShift(aspect)
    lens.setViewOffset(size.width, size.height, -sx * size.width, sy * size.height, size.width, size.height)
    lens.updateProjectionMatrix()
    invalidate()
  }, [get, size])

  useFrame(({ camera }, dt) => {
    const t = rig.current
    const d = Math.min(dt, 0.1)
    if (heroState.motion) {
      t.eased.x = damp(t.eased.x, t.pointer.x, POINTER.damping, d)
      t.eased.y = damp(t.eased.y, t.pointer.y, POINTER.damping, d)
    } else {
      t.eased.x = 0
      t.eased.y = 0
    }
    t.path.cam.getPoint(heroState.current, t.pos)
    t.path.look.getPoint(heroState.current, t.look)
    t.pos.x += t.eased.x * POINTER.x
    t.pos.y -= t.eased.y * POINTER.y
    camera.position.copy(t.pos)
    camera.lookAt(t.look)
  })
  return null
}

// ── THE WHOLE SCENE ─────────────────────────────────────────────────────────

export function HeroScene({ sources, lowered, motion }: { sources: ScreenSources; lowered: boolean; motion: boolean }) {
  const theme = useHeroTheme()
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)
  const anisotropy = React.useMemo(() => Math.min(8, gl.capabilities.getMaxAnisotropy()), [gl])
  const soft = React.useMemo(() => softTexture(), [])
  const sheen = React.useMemo(() => sheenTexture(), [])
  React.useEffect(() => () => { soft.dispose(); sheen.dispose() }, [soft, sheen])

  React.useEffect(() => {
    heroState.invalidate = () => invalidate()
    return () => {
      heroState.invalidate = () => {}
    }
  }, [invalidate])
  React.useEffect(() => {
    setFootagePlaying(motion)
    invalidate()
  }, [motion, invalidate])
  React.useEffect(() => () => { document.body.style.cursor = '' }, [])

  return (
    <>
      <Atmosphere theme={theme} />
      <CameraRig />
      <Dust theme={theme} lowered={lowered} soft={soft} />
      {ORDER.map((slot, i) => (
        <Screen key={slot} slot={slot} index={i} theme={theme} sources={sources} anisotropy={anisotropy} sheen={sheen} />
      ))}
      <Line theme={theme} lowered={lowered} soft={soft} />
      {ORDER.map((id, i) => (
        <Node key={id} id={id} index={i} theme={theme} soft={soft} anisotropy={anisotropy} />
      ))}
    </>
  )
}

