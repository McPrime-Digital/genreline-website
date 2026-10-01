/**
 * The forwarding check (S-W W-11, §10 step 8). Against a RUNNING server
 * (`npm run build && npm run start`, or BASE=…), every path the app serves
 * must 308 to the same path on app.genreline.com with its query string
 * intact; every path the website owns must NOT forward; an unknown path
 * under an owned prefix must be the website's 404. The reset-link shape is
 * the one the app mints (`/auth/callback?token_hash=…&type=recovery&next=…`).
 */
const BASE = process.env.BASE ?? 'http://localhost:3001'
const APP = 'https://app.genreline.com'

type Case = { path: string; expect: 'forward' | 'own' | 'notfound' }
const CASES: Case[] = [
  // the runbook's minimum set (docs/runbooks/batch-28-app-move.md §5 step 14)
  { path: '/auth/callback?token_hash=abc123&type=recovery&next=%2Fset-password', expect: 'forward' },
  { path: '/set-password', expect: 'forward' },
  { path: '/reset-password', expect: 'forward' },
  { path: '/login', expect: 'forward' },
  { path: '/login/verify', expect: 'forward' },
  { path: '/signup?plan=studio', expect: 'forward' },
  { path: '/s/0123456789abcdef', expect: 'forward' },
  { path: '/sign/0123456789abcdef', expect: 'forward' },
  { path: '/meet/0f0f0f0f-0013-4000-8000-000000000001', expect: 'forward' },
  // the rest of the app's surface
  { path: '/studio/crew/tasks', expect: 'forward' },
  { path: '/dashboard', expect: 'forward' },
  { path: '/projects/abc', expect: 'forward' },
  { path: '/approvals/abc/certificate', expect: 'forward' },
  { path: '/invoices', expect: 'forward' },
  { path: '/messages', expect: 'forward' },
  { path: '/files', expect: 'forward' },
  { path: '/team', expect: 'forward' },
  { path: '/legal/terms', expect: 'forward' },
  { path: '/legal/privacy', expect: 'forward' },
  { path: '/admin/clients', expect: 'forward' },
  { path: '/api/scim/v2/Users', expect: 'forward' },
  { path: '/api/integrations/nle/export', expect: 'forward' },
  { path: '/api/webhooks/stripe', expect: 'forward' },
  { path: '/docs/integrations/nle-panel.md', expect: 'forward' },
  { path: '/no-studio', expect: 'forward' },
  { path: '/onboarding', expect: 'forward' },
  // owned by the website
  { path: '/', expect: 'own' },
  { path: '/product', expect: 'own' },
  { path: '/product/review', expect: 'own' },
  { path: '/pricing', expect: 'own' },
  { path: '/security/disclosure', expect: 'own' },
  { path: '/robots.txt', expect: 'own' },
  { path: '/sitemap.xml', expect: 'own' },
  { path: '/brand/genreline-mark-gold.png', expect: 'own' },
  // unknown under an owned prefix → the website's 404, not a forward
  { path: '/product/nonsense', expect: 'notfound' },
  { path: '/solutions/nope', expect: 'notfound' },
]

async function main() {
  let failed = 0
  for (const c of CASES) {
    const res = await fetch(`${BASE}${c.path}`, { redirect: 'manual' })
    const loc = res.headers.get('location')
    let ok = false
    let detail = `${res.status}${loc ? ` → ${loc}` : ''}`
    if (c.expect === 'forward') ok = res.status === 308 && loc === `${APP}${c.path}`
    else if (c.expect === 'own') ok = res.status === 200
    else ok = res.status === 404
    if (!ok) failed++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.expect.padEnd(8)} ${c.path}  (${detail})`)
  }
  console.log(failed ? `\n${failed} FAILED` : '\nall forwarding cases pass')
  process.exit(failed ? 1 : 0)
}
main().catch((e) => { console.error(e); process.exit(1) })
