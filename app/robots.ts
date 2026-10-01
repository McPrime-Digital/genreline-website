import type { MetadataRoute } from 'next'
import { SITE_ORIGIN } from '@/lib/site'

export const dynamic = 'force-static'

// Preview deployments are not indexed (S-W §8). Production allows the site and
// names the sitemap; nothing on this site is behind a session.
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== 'production') return { rules: [{ userAgent: '*', disallow: '/' }] }
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/og/'] }], sitemap: `${SITE_ORIGIN}/sitemap.xml`, host: SITE_ORIGIN }
}
