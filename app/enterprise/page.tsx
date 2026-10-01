import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CapabilityBlock, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/enterprise')

export default function Enterprise() {
  return (
    <>
      <PageHero
        title="Built for the security review."
        lead="Identity your IT team already runs, permissions that say exactly who sees what, isolation enforced in the database, and a security page that states the gaps as plainly as the controls."
        media="crew-sso"
      >
        <Button asChild variant="primary" size="lg" data-primary-cta><Link href="/contact?topic=enterprise">Talk to us</Link></Button>
      </PageHero>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Identity"
          body={<p>Single sign-on with SAML or OIDC: the domain is proved by a DNS record first, then the provider is connected, and enforcement refuses a password to anybody on the domain. People the provider vouches for are provisioned just in time; SCIM 2.0 creates, updates and removes them — and removal signs them out everywhere at once.</p>}
          features={['IDN-14', 'IDN-18']}
          media="crew-sso"
        />
        <CapabilityBlock
          reverse
          title="Your rules"
          body={<p>Require two-factor for the whole studio, and set how long a session may last and how long it may sit idle. Sensitive actions ask for the second factor again.</p>}
          features={['IDN-17', 'IDN-15', 'IDN-16']}
          media="crew-security"
        />
        <CapabilityBlock
          title="Permissions and the ledger"
          body={<p>Company roles, project roles, staff and contractor seats, and individual grants and denials with expiry, resolved from the roster on every request — never from a token. Delegation limits are database rules. Every change is written to the permission ledger.</p>}
          features={['IDN-01', 'IDN-02', 'IDN-03', 'IDN-04', 'IDN-05', 'IDN-06']}
        />
        <CapabilityBlock
          reverse
          title="Several organizations, one person"
          body={<p>A person can belong to more than one studio and switch between them; each studio sees only its own.</p>}
          features={['IDN-19']}
        />
        <CapabilityBlock
          title="Isolation, retention and erasure"
          body={<p>Studio isolation is enforced in the database and proven by 76 automated security checks. Deleted rows wait out a grace window before they are purged; the activity ledger is kept for seven years; a person can be erased with a stable pseudonym left in their place. Everything is hosted in one US region.</p>}
          features={['FND-01', 'FND-13', 'FND-12', 'FND-04']}
        />
      </Section>
      <Section id="procurement" title="For procurement" width="measure">
        <p className="text-lg leading-relaxed text-muted-foreground">
          Genreline holds no certification yet, and says so: the <Link href="/security#not-yet" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">security page</Link> lists what has not been done, and the <Link href="/roadmap?area=enterprise" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">roadmap</Link> carries the plan for each. Talk to us about your questionnaire, your identity provider and what your content-security team needs to see.
        </p>
        <div className="mt-8">
          <Button asChild variant="primary" size="lg" data-primary-cta><Link href="/contact?topic=enterprise">Talk to us</Link></Button>
        </div>
      </Section>
    </>
  )
}
