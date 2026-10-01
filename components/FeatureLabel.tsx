/**
 * <FeatureLabel id="CLI-08" /> — renders Available, Coming or nothing, from
 * content/features.ts ALONE (S-W W-5, §9.2). Nobody types a label by hand.
 *
 * <Feature id> wraps a claim on a page and ALWAYS stamps the S-F-A id and its
 * site label onto the DOM, even when no badge shows, so the build-time check
 * (scripts/check-labels.ts) can see every claim a page makes — a claim with
 * no visible badge is still a claim.
 */
import * as React from 'react'
import { feature, siteLabel } from '@/content/features'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function FeatureLabel({ id, className }: { id: string; className?: string }) {
  const label = siteLabel(id)
  if (!label) return null
  return (
    <Badge
      tone={label === 'Available' ? 'green' : 'blue'}
      dot
      data-feature-label={label.toLowerCase()}
      data-feature-id={id}
      className={className}
    >
      {label}
    </Badge>
  )
}

/** A claim on the page, carrying its id. `as` picks the element. */
export function Feature({
  id,
  as: Comp = 'span',
  className,
  children,
}: {
  id: string
  as?: 'span' | 'li' | 'div' | 'p'
  className?: string
  children?: React.ReactNode
}) {
  const f = feature(id)
  return (
    <Comp data-feature-id={id} data-feature-site={f.label} className={className}>
      {children ?? f.title}
    </Comp>
  )
}

/** A list of claims, each with its badge. The common case on product pages. */
export function FeatureList({
  items,
  className,
  showBadges = true,
}: {
  items: ReadonlyArray<string | { id: string; text: React.ReactNode }>
  className?: string
  showBadges?: boolean
}) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((it) => {
        const id = typeof it === 'string' ? it : it.id
        const text = typeof it === 'string' ? undefined : it.text
        const f = feature(id)
        return (
          <Feature key={id} id={id} as="li" className="flex items-start justify-between gap-4 text-[15px] leading-6 text-foreground">
            <span className="min-w-0">
              {text ?? f.title}
              {f.caveat && <span className="text-muted-foreground"> — {f.caveat}</span>}
            </span>
            {showBadges && <FeatureLabel id={id} className="mt-0.5" />}
          </Feature>
        )
      })}
    </ul>
  )
}
