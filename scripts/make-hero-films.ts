/**
 * THE TOUR'S FILMS — PLACEHOLDERS (the owner, 2026-11-06: "for now you can add the films any film from
 * the internet as i will change it with real films"). Cuts each cinema's clip from its sources and writes:
 *
 *   public/hero/films/<id>.mp4    H.264 (hardware-decoded nearly everywhere), no sound, 24 fps
 *   public/hero/films/<id>.avif   its still: shown until the clip plays, and where it never will
 *   public/hero/films/atlas.avif  a still of each, 4 × 4 — the far worlds' frames, the Suite's floor
 *   content/hero-films.ts         GENERATED: what the scene plays, and the credit the licences ask for
 *
 * The owner's brief for them (2026-11-06): Crew — "real human modern era video a bit longer"; Client —
 * a cinema-wide (21:9) film "of high value"; the Suite — the cartoons, and real footage: "nature videos,
 * wildlife videos, era montages and timelapses". Every source is free to show: in the public domain, or
 * under Creative Commons Attribution (credited in the line the tour's close carries).
 *
 * Run by hand: `FILMS_SRC=<dir> npx tsx scripts/make-hero-films.ts`, each source in <dir>/<key>.<ext>
 * (download them once — Wikimedia asks for few requests). To use the owner's own films, replace CLIPS and
 * run it again: nothing in the scene changes.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

type Source = { key: string; ext?: string; start: number; length: number }
type Clip = {
  /** The scene's name for it. */
  id: string
  title: string
  year: number | string
  maker: string
  licence: 'public domain' | 'public domain in the United States' | 'CC BY 3.0' | 'CC BY 4.0' | 'CC BY 2.5' | 'various'
  page: string
  /** What it is cut from: one passage, or several (a montage). */
  from: Source[]
  /** The clip's width; its height follows the first source's shape (or `crop`'s). */
  width: number
  /** Trimmed by a share at every edge (a source's dark corners), or cut to a shape (width over height). */
  crop?: { aspect?: number; trim?: number }
  /** Loops in place (a cinema), or plays once (a card in the Suite's deck, which moves on as it ends). */
  loop: boolean
  /** Credited, or not (a montage of sources credited on their own). */
  credit?: boolean
}

