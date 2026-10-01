import type { MetadataRoute } from 'next'
import { PAGES } from '@/content/pages'
import { SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return PAGES.map((p) => ({
    url: `${SITE_ORIGIN}${p.path === '/' ? '' : p.path}`,
    lastModified: now,
    changeFrequency: p.path === '/changelog' || p.path === '/roadmap' ? 'weekly' : 'monthly',
    priority: p.path === '/' ? 1 : p.path.startsWith('/product') ? 0.8 : 0.6,
  }))
}
