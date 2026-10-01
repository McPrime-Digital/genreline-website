import { PAGES } from '@/content/pages'

/** The social card's address for a page: /og/home, /og/product--crew … */
export const ogSlug = (path: string) => (path === '/' ? 'home' : path.slice(1).replace(/\//g, '--'))
export const pathForSlug = (slug: string) => (slug === 'home' ? '/' : `/${slug.replace(/--/g, '/')}`)
export const OG_SLUGS = PAGES.map((p) => ogSlug(p.path))
