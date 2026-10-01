import * as React from 'react'
import { cx as cn } from '@/lib/cx'

export function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-background px-1 font-body text-[11px] font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}
