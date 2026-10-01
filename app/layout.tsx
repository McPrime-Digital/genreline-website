import type { Metadata } from 'next'
import { Geist, Schibsted_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/ThemeProvider'
import { PRODUCT_NAME, DESCRIPTION, SITE_ORIGIN } from '@/lib/site'
import './globals.css'

// The two faces, self-hosted and preloaded by next/font at build (S-W §8
// "fonts self-hosted and preloaded"). Same variables the tokens reference.
const geist = Geist({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const schibsted = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: `${PRODUCT_NAME} — the operating system for film and media studios`, template: `%s — ${PRODUCT_NAME}` },
  description: DESCRIPTION,
  openGraph: { siteName: PRODUCT_NAME, type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${schibsted.variable} site-canvas font-body antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
