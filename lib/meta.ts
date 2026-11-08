import type { Metadata } from 'next'
import { page } from '@/content/pages'
import { CARD, cardVersion, cardWords, ogSlug } from '@/content/og'
import { PRODUCT_NAME } from '@/lib/site'

/**
 * One metadata source per page: title, description, canonical and og:url agree (ui-skills fixing-metadata);
 * the social card is the page's own.
 *
 * The page sets the whole of `openGraph` (a page's object replaces the layout's, so the layout's site name,
 * type and locale are repeated here, or every link preview lost them). A preview's title is the page's
 * own document title, brand included: iMessage and WhatsApp show only the title and the domain.
 */
export function pageMeta(path: string): Metadata {
  const p = page(path)
  const title = path === '/' ? `${PRODUCT_NAME} — ${p.title}` : `${p.title} — ${PRODUCT_NAME}`
  const alt = cardWords(path).lines.join(' ')
  const image = { url: `/og/${ogSlug(path)}?v=${cardVersion(path)}`, width: CARD.width, height: CARD.height, alt, type: 'image/jpeg' }
  return {
    title: path === '/' ? { absolute: title } : p.title,
    description: p.description,
    alternates: { canonical: path },
    openGraph: { siteName: PRODUCT_NAME, type: 'website', locale: 'en_US', title, description: p.description, url: path, images: [image] },
    twitter: { card: 'summary_large_image', title, description: p.description, images: [{ url: image.url, alt }] },
  }
}
