/**
 * THE TOUR'S FILMS — PLACEHOLDERS (the owner, 2026-11-06: "for now you can add the films any film from
 * the internet as i will change it with real films"). Cuts each cinema's clip from its source and writes:
 *
 *   public/hero/films/<id>.mp4    H.264 (hardware-decoded nearly everywhere), no sound, 24 fps
 *   public/hero/films/<id>.webm   VP9, for browsers without H.264
 *   public/hero/films/<id>.avif   its still: shown until the clip plays, and where it never will
 *   public/hero/films/atlas.avif  a still of each, 4 × 2 — the far worlds' frames (scene/far.tsx)
 *   content/hero-films.ts         GENERATED: what the scene plays, and the credit the licences ask for
 *
 * Every source is free to show: in the public domain, or under Creative Commons Attribution (credited in
 * the line the tour's close carries). None shows a living actor — animation, or a film from 1902 — so no
 * one's likeness is used to sell anything.
 *
 * Run by hand: `npx tsx scripts/make-hero-films.ts`. With FILMS_SRC=<dir> it reads each source from
 * <dir>/<key>.webm (download them once — Wikimedia asks for few requests); without, ffmpeg reads the
 * source's own address by range. To use the owner's own films, replace CLIPS (src, start, length) and run
 * it again: nothing in the scene changes.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

type Clip = {
  /** The scene's name for it. */
  id: string
  /** Its source's key (FILMS_SRC/<key>.webm) and address. */
  key: string
  url: string
  page: string
  title: string
  year: number
  maker: string
  licence: 'public domain' | 'public domain in the United States' | 'CC BY 3.0' | 'CC BY 4.0'
  /** Where in the source, and how long (seconds). */
  start: number
  length: number
  /** The clip's width; its height follows the source's shape (or `crop`'s). */
  width: number
  /** Cut to a shape (width over height, centred), or trimmed by a share at every edge (a source's dark corners). */
  crop?: { aspect?: number; trim?: number }
  /** Loops in place (a cinema), or plays once (a card in the Suite's deck, which moves on as it ends). */
  loop: boolean
}

const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons/transcoded'
const CLIPS: Clip[] = [
  {
    id: 'crew', key: 'melies', title: 'A Trip to the Moon', year: 1902, maker: 'Georges Méliès', licence: 'public domain',
    url: `${COMMONS}/6/6d/Le_Voyage_dans_la_Lune_%281902%29.webm/Le_Voyage_dans_la_Lune_%281902%29.webm.480p.vp9.webm`,
    page: 'https://commons.wikimedia.org/wiki/File:Le_Voyage_dans_la_Lune_(1902).webm',
    start: 359, length: 14, width: 640, loop: true,
  },
  {
    id: 'client', key: 'gulliver', title: 'Gulliver’s Travels', year: 1939, maker: 'Fleischer Studios', licence: 'public domain in the United States',
    url: `${COMMONS}/b/bb/Gulliver%27s_Travels_%281939%29.webm/Gulliver%27s_Travels_%281939%29.webm.480p.vp9.webm`,
    page: 'https://commons.wikimedia.org/wiki/File:Gulliver%27s_Travels_(1939).webm',
    start: 510, length: 12, width: 640, loop: true, crop: { trim: 0.06 },
  },
  {
    id: 'suite-1', key: 'spring', title: 'Spring', year: 2019, maker: 'Blender Studio', licence: 'CC BY 4.0',
    url: `${COMMONS}/a/a5/Spring_-_Blender_Open_Movie.webm/Spring_-_Blender_Open_Movie.webm.480p.vp9.webm`,
    page: 'https://commons.wikimedia.org/wiki/File:Spring_-_Blender_Open_Movie.webm',
    start: 26, length: 8, width: 854, loop: false,
  },
  {
    id: 'suite-2', key: 'sintel', title: 'Sintel', year: 2010, maker: 'Blender Foundation', licence: 'CC BY 3.0',
    url: `${COMMONS}/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.480p.vp9.webm`,
    page: 'https://commons.wikimedia.org/wiki/File:Sintel_movie_4K.webm',
    start: 266, length: 8, width: 854, loop: false,
  },
  {
    id: 'suite-3', key: 'sprite', title: 'Sprite Fright', year: 2021, maker: 'Blender Studio', licence: 'CC BY 4.0',
    url: `${COMMONS}/7/76/Sprite_Fright_-_Blender_Open_Movie-full_movie.webm/Sprite_Fright_-_Blender_Open_Movie-full_movie.webm.480p.vp9.webm`,
    page: 'https://commons.wikimedia.org/wiki/File:Sprite_Fright_-_Blender_Open_Movie-full_movie.webm',
    start: 104, length: 8, width: 854, loop: false,
  },
  {
    id: 'suite-4', key: 'bunny', title: 'Big Buck Bunny', year: 2008, maker: 'Blender Foundation', licence: 'CC BY 3.0',
    url: `${COMMONS}/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm`,
    page: 'https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_4K.webm',
    start: 108, length: 8, width: 854, loop: false, crop: { aspect: 2.39 },
  },
]

const ROOT = process.cwd()
const OUT = join(ROOT, 'public', 'hero', 'films')
const SRC = process.env.FILMS_SRC
const UA = 'genreline-web-build/1.0 (tour film placeholders)'
const ffmpeg = (args: string[]) => execFileSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] })
const kb = (p: string) => Math.round(statSync(p).size / 1024)

