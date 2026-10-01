import type { MetadataRoute } from 'next'
import { INDEXABLE, SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

// Preview deployments are not indexed (S-W §8). Production allows the site and
// names the sitemap; nothing on this site is behind a session.
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE && process.env.LIGHTHOUSE_AS_PRODUCTION !== '1') return { rules: [{ userAgent: '*', disallow: '/' }] }
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/og/'] }], sitemap: `${SITE_ORIGIN}/sitemap.xml`, host: SITE_ORIGIN }
}
