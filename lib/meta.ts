import type { Metadata } from 'next'
import { page } from '@/content/pages'

/** One metadata source per page: title, description and canonical agree
 *  (ui-skills fixing-metadata). Social cards are added in item 7. */
export function pageMeta(path: string): Metadata {
  const p = page(path)
  return {
    title: path === '/' ? { absolute: `Genreline — ${p.title}` } : p.title,
    description: p.description,
    alternates: { canonical: path },
    openGraph: { title: p.title, description: p.description, url: path },
  }
}
