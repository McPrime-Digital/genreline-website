/**
 * THE FILMS — what each space's cinema plays (the owner, 2026-11-06: "every space should have a different
 * type of cinema … with an actual film playing"). The films themselves are placeholders the owner will
 * replace (content/hero-films.ts, made by scripts/make-hero-films.ts): a change there, never here.
 *
 *  · Nothing loads before the tour: a cinema asks for its film only as its space comes near (wantFilm),
 *    and its still shows first, its footage once it can play.
 *  · One film plays at a time — the one the visitor is nearest; the others wait, paused.
 *  · Nothing plays under reduced motion, on Save-Data (the still only, the footage never fetched), in a
 *    hidden tab, or where the browser refuses to play it (iOS in Low Power Mode): the still stays.
 *
 * Footage reaches the GPU through three's VideoTexture, which uploads only when the video presents a new
 * frame (requestVideoFrameCallback) — 24 times a second at most, one film at a time.
 */
import { Color, LinearFilter, SRGBColorSpace, Texture, VideoTexture } from 'three'
import { HERO_FILMS, type HeroFilm } from '@/content/hero-films'
import { heroState } from '@/components/hero/state'
import { uploadSoon } from '@/components/hero/scene/textures'

type Film = {
  spec: HeroFilm
  video: HTMLVideoElement | null
  still: Texture | null
  moving: VideoTexture | null
  /** How much the cinema showing it wants it this frame (0–1). */
  want: number
  /** The browser refused to play it: the still stays. */
  blocked: boolean
  stillAsked: boolean
  /** The colour of its light now — what it throws on the beam, the floor, the glow round the screen. */
  tone: Color
  toneAt: number
}

const films = new Map<string, Film>(HERO_FILMS.map((spec) => [spec.id, { spec, video: null, still: null, moving: null, want: 0, blocked: false, stillAsked: false, tone: new Color().setRGB(0.82, 0.8, 0.74, SRGBColorSpace), toneAt: 0 }]))

const saveData = () => typeof navigator !== 'undefined' && !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
let h264: boolean | null = null
/** H.264, which nearly every browser decodes in hardware; where one can't, its still stays. */
function canPlay() {
  if (h264 === null) h264 = !!document.createElement('video').canPlayType('video/mp4; codecs="avc1.640028"')
  return h264
}

function loadStill(f: Film) {
  if (f.stillAsked) return
  f.stillAsked = true
  fetch(f.spec.still)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then((blob) => createImageBitmap(blob, { imageOrientation: 'flipY' }))
    .then(async (bitmap) => {
      const t = new Texture(bitmap as unknown as HTMLImageElement)
      t.colorSpace = SRGBColorSpace
      t.minFilter = LinearFilter
      t.generateMipmaps = false
      t.flipY = false
      t.needsUpdate = true
      await uploadSoon(t)
      f.still = t
      heroState.invalidate()
    })
    .catch(() => {})
}

function loadFootage(f: Film) {
  // nothing plays under reduced motion or on Save-Data: the footage is never fetched, the still stays
  if (f.video || saveData() || heroState.reduced || !canPlay()) return
  const v = document.createElement('video')
  v.muted = true
  v.defaultMuted = true
  v.playsInline = true
  v.setAttribute('playsinline', '')
  v.loop = f.spec.loop
  v.preload = 'auto'
  v.src = f.spec.mp4
  v.addEventListener(
    'loadeddata',
    () => {
      const t = new VideoTexture(v)
      t.colorSpace = SRGBColorSpace
      f.moving = t
    },
    { once: true },
  )
  f.video = v
}

/** A cinema wants its film this frame, `weight` 0–1 (how near its space is): loading starts at the first ask. */
export function wantFilm(id: string, weight: number) {
  const f = films.get(id)
  if (!f || weight <= 0.001) return
  f.want = Math.max(f.want, weight)
  loadStill(f)
  loadFootage(f)
}

/** Fetch a film ahead of need (the next card in the Suite's deck), without playing it. */
export function prefetchFilm(id: string) {
  const f = films.get(id)
  if (!f) return
  loadStill(f)
  loadFootage(f)
}

/** What a cinema shows for a film now: its footage once it is playing, its still until then (null before either). */
export function filmPicture(id: string): Texture | null {
  const f = films.get(id)
  if (!f) return null
  // (the footage takes over once a few of its frames have shown: its first frame on the GPU is not yet the picture)
  if (f.moving && f.video && !f.blocked && f.video.currentTime > 0.12) return f.moving
  return f.still
}

/** How far through its clip a film is (0–1), for the Suite's deck to move on as one ends. */
export function filmProgress(id: string) {
  const v = films.get(id)?.video
  return v && v.duration > 0 ? v.currentTime / v.duration : 0
}
/** Back to its start (a card returning to the back of the deck). */
export function rewindFilm(id: string) {
  const v = films.get(id)?.video
  if (v) v.currentTime = 0
}
/** Whether a film is playing now. */
export function filmPlaying(id: string) {
  const f = films.get(id)
  return !!f?.video && !f.video.paused && !f.blocked
}

/** The colour of a film's light (eased; a warm silver before it plays). */
export function filmTone(id: string): Color | null {
  return films.get(id)?.tone ?? null
}

/** The playing film's light, read five times a second from a 4 × 3 copy of its frame. */
let toneCanvas: CanvasRenderingContext2D | null = null
const TONE = new Color()
function readTone(f: Film, now: number) {
  const v = f.video
  if (!v || v.paused || v.readyState < 2 || now - f.toneAt < 200) return
  f.toneAt = now
  toneCanvas ??= (() => {
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 3
    return c.getContext('2d', { willReadFrequently: true })
  })()
  if (!toneCanvas) return
  toneCanvas.drawImage(v, 0, 0, 4, 3)
  const d = toneCanvas.getImageData(0, 0, 4, 3).data
  let r = 0
  let g = 0
  let b = 0
  for (let i = 0; i < d.length; i += 4) {
    r += d[i]
    g += d[i + 1]
    b += d[i + 2]
  }
  const n = (d.length / 4) * 255
  // brightened toward its own hue, so a dark scene still throws a colour
  const m = Math.max(r, g, b) / n || 1
  TONE.setRGB(r / n / m, g / n / m, b / n / m, SRGBColorSpace)
  f.tone.lerp(TONE, 0.35)
}

/** Once a frame, after the cinemas have asked: the most wanted film plays, every other waits. */
export function directFilms() {
  let best: Film | null = null
  for (const f of films.values()) if (f.want > 0.05 && (!best || f.want > best.want)) best = f
  const allowed = !heroState.reduced && typeof document !== 'undefined' && !document.hidden && !saveData()
  for (const f of films.values()) {
    const v = f.video
    const should = allowed && f === best && !f.blocked
    if (v && should && v.paused && v.readyState >= 2) {
      v.play().catch((e: unknown) => {
        // refused (Low Power Mode, a strict autoplay policy): the still stays; a pause() racing it is not a refusal
        if ((e as DOMException)?.name === 'NotAllowedError') f.blocked = true
      })
    } else if (v && !should && !v.paused) v.pause()
    if (should) readTone(f, performance.now())
    f.want = 0
  }
}

/** The scene is going away: stop every film and let the browser drop its footage. */
export function releaseFilms() {
  for (const f of films.values()) {
    if (f.video) {
      f.video.pause()
      f.video.removeAttribute('src')
      f.video.load()
    }
    f.moving?.dispose()
    f.still?.dispose()
    f.video = null
    f.moving = null
    f.still = null
    f.stillAsked = false
    f.want = 0
  }
}
