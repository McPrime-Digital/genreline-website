import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/** The app's status vocabulary: a tone is a MEANING, so two pages cannot
 *  colour the same state differently. Green = done/available, blue = in
 *  motion/being built, gray = planned. */
export const badgeVariants = cva(
  'inline-flex h-5 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-1.5 text-[11px] font-medium leading-none',
  {
    variants: {
      tone: {
        neutral: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-transparent text-muted-foreground',
        green: 'border-transparent bg-status-green/15 text-status-green',
        blue: 'border-transparent bg-status-blue/15 text-status-blue',
        gray: 'border-transparent bg-status-gray/15 text-status-gray',
        violet: 'border-transparent bg-status-violet/15 text-status-violet',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export function Badge({ className, tone, dot, children, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
