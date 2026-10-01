import Link from 'next/link'
import { Feature } from '@/components/FeatureLabel'
import { PageHero } from '@/components/site/Frame'
import { SecurityVisual } from '@/components/cinema/HeroVisuals'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/security')

type Control = { id: string; title: string; body: string }
const SECTIONS: { id: string; title: string; lead: string; controls: Control[] }[] = [
  {
    id: 'isolation', title: 'Isolation', lead: 'The boundary between studios is held in the database.',
    controls: [
      { id: 'FND-01', title: 'Enforced in the database', body: 'Studio isolation is enforced in the database and proven by 76 automated security checks, each with a positive control — so a check that proves nothing cannot pass.' },
      { id: 'FND-21', title: 'A cross-tenant write is refused', body: 'Rows are stamped with their studio from their parent record, and a write that would file a row under another studio is refused.' },
      { id: 'OPS-01', title: 'Probed, not assumed', body: 'Operator probes and end-to-end tests run against the live configuration — the settings no build can see.' },
    ],
  },
  {
    id: 'identity', title: 'Identity', lead: 'Who you are, proved more than once where it matters.',
    controls: [
      { id: 'IDN-15', title: 'Two-factor and recovery codes', body: 'Authenticator-app codes, with recovery codes stored only as hashes. Sensitive actions — invites, contracts, share links, sending an invoice, changing permissions — ask for the second factor again.' },
      { id: 'IDN-16', title: 'Passkeys', body: 'Sign in with a passkey instead of a password.' },
      { id: 'IDN-14', title: 'Single sign-on', body: 'SAML and OIDC, with the domain proved by DNS first and enforcement available.' },
      { id: 'IDN-18', title: 'SCIM 2.0', body: 'Provisioning from your identity provider; deactivation signs the person out everywhere.' },
      { id: 'IDN-17', title: 'The studio’s own rules', body: 'Required two-factor, a maximum session age and an idle timeout, set by the studio.' },
      { id: 'IDN-05', title: 'Delegation limits', body: 'Nobody can grant a permission they do not hold. The database enforces it.' },
    ],
  },
  {
    id: 'application', title: 'Application protections', lead: 'What stands between the internet and the product.',
    controls: [
      { id: 'FND-18', title: 'Rate limiting in the database', body: 'One limiter shared by every server instance. On the routes that need no session, a limiter failure refuses the request rather than letting it through.' },
      { id: 'FND-19', title: 'Security headers and a per-request content security policy', body: 'A content security policy built for every response with a fresh nonce — in report-only mode today while violations are reviewed — plus strict transport security, no framing, and camera and microphone granted to the product’s own origin only.' },
      { id: 'FND-22', title: 'Bot protection and breached passwords', body: 'A challenge on sign-up and sign-in, a disposable-address list, and a check of every new password against known breaches. Passwords are at least 15 characters, with no composition rules, as NIST SP 800-63B asks.' },
    ],
  },
  {
    id: 'data', title: 'Data', lead: 'Where it lives, how long it stays, and how it leaves.',
    controls: [
      { id: 'FND-04', title: 'One US region', body: 'Everything is hosted in the United States, in one region. There is no other region today.' },
      { id: 'FND-13', title: 'Retention', body: 'Deleted rows wait out a grace window before they are purged. The activity ledger is kept for seven years and cannot be deleted inside that window, even by a cascade.' },
      { id: 'FND-12', title: 'Erasure', body: 'A person can be erased, with a stable pseudonym left in their place so the record still reads.' },
      { id: 'FIL-06', title: 'Orphaned objects', body: 'Files left behind by an abandoned upload are found and removed.' },
    ],
  },
  {
    id: 'content', title: 'Content', lead: 'The cut, the contract and the person watching.',
    controls: [
      { id: 'CLI-09', title: 'Session watermarking on screening links', body: 'The viewer’s own identity moves across the frame. It is aimed at screen recording, and it is not forensic watermarking.' },
      { id: 'DOC-09', title: 'Single-use signing links', body: 'A signing link works once. Its token is never stored, only its fingerprint.' },
      { id: 'DOC-05', title: 'Sealed contracts', body: 'A signed contract is sealed with a cryptographic signature, with the certificate of completion inside the file.' },
    ],
  },
]

const NOT_YET = [
  { title: 'No SOC 2 report', body: 'Genreline does not hold a SOC 2 report.' },
  { title: 'No ISO 27001 certification', body: 'Genreline is not ISO 27001 certified.' },
  { title: 'No TPN assessment', body: 'Genreline has no MPA Trusted Partner Network assessment. A TPN Blue Shield self-attestation is the first step on the roadmap.' },
  { title: 'One region', body: 'There is no data residency outside the one US region.' },
  { title: 'No organization-wide audit export', body: 'Approval certificates can be printed; there is no export of the whole activity ledger yet.' },
  { title: 'No forensic watermarking', body: 'Screening links carry a session watermark only.' },
]

export default function Security() {
  return (
    <>
      <PageHero motif="vault"
        title="Security, stated precisely."
        lead="Every control that exists, described as it works — and, at the end, what has not been done yet. A young vendor’s strongest trust signal is the list of its gaps."
        size="md"
        visual={<SecurityVisual />}
      />
      <div className="container-wide grid gap-12 pb-16 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-[13px]">
            {SECTIONS.map((s) => (
              <li key={s.id}><a href={`#${s.id}`} className="text-muted-foreground transition-colors hover:text-foreground">{s.title}</a></li>
            ))}
            <li><a href="#not-yet" className="text-muted-foreground transition-colors hover:text-foreground">What we have not done yet</a></li>
            <li><Link href="/security/disclosure" className="text-muted-foreground transition-colors hover:text-foreground">Report a vulnerability</Link></li>
          </ul>
        </nav>
        <div className="space-y-16">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`} className="font-display text-3xl font-bold text-foreground">{s.title}</h2>
              <p className="mt-2 text-lg text-muted-foreground">{s.lead}</p>
              <dl className="mt-6 divide-y divide-border border-y border-border">
                {s.controls.map((c) => (
                  <Feature key={c.id} id={c.id} as="div" className="grid gap-1 py-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
                    <dt className="font-display text-[17px] font-semibold text-foreground">{c.title}</dt>
                    <dd className="text-[15px] leading-7 text-muted-foreground">{c.body}</dd>
                  </Feature>
                ))}
              </dl>
            </section>
          ))}
          <section id="not-yet" aria-labelledby="not-yet-title">
            <h2 id="not-yet-title" className="font-display text-3xl font-bold text-foreground">What we have not done yet</h2>
            <p className="mt-2 text-lg text-muted-foreground">Each of these has its plan on the <Link href="/roadmap?area=enterprise" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">roadmap</Link>.</p>
            <dl className="mt-6 divide-y divide-border border-y border-border">
              {NOT_YET.map((n) => (
                <div key={n.title} className="grid gap-1 py-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8">
                  <dt className="font-display text-[17px] font-semibold text-foreground">{n.title}</dt>
                  <dd className="text-[15px] leading-7 text-muted-foreground">{n.body}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="disclosure-title" className="squircle border border-border bg-card/40 p-6">
            <h2 id="disclosure-title" className="font-display text-xl font-semibold text-foreground">Found something?</h2>
            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">Tell us privately. <Link href="/security/disclosure" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">How to report a vulnerability</Link></p>
          </section>
        </div>
      </div>
    </>
  )
}
