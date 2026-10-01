'use client'

/** The hero's capture switcher. The panels are server-rendered <Media>
 *  elements passed in; an unselected panel is not mounted, so its images are
 *  not fetched until somebody asks for them. */
import * as React from 'react'
import { Tabs } from 'radix-ui'

export function CaptureTabs({ tabs, label }: { tabs: { value: string; label: string; panel: React.ReactNode }[]; label: string }) {
  if (tabs.length === 0) return null
  if (tabs.length === 1) return <>{tabs[0].panel}</>
  return (
    <Tabs.Root defaultValue={tabs[0].value}>
      <Tabs.List aria-label={label} className="mb-4 flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((t) => (
          <Tabs.Trigger
            key={t.value}
            value={t.value}
            className="h-9 shrink-0 rounded-lg px-3 text-[13px] font-medium text-muted-foreground outline-none transition-colors duration-[--dur-pop] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-secondary/70 data-[state=active]:text-foreground"
          >
            {t.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((t, i) => (
        <Tabs.Content key={t.value} value={t.value} className={i === 0 ? 'outline-none' : 'swap-enter outline-none'}>
          {t.panel}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
