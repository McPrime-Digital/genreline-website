import type { MetadataRoute } from 'next'
import { INDEXABLE, SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

// Preview deployments are not indexed (S-W §8). Production allows the site and
// names the sitemap; nothing on this site is behind a session. The social cards
// (/og/…) stay open: link-preview crawlers obey this file, and X drops the
// picture of any card whose image address it disallows.
export default function robots(): MetadataRoute.Robots {
  if (!INDEXABLE && process.env.LIGHTHOUSE_AS_PRODUCTION !== '1') return { rules: [{ userAgent: '*', disallow: '/' }] }
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }], sitemap: `${SITE_ORIGIN}/sitemap.xml`, host: SITE_ORIGIN }
}
