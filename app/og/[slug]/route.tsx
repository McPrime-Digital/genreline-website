/**
 * A social card per page, generated at BUILD from the page's own headline and
 * description (S-W §8: "generated social card per page from its own
 * headline"). The mark is read from disk; the card never fetches its origin.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { PAGES } from '@/content/pages'
import { OG_SLUGS, pathForSlug } from '@/content/og'
import { PRODUCT_NAME, TAGLINE } from '@/lib/site'

export const dynamic = 'force-static'
export const dynamicParams = false
export function generateStaticParams() {
  return OG_SLUGS.map((slug) => ({ slug }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = PAGES.find((p) => p.path === pathForSlug(slug))
  const title = !page || page.path === '/' ? TAGLINE : page.title
  const description = page?.description ?? ''
  const mark = await readFile(join(process.cwd(), 'public', 'brand', 'genreline-mark-gold-256.png'))
  const src = `data:image/png;base64,${mark.toString('base64')}`
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#020A2B', color: '#E8EBF5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} width={70} height={56} alt="" />
          <div style={{ fontSize: 34, fontWeight: 700 }}>{PRODUCT_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ width: 64, height: 3, background: '#C8A24A' }} />
          <div style={{ fontSize: title.length > 40 ? 58 : 68, fontWeight: 700, lineHeight: 1.06, letterSpacing: -1.5, maxWidth: 980 }}>{title}</div>
          <div style={{ fontSize: 26, color: '#9AA5C8', maxWidth: 980, lineHeight: 1.35 }}>{description.length > 150 ? description.slice(0, 147) + '…' : description}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
