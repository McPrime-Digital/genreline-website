import Link from 'next/link'
import { PageHero, Section } from '@/components/site/Frame'
import { APP } from '@/lib/site'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/contact')

export default function Contact() {
  return (
    <>
      <PageHero title="Contact" lead="Sales, support and press. A person reads every message." size="md" />
      <Section width="measure" className="pt-0">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Already running a studio?</h2>
            <p className="mt-1 text-[15px] leading-7 text-muted-foreground"><a href={APP.login} className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Sign in</a>, or write below with the name of your studio.</p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">A security problem?</h2>
            <p className="mt-1 text-[15px] leading-7 text-muted-foreground">Report it privately on the <Link href="/security/disclosure" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">disclosure page</Link>.</p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">The network?</h2>
            <p className="mt-1 text-[15px] leading-7 text-muted-foreground"><Link href="/network#early-access" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">Join early access</Link>.</p>
          </div>
        </div>
        <div id="write" className="mt-14" />
      </Section>
    </>
  )
}