async function main() {
  mkdirSync(OUT, { recursive: true })
  const made: { clip: Clip; height: number }[] = []
  for (const clip of CLIPS) {
    const local = SRC ? join(SRC, `${clip.key}.webm`) : ''
    const input = local && existsSync(local) ? ['-i', local] : ['-user_agent', UA, '-i', clip.url]
    const cut = ['-ss', String(clip.start), ...input, '-t', String(clip.length), '-an']
    const crop = clip.crop?.aspect
      ? `crop=iw:min(ih\\,iw/${clip.crop.aspect}),`
      : clip.crop?.trim
        ? `crop=iw*${1 - 2 * clip.crop.trim}:ih*${1 - 2 * clip.crop.trim},`
        : ''
    const vf = `${crop}scale=${clip.width}:-2:flags=lanczos,fps=24,format=yuv420p`
    const base = join(OUT, clip.id)
    ffmpeg([...cut, '-vf', vf, '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '27', '-movflags', '+faststart', `${base}.mp4`])
    ffmpeg([...cut, '-vf', vf, '-c:v', 'libvpx-vp9', '-crf', '37', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', `${base}.webm`])
    // its still: the clip's first frame (what the cinema shows before it plays, and instead of it)
    ffmpeg(['-i', `${base}.mp4`, '-frames:v', '1', `${base}-still.png`])
    await sharp(`${base}-still.png`).avif({ quality: 52, effort: 6 }).toFile(`${base}.avif`)
    const { height = 0 } = await sharp(`${base}-still.png`).metadata()
    // a frame from its middle, for the atlas
    ffmpeg(['-ss', String(clip.length / 2), '-i', `${base}.mp4`, '-frames:v', '1', `${base}-mid.png`])
    ffmpeg(['-ss', String(clip.length * 0.85), '-i', `${base}.mp4`, '-frames:v', '1', `${base}-late.png`])
    made.push({ clip, height })
    console.log(`${clip.id}: mp4 ${kb(`${base}.mp4`)} KB, webm ${kb(`${base}.webm`)} KB, still ${kb(`${base}.avif`)} KB (${clip.width}×${height})`)
  }

  // the atlas: a frame of each, 256 × 144, four across and two down
  const TILE = { w: 256, h: 144 }
  // (fewer than eight films: the first ones give a second frame, from late in their clips)
  const frames = [...made.map(({ clip }) => `${clip.id}-mid.png`), ...made.map(({ clip }) => `${clip.id}-late.png`)].slice(0, 8)
  const tiles = await Promise.all(frames.map((f) => sharp(join(OUT, f)).resize(TILE.w, TILE.h, { fit: 'cover' }).toBuffer()))
  await sharp({ create: { width: TILE.w * 4, height: TILE.h * 2, channels: 3, background: '#000' } })
    .composite(tiles.slice(0, 8).map((input, i) => ({ input, left: (i % 4) * TILE.w, top: Math.floor(i / 4) * TILE.h })))
    .avif({ quality: 50, effort: 6 })
    .toFile(join(OUT, 'atlas.avif'))
  console.log(`atlas: ${kb(join(OUT, 'atlas.avif'))} KB`)
  for (const { clip } of made) for (const s of ['still', 'mid', 'late']) execFileSync('rm', ['-f', join(OUT, `${clip.id}-${s}.png`)])

  // the credit the licences ask for (CC BY: the title, its maker, the licence; that these are excerpts)
  const cc = made.filter(({ clip }) => clip.licence.startsWith('CC'))
  const pd = made.filter(({ clip }) => !clip.licence.startsWith('CC'))
  const byLicence = (l: string) => cc.filter(({ clip }) => clip.licence === l).map(({ clip }) => `${clip.title} (${clip.year}, ${clip.maker})`)
  const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
  const ccParts = ['CC BY 4.0', 'CC BY 3.0'].filter((l) => byLicence(l).length).map((l) => `${list(byLicence(l))} under ${l}`)
  const pdParts = pd.map(({ clip }) => `${clip.title} (${clip.maker}, ${clip.year}) is in the ${clip.licence}`)
  const credit = `The films shown are placeholders: excerpts of ${list(ccParts)} (studio.blender.org, creativecommons.org/licenses); ${list(pdParts)}.`

  const ts = `/**
   * GENERATED by scripts/make-hero-films.ts — do not edit; change the script's CLIPS and run it again.
   *
   * The films each space's cinema plays on the tour: PLACEHOLDERS the owner will replace with real films
   * (the owner, 2026-11-06). Every one is free to show — in the public domain, or under Creative Commons
   * Attribution, credited in \`FILM_CREDIT\` (the tour's close carries it).
   */
  export type HeroFilm = {
    id: string
    title: string
    year: number
    maker: string
    licence: string
    source: string
    mp4: string
    webm: string
    still: string
    /** Width over height. */
    aspect: number
    loop: boolean
    /** Its place in the stills atlas (4 × 2). */
    atlas: number
  }

  export const HERO_FILMS: readonly HeroFilm[] = ${JSON.stringify(
    made.map(({ clip, height }, i) => ({
      id: clip.id, title: clip.title, year: clip.year, maker: clip.maker, licence: clip.licence, source: clip.page,
      mp4: `/hero/films/${clip.id}.mp4`, webm: `/hero/films/${clip.id}.webm`, still: `/hero/films/${clip.id}.avif`,
      aspect: +(clip.width / height).toFixed(4), loop: clip.loop, atlas: i,
    })),
    null,
    2,
  )}

  /** The stills atlas: a frame of each film, 4 × 2. */
  export const FILM_ATLAS = '/hero/films/atlas.avif'

  // PLACEHOLDER — the credit for the placeholder films; it goes when they are replaced
  export const FILM_CREDIT = ${JSON.stringify(credit)}
  `
  // (the template above is indented with the function: the file it writes is not)
  writeFileSync(join(ROOT, 'content', 'hero-films.ts'), ts.replace(/^ {2}/gm, ''))
  console.log('content/hero-films.ts written')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
