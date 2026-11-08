/**
 * A social card per page, made at BUILD (S-W §8: "generated social card per page from its own headline"):
 * the picture a link to the site shows wherever it is shared. It is the hero as the visitor meets it, the
 * landing sky and gold logo drawn by the scene (content/og.ts CARD.sky), with the words set in the site's own
 * faces: the header's mark and name, the hero's slate line, and the title in Cinzel capitals cut from film
 * stock, silver over gold (globals.css THE FILM IN THE LETTERS). Home carries the hero's own title; every
 * other page its title and description (content/og.ts cardWords).
 *
 * Served as JPEG, under 200 KB, because WhatsApp drops a preview image much over 300 KB. The owner,
 * 2026-11-07: the old card (flat navy, the October headline) was "very outdated".
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { ImageResponse } from 'next/og'
import { CARD, OG_SLUGS, cardWords, pathForSlug } from '@/content/og'
import { PRODUCT_NAME } from '@/lib/site'

export const dynamic = 'force-static'
export const dynamicParams = false
export function generateStaticParams() {
  return OG_SLUGS.map((slug) => ({ slug }))
}

const dataUrl = (b: Buffer, type: string) => `data:${type};base64,${b.toString('base64')}`

// THE FILM IN THE LETTERS, as globals.css draws it on the dark site: a metal fill, two frame lines and two
// rows of perforations inside each capital, one tile 0.3em wide and one line box tall.
const EDGE = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 1000' preserveAspectRatio='none'><g fill='#000'><rect y='229' width='300' height='16' fill-opacity='.5'/><rect y='649' width='300' height='16' fill-opacity='.5'/><rect x='122' y='147' width='56' height='40' rx='10' fill-opacity='.45'/><rect x='122' y='707' width='56' height='40' rx='10' fill-opacity='.45'/></g></svg>",
)}")`
const METAL = {
  silver: 'linear-gradient(180deg, hsl(0 0% 100%) 8%, hsl(226 39% 92%) 52%, hsl(228 26% 76%) 82%)',
  gold: 'linear-gradient(180deg, hsl(43 75% 76%) 8%, hsl(42 55% 55%) 52%, hsl(39 58% 40%) 82%)',
} as const
/** The slate line's height and its gap above the title. */
const KICKER = 44
/** The words' column, clear of the logo. */
const TITLE_WIDTH = 700
const INK = { text: 'hsl(226 39% 92%)', muted: 'hsl(226 29% 69%)', gold: 'hsl(42 55% 55%)' }

/**
 * A description short enough for three lines. A longer one ends at its last whole clause that fits (after
 * a comma, a colon or a dash), so it never stops on a dangling word ("the…").
 */
function shorten(s: string, max = 165) {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const clause = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf(': '), cut.lastIndexOf(' — '))
  const end = clause > max * 0.55 ? clause : cut.lastIndexOf(' ')
  return `${cut.slice(0, end).replace(/[\s,;:—–-]+$/, '')}…`
}

/**
 * A line of the title. The full stop stays in the same run as the letters, so the face's own kerning holds
 * ("N." tucks in); the page paints it solid only so a running perforation can't make it blink, and a card
 * doesn't run.
 */
function FilmLine({ text, metal, size }: { text: string; metal: keyof typeof METAL; size: number }) {
  return (
    <div style={{ display: 'flex', fontFamily: 'Cinzel', fontWeight: 800, fontSize: size, lineHeight: 1, letterSpacing: size * 0.01 }}>
      <span
        style={{
          backgroundImage: `${EDGE}, ${METAL[metal]}`,
          backgroundSize: `${size * 0.3}px ${size}px, 100% ${size}px`,
          backgroundRepeat: 'repeat, repeat-y',
          backgroundClip: 'text',
          color: 'transparent',
          // two even lines for a title too long for one (Cinzel capitals run about 0.66 em); never for one
          // that fits, which the balancing would cut short
          textWrap: text.length * size * 0.66 > TITLE_WIDTH ? 'balance' : 'wrap',
        }}
      >
        {text.toUpperCase()}
      </span>
    </div>
  )
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const path = pathForSlug(slug)
  const { kicker, lines, text } = cardWords(path)
  // each path written out whole, so the build traces these files and nothing else (CARD.sky names the first)
  const [sky, mark, cinzel700, cinzel800, geist, wordmark] = await Promise.all([
    readFile(join(process.cwd(), 'public', 'hero', 'card-sky.jpg')),
    readFile(join(process.cwd(), 'public', 'brand', 'genreline-white-gold-96.png')),
    readFile(join(process.cwd(), 'fonts', 'cinzel-title-700.ttf')),
    readFile(join(process.cwd(), 'fonts', 'cinzel-title-800.ttf')),
    readFile(join(process.cwd(), 'fonts', 'geist-400.ttf')),
    readFile(join(process.cwd(), 'fonts', 'schibsted-grotesk-700-wordmark.ttf')),
  ])
  const size = CARD.title
  const png = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#000' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl(sky, 'image/jpeg')} width={CARD.width} height={CARD.height} alt="" style={{ position: 'absolute', left: 0, top: 0 }} />

        {/* the header's mark and name */}
        <div style={{ position: 'absolute', left: CARD.inset, top: 52, display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl(mark, 'image/png')} width={44} height={44} alt="" />
          <div style={{ fontFamily: 'Schibsted Grotesk', fontWeight: 700, fontSize: 27, letterSpacing: -0.27, color: INK.text }}>{PRODUCT_NAME}</div>
        </div>

        {/* the slate line, the title, the line under it — the title where the page's own sat when the sky was drawn */}
        <div style={{ position: 'absolute', left: CARD.inset, top: CARD.titleTop - KICKER, display: 'flex', flexDirection: 'column', maxWidth: TITLE_WIDTH }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 18, marginBottom: KICKER - 18 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ width: 36, height: 1, background: `linear-gradient(90deg, hsl(42 55% 55% / 0), ${INK.gold})` }} />
              <div style={{ width: 6, height: 6, background: INK.gold, transform: 'rotate(45deg)', marginLeft: -3 }} />
            </div>
            <div style={{ fontFamily: 'Cinzel', fontWeight: 700, fontSize: 14, letterSpacing: 14 * 0.24, color: 'hsl(226 39% 92% / 0.92)' }}>{kicker.toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lines.map((l, i) => (
              <FilmLine key={l} text={l} metal={i === 0 ? 'silver' : 'gold'} size={size} />
            ))}
          </div>
          <div style={{ marginTop: 24, maxWidth: 600, fontFamily: 'Geist', fontSize: 21, lineHeight: 1.5, color: INK.muted }}>{shorten(text)}</div>
        </div>
      </div>
    ),
    {
      width: CARD.width,
      height: CARD.height,
      fonts: [
        { name: 'Cinzel', data: cinzel700, weight: 700, style: 'normal' },
        { name: 'Cinzel', data: cinzel800, weight: 800, style: 'normal' },
        { name: 'Geist', data: geist, weight: 400, style: 'normal' },
        { name: 'Schibsted Grotesk', data: wordmark, weight: 700, style: 'normal' },
      ],
    },
  )
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: CARD.quality, mozjpeg: true }).toBuffer()
  return new Response(new Uint8Array(jpeg), { headers: { 'content-type': 'image/jpeg' } })
}