const CLIPS: Clip[] = [
  {
    id: 'crew', title: 'Artemis III terminal countdown simulation', year: 2026, maker: 'NASA (Cory S Huston)', licence: 'public domain',
    page: 'https://images.nasa.gov/details/KSC-20260507-MH-CSH01-0001-Artemis_III_Firing_Room_1_Launch_Sim-M20700',
    // a crew at work, the owner's "real human modern era video a bit longer": the launch team in Firing Room 1
    // — the launch director at the microphone, the leads conferring, controllers at their consoles — whole
    // shots of four seconds each (the reel's own cuts at 19.5, 51.7, 69.9, 211.1, 291.6 and 340.5 s)
    from: [
      { key: 'nasa/fr3', ext: 'mp4', start: 20.2, length: 4 }, { key: 'nasa/fr3', ext: 'mp4', start: 52.2, length: 4 },
      { key: 'nasa/fr3', ext: 'mp4', start: 70.6, length: 4 }, { key: 'nasa/fr3', ext: 'mp4', start: 212, length: 4 },
      { key: 'nasa/fr3', ext: 'mp4', start: 292.2, length: 4 }, { key: 'nasa/fr3', ext: 'mp4', start: 341.2, length: 4 },
    ],
    width: 854, loop: true,
  },
  {
    id: 'client', title: 'Tears of Steel', year: 2012, maker: 'Blender Foundation', licence: 'CC BY 3.0', page: 'https://mango.blender.org',
    from: [{ key: 'tos720', ext: 'mov', start: 268, length: 18 }],
    width: 1280, loop: true,
  },
  { id: 'suite-1', title: 'Spring', year: 2019, maker: 'Blender Studio', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Spring_-_Blender_Open_Movie.webm', from: [{ key: 'spring', start: 26, length: 8 }], width: 854, loop: false },
  { id: 'suite-2', title: 'Cheetahs on the Edge', year: 2012, maker: 'Gregory Wilson', licence: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Cheetahs_on_the_Edge_(Director%27s_Cut).ogv', from: [{ key: 'cheetahs', start: 100, length: 8 }], width: 854, loop: false },
  { id: 'suite-3', title: 'Sintel', year: 2010, maker: 'Blender Foundation', licence: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Sintel_movie_4K.webm', from: [{ key: 'sintel', start: 266, length: 8 }], width: 854, loop: false },
  { id: 'suite-4', title: 'Mount Bromo time-lapse', year: 2012, maker: 'Justin Ng', licence: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Mount_Bromo_HD_Timelapse_Movie_by_Justin_Ng.webm', from: [{ key: 'bromo', start: 75, length: 8 }], width: 854, loop: false },
  {
    id: 'suite-5', title: 'A century of film', year: '1902–2019', maker: 'a montage', licence: 'various', page: '', credit: false,
    // an era montage: Méliès, the Fleischers, a shuttle in orbit, Tears of Steel, Spring
    from: [{ key: 'melies', start: 366, length: 2 }, { key: 'gulliver', start: 512, length: 2 }, { key: 'sts51', start: 4, length: 2 }, { key: 'tos720', ext: 'mov', start: 283, length: 2 }, { key: 'spring', start: 30, length: 2 }],
    width: 854, crop: { aspect: 16 / 9 }, loop: false,
  },
  { id: 'suite-6', title: 'Sprite Fright', year: 2021, maker: 'Blender Studio', licence: 'CC BY 4.0', page: 'https://commons.wikimedia.org/wiki/File:Sprite_Fright_-_Blender_Open_Movie-full_movie.webm', from: [{ key: 'sprite', start: 104, length: 8 }], width: 854, loop: false },
  { id: 'suite-7', title: 'Time-Lapsing thru Europe', year: 2012, maker: 'Tellurian Media', licence: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Time-Lapsing_thru_Europe.webm', from: [{ key: 'europe', start: 113, length: 7 }], width: 854, loop: false },
  { id: 'suite-8', title: 'Gulliver’s Travels', year: 1939, maker: 'Fleischer Studios', licence: 'public domain in the United States', page: 'https://commons.wikimedia.org/wiki/File:Gulliver%27s_Travels_(1939).webm', from: [{ key: 'gulliver', start: 510, length: 8 }], width: 640, crop: { trim: 0.06 }, loop: false },
  { id: 'suite-9', title: 'STS-51, in IMAX', year: 1993, maker: 'NASA', licence: 'public domain', page: 'https://commons.wikimedia.org/wiki/File:STS-51_IMAX_footage_part_1.webm', from: [{ key: 'sts51', start: 2, length: 8 }], width: 854, loop: false },
  { id: 'suite-10', title: 'Big Buck Bunny', year: 2008, maker: 'Blender Foundation', licence: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_4K.webm', from: [{ key: 'bunny', start: 108, length: 8 }], width: 854, loop: false },
  { id: 'suite-11', title: 'A Trip to the Moon', year: 1902, maker: 'Georges Méliès', licence: 'public domain', page: 'https://commons.wikimedia.org/wiki/File:Le_Voyage_dans_la_Lune_(1902).webm', from: [{ key: 'melies', start: 359, length: 10 }], width: 640, loop: false },
  { id: 'suite-12', title: 'Mount Bromo time-lapse, morning', year: 2012, maker: 'Justin Ng', licence: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Mount_Bromo_HD_Timelapse_Movie_by_Justin_Ng.webm', from: [{ key: 'bromo', start: 183, length: 8 }], width: 854, loop: false, credit: false },
]

const ROOT = process.cwd()
const OUT = join(ROOT, 'public', 'hero', 'films')
const SRC = process.env.FILMS_SRC
const ffmpeg = (args: string[]) => execFileSync('ffmpeg', ['-nostdin', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] })
const kb = (p: string) => Math.round(statSync(p).size / 1024)

async function main() {
  if (!SRC) throw new Error('FILMS_SRC: the folder of downloaded sources (<key>.<ext>)')
  mkdirSync(OUT, { recursive: true })
  // what this run makes replaces what was there (an old clip's files never linger)
  for (const f of readdirSync(OUT)) rmSync(join(OUT, f))
  const made: { clip: Clip; aspect: number }[] = []
  for (const clip of CLIPS) {
    const inputs: string[] = []
    clip.from.forEach((s) => {
      const file = join(SRC, `${s.key}.${s.ext ?? 'webm'}`)
      if (!existsSync(file)) throw new Error(`missing source ${file}`)
      inputs.push('-ss', String(s.start), '-t', String(s.length), '-i', file)
    })
    const crop = clip.crop?.aspect
      ? `crop=min(iw\\,ih*${clip.crop.aspect.toFixed(4)}):min(ih\\,iw/${clip.crop.aspect.toFixed(4)}),`
      : clip.crop?.trim
        ? `crop=iw*${1 - 2 * clip.crop.trim}:ih*${1 - 2 * clip.crop.trim},`
        : ''
    // each passage cut, shaped and sized alike, then joined (one passage: just shaped and sized)
    const n = clip.from.length
    const height = clip.crop?.aspect ? Math.round(clip.width / clip.crop.aspect / 2) * 2 : -2
    const shape = (i: number) => `[${i}:v]${crop}scale=${clip.width}:${height}:flags=lanczos,setsar=1,fps=24,format=yuv420p[v${i}]`
    const graph = n === 1 ? shape(0).replace('[v0]', '[out]') : `${clip.from.map((_, i) => shape(i)).join(';')};${clip.from.map((_, i) => `[v${i}]`).join('')}concat=n=${n}:v=1:a=0[out]`
    const base = join(OUT, clip.id)
    ffmpeg([...inputs, '-filter_complex', graph, '-map', '[out]', '-an', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '27', '-movflags', '+faststart', `${base}.mp4`])
    // its still: the clip's first frame (what the cinema shows before it plays, and instead of it)
    ffmpeg(['-i', `${base}.mp4`, '-frames:v', '1', `${base}-still.png`])
    await sharp(`${base}-still.png`).avif({ quality: 52, effort: 6 }).toFile(`${base}.avif`)
    const meta = await sharp(`${base}-still.png`).metadata()
    const length = clip.from.reduce((t, s) => t + s.length, 0)
    ffmpeg(['-ss', String(length / 2), '-i', `${base}.mp4`, '-frames:v', '1', `${base}-mid.png`])
    ffmpeg(['-ss', String(length * 0.85), '-i', `${base}.mp4`, '-frames:v', '1', `${base}-late.png`])
    made.push({ clip, aspect: (meta.width ?? 1) / (meta.height ?? 1) })
    console.log(`${clip.id}: mp4 ${kb(`${base}.mp4`)} KB, still ${kb(`${base}.avif`)} KB (${meta.width}×${meta.height}, ${length} s)`)
  }

  // the atlas: a frame of each, 256 × 144, four across and four down (the first ones give a second frame)
  const TILE = { w: 256, h: 144 }
  const frames = [...made.map(({ clip }) => `${clip.id}-mid.png`), ...made.map(({ clip }) => `${clip.id}-late.png`)].slice(0, 16)
  const tiles = await Promise.all(frames.map((f) => sharp(join(OUT, f)).resize(TILE.w, TILE.h, { fit: 'cover' }).toBuffer()))
  await sharp({ create: { width: TILE.w * 4, height: TILE.h * 4, channels: 3, background: '#000' } })
    .composite(tiles.map((input, i) => ({ input, left: (i % 4) * TILE.w, top: Math.floor(i / 4) * TILE.h })))
    .avif({ quality: 50, effort: 6 })
    .toFile(join(OUT, 'atlas.avif'))
  console.log(`atlas: ${kb(join(OUT, 'atlas.avif'))} KB`)
  for (const f of readdirSync(OUT)) if (f.endsWith('.png')) rmSync(join(OUT, f))

  // the credit the licences ask for (CC BY: the title, its maker, the licence; that these are excerpts)
  const credited = made.filter(({ clip }) => clip.credit !== false)
  const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
  const ccLicences = [...new Set(credited.filter(({ clip }) => clip.licence.startsWith('CC')).map(({ clip }) => clip.licence))].sort().reverse()
  const ccParts = ccLicences.map((l) => `${list(credited.filter(({ clip }) => clip.licence === l).map(({ clip }) => `${clip.title} (${clip.maker}, ${clip.year})`))} under ${l}`)
  const pd = credited.filter(({ clip }) => clip.licence.startsWith('public'))
  const pdParts = pd.map(({ clip }) => `${clip.title} (${clip.maker}, ${clip.year}) is in the ${clip.licence}`)
  const credit = `The films shown are placeholders: excerpts of ${list(ccParts)} (creativecommons.org/licenses); ${list(pdParts)}.`

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
  year: number | string
  maker: string
  licence: string
  source: string
  mp4: string
  still: string
  /** Width over height. */
  aspect: number
  loop: boolean
  /** Its place in the stills atlas (4 × 4). */
  atlas: number
}

export const HERO_FILMS: readonly HeroFilm[] = ${JSON.stringify(
    made.map(({ clip, aspect }, i) => ({
      id: clip.id, title: clip.title, year: clip.year, maker: clip.maker, licence: clip.licence, source: clip.page,
      mp4: `/hero/films/${clip.id}.mp4`, still: `/hero/films/${clip.id}.avif`, aspect: +aspect.toFixed(4), loop: clip.loop, atlas: i,
    })),
    null,
    2,
  )}

/** The stills atlas: a frame of each film, 4 × 4. */
export const FILM_ATLAS = '/hero/films/atlas.avif'
/** The Suite's deck: its films, in the order they first come. */
export const DECK_FILMS: readonly string[] = ${JSON.stringify(made.filter(({ clip }) => clip.id.startsWith('suite-')).map(({ clip }) => clip.id))}

// PLACEHOLDER — the credit for the placeholder films; it goes when they are replaced
export const FILM_CREDIT = ${JSON.stringify(credit)}
`
  writeFileSync(join(ROOT, 'content', 'hero-films.ts'), ts)
  console.log('content/hero-films.ts written')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
