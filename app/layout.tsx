import type { Metadata, Viewport } from 'next'
import { Geist, Schibsted_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LiveSwitch } from '@/components/cinema/LiveSwitch'
import { SiteHeader, type HeaderNav } from '@/components/site/SiteHeader'
import { SiteFooter } from '@/components/site/SiteFooter'
import { NETWORK_EARLY_ACCESS, NETWORK_MENU, PRODUCT_MENU, SOLUTIONS_MENU } from '@/content/nav'
import { siteLabel } from '@/content/features'
import { PRODUCT_NAME, DESCRIPTION, SITE_ORIGIN, INDEXABLE } from '@/lib/site'
import './globals.css'

// The two faces, self-hosted and preloaded by next/font at build (S-W §8).
const geist = Geist({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const schibsted = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap', preload: false })

const indexable = INDEXABLE || process.env.LIGHTHOUSE_AS_PRODUCTION === '1'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: `${PRODUCT_NAME} — the operating system for film and media studios`, template: `%s — ${PRODUCT_NAME}` },
  description: DESCRIPTION,
  applicationName: PRODUCT_NAME,
  openGraph: { siteName: PRODUCT_NAME, type: 'website', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
  // Preview deployments carry noindex (S-W §8); the header does the same.
  robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F7F9FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0A1F' },
  ],
  colorScheme: 'light dark',
}

// The badge on each network item is resolved HERE, on the server, from the
// label source — content/features.ts never ships to the browser.
const nav: HeaderNav = {
  product: PRODUCT_MENU,
  solutions: SOLUTIONS_MENU,
  network: NETWORK_MENU.map((l) => ({ ...l, badge: l.featureId ? siteLabel(l.featureId) : null })),
  earlyAccess: NETWORK_EARLY_ACCESS,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${schibsted.variable} site-canvas min-h-dvh font-body antialiased`}>
        <a href="#main" className="sr-only z-[100] rounded-lg bg-popover px-4 py-2 text-sm font-medium text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-ring">
          Skip to content
        </a>
        <div id="top-sentinel" aria-hidden className="absolute left-0 top-0 h-px w-px" />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem value={{ light: 'light', dark: 'dark', matte: 'dark' }} disableTransitionOnChange>
          <SiteHeader nav={nav} />
          <main id="main" tabIndex={-1} className="outline-none">{children}</main>
          <SiteFooter />
          <LiveSwitch />
        </ThemeProvider>
        {/* Cookieless (Vercel's docs: "does not use cookies"; visitors are a
            daily-reset request hash) — W-9 confirmed at Item 0. Rendered only
            on the production site, never on a preview. */}
        {INDEXABLE && <Analytics />}
      </body>
    </html>
  )
}
