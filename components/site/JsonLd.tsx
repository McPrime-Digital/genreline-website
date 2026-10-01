/** Structured data for what the home page actually renders — no invented
 *  prices, ratings or reviews (ui-skills fixing-metadata). */
import { APP_ORIGIN, DESCRIPTION, PRODUCT_NAME, SITE_ORIGIN } from '@/lib/site'

export function HomeJsonLd() {
  const data = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: PRODUCT_NAME, url: SITE_ORIGIN, logo: `${SITE_ORIGIN}/brand/genreline-mark-gold-256.png` },
    { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: PRODUCT_NAME, applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: APP_ORIGIN, description: DESCRIPTION },
  ]
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}
