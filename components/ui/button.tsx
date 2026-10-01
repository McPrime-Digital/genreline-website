/**
 * Button — the app's recipe (components/ui/button.tsx), so a button on the
 * site and a button in the product are the same object. One primary (gold)
 * per view (S-B). `asChild` renders a Next <Link> or an <a> as the button.
 */
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg border border-transparent font-medium outline-none touch-manipulation',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-[--dur-press] ease-[--ease-out]',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'active:scale-[0.98] motion-reduce:active:scale-100',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-[0_1px_0_hsl(var(--foreground)/0.08)] hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border-border bg-background/60 text-foreground hover:bg-secondary/60',
        ghost: 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        link: 'h-auto px-0 text-foreground underline decoration-border underline-offset-4 hover:decoration-primary',
      },
      size: {
        sm: 'h-8 px-3 text-[13px] [&_svg]:size-3.5',
        md: 'h-9 px-3.5 text-sm [&_svg]:size-4',
        lg: 'h-11 px-5 text-[15px] [&_svg]:size-4',
        icon: 'size-10 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonProps = React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      data-variant={variant ?? 'secondary'}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
}
