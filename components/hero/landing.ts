/**
 * LANDING — the hero's first paint, before any of the page's script has run (the owner, 2026-11-06:
 * "everything must land at once and very fast. nothing lands before the other comes later").
 *
 * The title's poster has to be scaled and placed so its logo sits exactly where the camera will put it at
 * this screen's size; until now that waited for the page's script (HeroDirector), so on a slow device the
 * words landed seconds before their picture. This runs inline, straight after the hero's markup: it
 * measures the same elements, does the same framing (frame.ts wholeFrame('title') and logoOnStage), places
 * the poster, and lets the stage land — words and picture together — as soon as the picture has arrived.
 * HeroDirector's own measure lands on the same numbers and takes over (in development it says so if not).
 *
 * `landingScript` is rendered by the server into a <script> (the site's CSP allows inline scripts): the
 * function below must stay self-contained — no imports, no outside names — because it is sent as text.
 */
import { FOV, LINE_POINTS, TILE } from '@/components/hero/scene/numbers'
import { LOGO_Z } from '@/components/hero/frame'

type PosterFrame = { left: number; right: number; top: number; bottom: number; width: number; height: number }
type LandingData = {
  pts: number[]
  logoZ: number
  fov: { wide: number; tall: number; tallBelowAspect: number }
  tile: { size: number; minScreen: number }
  frames: { wide?: PosterFrame; tall?: PosterFrame }
  playGap: number
}

