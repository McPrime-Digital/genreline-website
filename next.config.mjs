import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** The app's origin. Every path this site does not own forwards here (W-11). */
export const APP_ORIGIN = 'https://app.genreline.com'

// ── THE ONE FORWARDING RULE (S-W W-11) ─────────────────────────────────────
//
// Before the move the app lived at genreline.com, so invite emails, reset
// emails, screening links, signing links and bookmarks still point here. The
// rule: any path the website does not own is sent, permanently (308 — method
// and query string preserved), to the same path on app.genreline.com.
//
// "Owned" is not a hand-kept list. It is read from the `app/` directory at
// build time — every top-level route folder, every metadata file, every
// public asset — so adding a page here owns its path automatically and a
// forgotten APP path can never break a link: anything not listed forwards.
// An unknown path *under* an owned prefix (e.g. /product/nonsense) is not
// forwarded and shows this site's 404, exactly as W-11 specifies.
function ownedPrefixes() {
  const owned = new Set(['_next', '_vercel', 'og'])
  const app = readdirSync(join(__dirname, 'app'), { withFileTypes: true })
  for (const e of app) {
    if (e.name.startsWith('(') || e.name.startsWith('_') || e.name.startsWith('[')) continue
    if (e.isDirectory()) {
      if (e.name === 'api') {
        // The website owns exactly the API routes it has (today: /api/inquiry).
        // Everything else under /api — SCIM, the editor bridge, webhooks — is the app's.
        for (const a of readdirSync(join(__dirname, 'app', 'api'), { withFileTypes: true })) {
          if (a.isDirectory()) owned.add(`api/${a.name}`)
        }
      } else {
        owned.add(e.name)
      }
      continue
    }
    // Metadata files become routes under names Next decides.
    const base = e.name.replace(/\.[a-z]+$/i, '')
    if (base === 'sitemap') owned.add('sitemap.xml')
    else if (base === 'robots') owned.add('robots.txt')
    else if (base === 'manifest') owned.add('manifest.webmanifest')
    else if (['opengraph-image', 'twitter-image'].includes(base)) owned.add(base)
    else if (['icon', 'apple-icon', 'favicon'].includes(base)) owned.add(e.name)
  }
  for (const e of readdirSync(join(__dirname, 'public'), { withFileTypes: true })) {
    // A dot-directory (.well-known) is shared namespace: own its files, never
    // the prefix, so a path the app may one day serve there still forwards.
    if (e.isDirectory() && e.name.startsWith('.')) {
      for (const f of readdirSync(join(__dirname, 'public', e.name))) owned.add(`${e.name}/${f}`)
    } else owned.add(e.name)
  }
  return [...owned]
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

function forwardingRule() {
  const owned = ownedPrefixes().map(escapeRe).join('|')
  return {
    // `/` itself is the website's. Anything else that is not an owned prefix
    // (followed by `/` or the end) forwards. The regex is a path-to-regexp
    // parameter pattern, so Next matches it before the filesystem.
    source: `/:path((?!(?:${owned})(?:/|$)).+)`,
    destination: `${APP_ORIGIN}/:path`,
    permanent: true,
  }
}

// ── SECURITY HEADERS (S-W §9.4) ─────────────────────────────────────────────
//
// THE CSP CHOICE, REPORTED: `script-src` carries 'unsafe-inline'. Every page is
// generated at build (W-2), and Next's static HTML contains per-page inline
// bootstrap scripts whose bytes are only known once the page is built — a
// hash list would need a second build pass and would go stale on the first
// content edit, and a wrong enforced CSP is a blank page for every visitor.
// A nonce needs per-request rendering, which W-2 rules out. So the policy is
// strict everywhere a static site can be strict — no remote script hosts
// except Turnstile, no objects, no framing, forms only to self, connects only
// to self and Turnstile — and permits inline script on a site that holds no
// session and sets no cookie, where an injected script would have nothing to
// take. Revisit the day Next emits hashes for its own inline scripts.
const TURNSTILE = 'https://challenges.cloudflare.com'
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline' ${TURNSTILE}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self'",
  `connect-src 'self' ${TURNSTILE}`,
  `frame-src ${TURNSTILE}`,
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

// Preview deployments carry noindex (S-W §8). VERCEL_ENV is set by Vercel at
// build; locally it is unset and the site is treated as a preview.
// Same rule as lib/site.ts INDEXABLE: only a production build for genreline.com.
const indexable = process.env.VERCEL_ENV === 'production' &&
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '').replace(/^www\./, '') === 'genreline.com'
const robotsHeaders = indexable || process.env.LIGHTHOUSE_AS_PRODUCTION === '1' ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  // `radix-ui` is a barrel re-exporting every primitive; without this the
  // first page load carries primitives no page uses.
  experimental: { optimizePackageImports: ['radix-ui'] },
  turbopack: { root: __dirname },
  async headers() {
    return [{ source: '/:path*', headers: [...securityHeaders, ...robotsHeaders] }]
  },
  async redirects() {
    return [forwardingRule()]
  },
}

export default nextConfig
