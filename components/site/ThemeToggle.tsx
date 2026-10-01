'use client'

/** System / Light / Dark — native radios, so the keyboard model is the
 *  browser's own. Renders its checked state only after mount: the server
 *  cannot know the visitor's choice, and guessing would mismatch hydration. */
import * as React from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from '@/components/icons'
import { cx as cn } from '@/lib/cx'

const subscribe = () => () => {}
const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(subscribe, () => true, () => false)
  const current = mounted ? (theme ?? 'system') : null
  return (
    <fieldset className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-background/60 p-0.5">
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label
          key={value}
          className={cn(
            'relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2 text-[12px] font-medium transition-colors duration-[--dur-pop]',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
            current === value ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <input type="radio" name="theme" value={value} checked={current === value} onChange={() => setTheme(value)} className="sr-only" />
          <Icon aria-hidden className="size-3.5" />
          {label}
        </label>
      ))}
    </fieldset>
  )
}