/** Self-contained: sent to the browser as text. Mirrors HeroDirector's measure and frame.ts for the title. */
function land(d: LandingData) {
  const section = document.querySelector<HTMLElement>('[data-hero]')
  const stage = section?.querySelector<HTMLElement>('[data-hero-stage]')
  const shots = section?.querySelector<HTMLElement>('.hero-shots')
  const img = section?.querySelector<HTMLImageElement>('[data-poster="title"] img')
  if (!section || !stage || !shots || !img) return
  const place = () => {
    const st = stage.getBoundingClientRect()
    if (!st.width || !st.height) return false
    const sh = shots.getBoundingClientRect()
    const fy = (y: number) => Math.min(1, Math.max(0, (y - st.top) / st.height))
    const fx = (x: number) => Math.min(1, Math.max(0, (x - st.left) / st.width))
    const card = section.querySelector<HTMLElement>('[data-shot="0"]')
    if (!card) return false
    const left = sh.left + card.offsetLeft
    const top = sh.top + card.offsetTop
    let right = left
    card.querySelectorAll<HTMLElement>('h1 > span, h2 > span, h2, p, li, .hero-ctas > a').forEach((c) => {
      const r = c.getBoundingClientRect()
      if (r.width) right = Math.max(right, r.right)
    })
    const slate = section.querySelector<HTMLElement>('.hero-top')
    const track = section.querySelector<HTMLElement>('.hero-track')
    const play = section.querySelector<HTMLElement>('[data-hero-play-wrap]')
    const pad = 10 / st.height
    const under = slate ? slate.getBoundingClientRect().bottom : 0
    const L = {
      top: under ? fy(under) + pad : 0.15,
      bottom: track ? fy(track.getBoundingClientRect().top) - pad * 2.4 : 0.93,
      titleRight: fx(right),
      titleTop: fy(top),
      edge: fx(left),
      play: play && play.offsetHeight ? (play.offsetHeight + d.playGap * 2) / st.height : 0,
    }
    // frame.ts: the whole line fitted into the room the words leave (beside them, or above them)
    const aspect = st.width / st.height
    const tall = aspect < d.fov.tallBelowAspect
    const tanH = Math.tan((((tall ? d.fov.tall : d.fov.wide) / 2) * Math.PI) / 180)
    let xMin = Infinity
    let xMax = -Infinity
    let yMin = Infinity
    let yMax = -Infinity
    for (let i = 0; i < d.pts.length; i += 3) {
      xMin = Math.min(xMin, d.pts[i])
      xMax = Math.max(xMax, d.pts[i])
      yMin = Math.min(yMin, d.pts[i + 1])
      yMax = Math.max(yMax, d.pts[i + 1])
    }
    type Band = { x0: number; x1: number; y0: number; y1: number }
    const clamp = (b: Band): Band => ({ x0: b.x0, x1: Math.max(b.x1, b.x0 + 0.12), y0: b.y0, y1: Math.max(b.y1, b.y0 + 0.12) })
    const room = (dist: number) => Math.max(d.tile.size, dist * d.tile.minScreen) / 2 + 0.8
    const fit = (b: Band, m: number) => {
      const bw = Math.max(0.12, b.x1 - b.x0)
      const bh = Math.max(0.12, b.y1 - b.y0)
      return Math.max((yMax - yMin + 2 * m) / (2 * tanH * bh), (xMax - xMin + 2 * m) / (2 * tanH * aspect * bw))
    }
    const distance = (b: Band) => {
      let dist = 60
      for (let i = 0; i < 3; i++) dist = fit(b, room(dist))
      return dist
    }
    const right1 = 1 - L.edge
    const bands: Band[] = [{ x0: Math.max(0.04, L.edge), x1: right1, y0: L.top, y1: L.titleTop - 0.03 - L.play }]
    if (!tall) bands.push({ x0: L.titleRight + 0.04, x1: right1, y0: L.top, y1: L.bottom - L.play })
    let band = clamp(bands[0])
    let dist = distance(band)
    for (const b of bands.slice(1)) {
      const c = clamp(b)
      const cd = distance(c)
      if (cd < dist) {
        band = c
        dist = cd
      }
    }
    const m = room(dist)
    const cx = (xMin - m + xMax + m) / 2
    const cy = (yMin - m + yMax + m) / 2
    const sx0 = (band.x0 + band.x1) / 2
    const sy0 = (band.y0 + band.y1) / 2
    let l = 1
    let r = 0
    let t = 1
    let b = 0
    for (let i = 0; i < d.pts.length; i += 3) {
      const depth = dist - (d.pts[i + 2] - d.logoZ)
      const x = sx0 + (d.pts[i] - cx) / (2 * depth * tanH * aspect)
      const y = sy0 - (d.pts[i + 1] - cy) / (2 * depth * tanH)
      l = Math.min(l, x)
      r = Math.max(r, x)
      t = Math.min(t, y)
      b = Math.max(b, y)
    }
    // the play control, just under the logo (as HeroDirector places it)
    if (play && play.offsetWidth) {
      const w = play.offsetWidth
      const edgePx = L.edge * st.width
      const px = Math.min(st.width - edgePx - w, Math.max(edgePx, ((l + r) / 2) * st.width - w / 2))
      play.style.transform = `translate3d(${px.toFixed(1)}px, ${(b * st.height + d.playGap).toFixed(1)}px, 0)`
      play.dataset.placed = 'true'
    }
    // the poster, scaled and placed so its logo is where the camera puts it (as HeroDirector does)
    const pf = /-tall\./.test(img.currentSrc || img.src) ? d.frames.tall : d.frames.wide
    const box = img.parentElement?.getBoundingClientRect()
    if (!pf || !box) return false
    const scale = ((r - l) * st.width) / ((pf.right - pf.left) * pf.width)
    const ox = l * st.width - pf.left * pf.width * scale - (box.left - st.left)
    const oy = t * st.height - pf.top * pf.height * scale - (box.top - st.top)
    img.style.width = `${(pf.width * scale).toFixed(1)}px`
    img.style.height = `${(pf.height * scale).toFixed(1)}px`
    img.style.transform = `translate3d(${ox.toFixed(1)}px, ${oy.toFixed(1)}px, 0)`
    img.dataset.aligned = 'true'
    return true
  }
  const landNow = () => {
    if (stage.dataset.landed) return
    // (shown already, by the CSS's own deadline: leave it be)
    stage.dataset.landed = getComputedStyle(stage).visibility === 'visible' ? 'late' : 'true'
  }
  const go = () => {
    if (!place()) return
    // landed in the very task the picture arrives in, never queued behind the page's scripts (a decode()'s
    // promise waits for them: on a throttled phone, hydration's whole length); its fade, from a fifth of its
    // light, covers the picture's last moment of decoding
    landNow()
  }
  // the picture's file decides its shape (wide or tall): placed as soon as it is chosen and loaded
  if (img.complete && img.naturalWidth) go()
  else img.addEventListener('load', go, { once: true })
}

/** The inline script's text, with the line and the framing's numbers it needs. */
export function landingScript(frames: LandingData['frames'], playGap: number) {
  const data: LandingData = {
    pts: LINE_POINTS.flatMap((p) => [+p[0].toFixed(3), +p[1].toFixed(3), +p[2].toFixed(3)]),
    logoZ: LOGO_Z,
    fov: { wide: FOV.wide, tall: FOV.tall, tallBelowAspect: FOV.tallBelowAspect },
    tile: { size: TILE.size, minScreen: TILE.minScreen },
    frames,
    playGap,
  }
  return `(${land.toString()})(${JSON.stringify(data)})`
}
