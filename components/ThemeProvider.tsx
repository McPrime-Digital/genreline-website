'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes'
import type { ComponentProps } from 'react'

/** Matte was offered for one afternoon (2026-10-01) and withdrawn by the owner.
 *  A browser that saved it renders Dark (the layout maps the stored value to
 *  the dark class before paint) and is moved to Dark here, so the switch
 *  shows a checked option again. */
function RetireMatte() {
  const { theme, setTheme } = useTheme()
  React.useEffect(() => {
    if (theme === 'matte') setTheme('dark')
  }, [theme, setTheme])
  return null
}

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <RetireMatte />
      {children}
    </NextThemesProvider>
  )
}
