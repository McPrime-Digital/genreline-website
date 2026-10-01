'use client'

/**
 * "The stack you're replacing" (S-W §6 section 2): the jobs a studio's tools
 * do, each resolving into one Genreline surface. Tabs, so it is keyboard- and
 * screen-reader-complete; on a fine pointer, hovering a job also selects it.
 * No competitor logos — jobs, not brands.
 */
import * as React from 'react'
import Link from 'next/link'
import { Tabs } from 'radix-ui'
import { cx as cn } from '@/lib/cx'

export type StackJob = { job: string; surface: string; body: string; href: string }

export function StackRow({ jobs }: { jobs: readonly StackJob[] }) {
  const [value, setValue] = React.useState(jobs[0].job)
  const finePointer = React.useRef(false)
  React.useEffect(() => {
    finePointer.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }, [])

  return (
    <Tabs.Root value={value} onValueChange={setValue} orientation="vertical" className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-12">
      <Tabs.List aria-label="Jobs your tools do today" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {jobs.map((j) => (
          <Tabs.Trigger
            key={j.job}
            value={j.job}
            onPointerEnter={() => finePointer.current && setValue(j.job)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-left text-[15px] font-medium text-muted-foreground outline-none transition-colors duration-[--dur-pop]',
              'hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-secondary/70 data-[state=active]:text-foreground',
              'lg:py-2.5',
            )}
          >
            {j.job}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {jobs.map((j) => (
        <Tabs.Content key={j.job} value={j.job} className="outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <div className="swap-enter squircle-lg border border-border bg-card/50 p-6 sm:p-8">
            <p className="text-[13px] text-muted-foreground">In Genreline</p>
            <p className="mt-2 font-display text-2xl font-semibold leading-snug text-foreground">{j.surface}</p>
            <p className="mt-3 max-w-[56ch] text-[15px] leading-7 text-muted-foreground">{j.body}</p>
            <Link href={j.href} className="mt-5 inline-block text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-primary">
              See how it works
            </Link>
          </div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  )
}
