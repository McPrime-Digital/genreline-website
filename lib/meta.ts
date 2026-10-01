import type { Metadata } from 'next'
import { page } from '@/content/pages'
import { ogSlug } from '@/content/og'

/** One metadata source per page: title, description, canonical and og:url
 *  agree (ui-skills fixing-metadata); the social card is the page's own. */
export function pageMeta(path: string): Metadata {
  const p = page(path)
  const image = { url: `/og/${ogSlug(path)}`, width: 1200, height: 630, alt: p.title }
  return {
    title: path === '/' ? { absolute: `Genreline — ${p.title}` } : p.title,
    description: p.description,
    alternates: { canonical: path },
    openGraph: { title: p.title, description: p.description, url: path, images: [image] },
    twitter: { card: 'summary_large_image', title: p.title, description: p.description, images: [image.url] },
  }
}
