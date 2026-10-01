/**
 * Icons rendered on the SERVER from lucide-static (ISC, © Lucide
 * Contributors): inline SVG in the HTML, no JavaScript shipped. Use only in
 * server components; a client component receives the rendered node as a prop.
 */
import 'server-only'
import * as icons from 'lucide-static'

export type IconName = keyof typeof icons

export function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
  const svg = icons[name] as unknown as string
  return <span aria-hidden className={`inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />
}
