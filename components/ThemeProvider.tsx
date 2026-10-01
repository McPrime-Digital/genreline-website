'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import type { ComponentProps } from 'react'
import { MATTE } from '@/content/matte.generated'

/** The browser chrome follows the page. The viewport metadata carries one
 *  colour per prefers-color-scheme; Matte is a choice, not a preference, so
 *  while it is on, both theme-color tags take the material's colour and are
 *  restored when it is turned off. */
function ThemeColorSync() {
  const { resolvedTheme } = useTheme()
  React.useEffect(() => {
    if (resolvedTheme !== 'matte') return
    const tags = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'))
    const before = tags.map((t) => t.content)
    tags.forEach((t) => { t.content = MATTE.surface })
    return () => tags.forEach((t, i) => { t.content = before[i] })
  }, [resolvedTheme])
  return null
}

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {MATTE.ready && <ThemeColorSync />}
      {children}
    </NextThemesProvider>
  )
}
