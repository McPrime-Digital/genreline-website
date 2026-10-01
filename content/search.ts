/** The search index: every page, and every feature the site may name, mapped
 *  to the page that names it. Served once as /search-index.json and fetched
 *  on first open, so it never weighs on a page view. */
import { FEATURES, type Feature } from '@/content/features'
import { PAGES } from '@/content/pages'

export type SearchItem = { title: string; href: string; group: string; badge?: 'Available' | 'Coming' }

const PAGE_FOR: Record<Feature['space'], string> = {
  platform: '/security', identity: '/enterprise', messaging: '/product/client', client: '/product/client',
  review: '/product/review', meetings: '/product/meetings', documents: '/product/contracts', money: '/product/money',
  files: '/product/files', crew: '/product/crew', notes: '/roadmap', notifications: '/product/crew',
  experience: '/product', suite: '/product/suite', generation: '/ai', sound: '/product/suite', post: '/product/suite',
  sets: '/product/suite', network: '/network', enterprise: '/enterprise',
}

export function searchIndex(): SearchItem[] {
  const pages: SearchItem[] = PAGES.map((p) => ({ title: p.path === '/' ? 'Home' : p.title, href: p.path, group: 'Pages' }))
  const features: SearchItem[] = FEATURES.filter((f) => ['available', 'coming', 'security', 'enterprise'].includes(f.label)).map((f) => {
    const href = f.label === 'security' ? '/security' : f.label === 'enterprise' ? '/enterprise' : f.id === 'MSG-02' ? '/product/crew' : PAGE_FOR[f.space]
    const badge = f.label === 'available' ? 'Available' as const : f.label === 'coming' ? 'Coming' as const : undefined
    return { title: f.caveat ? `${f.title} — ${f.caveat}` : f.title, href, group: 'Features', badge }
  })
  return [...pages, ...features]
}
