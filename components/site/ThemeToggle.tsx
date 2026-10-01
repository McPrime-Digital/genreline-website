'use client'

/**
 * The theme switch, in the header (owner, 2026-10-01: "move the system dark
 * light mode up"). System / Light / Dark / Matte as native radios, so the
 * keyboard model is the browser's own. `compact` is the header's icon row
 * (each icon carries its name for screen readers and a hover title); the
 * full form adds the words.
 *
 * Matte is offered only when scripts/derive-matte.ts has produced it from the
 * owner's reference photograph — a "Matte" that was really Dark under another
 * name is the one thing the owner asked not to ship.
 *
 * Renders its checked state only after mount: the server cannot know the
 * visitor's choice, and guessing would mismatch hydration.
 */
import * as React from 'react'
import { useTheme } from 'next-themes'
import { Grain, Monitor, Moon, Sun } from '@/components/icons'
import { cx as cn } from '@/lib/cx'
import { MATTE } from '@/content/matte.generated'

const subscribe = () => () => {}
const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  ...(MATTE.ready ? [{ value: 'matte', label: 'Matte', Icon: Grain }] : []),
]

export function ThemeToggle({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const current = mounted ? (theme ?? 'system') : null
  const name = React.useId()
  return (
    <fieldset className={cn('inline-flex items-center gap-0.5 rounded-lg border border-border bg-background/60 p-0.5', className)}>
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label
          key={value}
          title={compact ? label : undefined}
          className={cn(
            'relative inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors duration-[--dur-pop]',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
            compact ? 'size-7' : 'h-8 flex-1 gap-1.5 px-2.5 text-[13px]',
            current === value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <input type="radio" name={name} value={value} checked={current === value} onChange={() => setTheme(value)} className="sr-only" />
          <Icon aria-hidden className="size-3.5" />
          <span className={compact ? 'sr-only' : undefined}>{label}</span>
        </label>
      ))}
    </fieldset>
  )
}
