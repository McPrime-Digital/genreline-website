import Link from 'next/link'
import { CapabilityBlock, CtaBand, PageHero, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/solutions/in-house')

export default function InHouse() {
  return (
    <>
      <PageHero
        title="For in-house teams."
        lead="When the client is the company you work for, the work still needs a schedule, a record and somebody who signed off. Crew and the Suite carry it."
        media="solutions-in-house"
      />
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="The team and the production"
          body={<p>A directory with department, skills and availability; tasks with assignees, labels and subtasks; internal rooms; and permissions down to the project.</p>}
          features={['CRW-02', 'CRW-04', 'MSG-02', 'IDN-02']}
          media="crew-tasks"
        />
        <CapabilityBlock
          reverse
          title="Sign-off inside the company"
          body={<p>Internal approvals with stages, review windows and a certificate — the same engine a studio uses with outside clients.</p>}
          features={['CRW-05', 'APR-02']}
        />
        <CapabilityBlock
          title="Writing and the library"
          body={<p>A screenplay editor with live co-editing, storyboards, and every asset the team holds in one library.</p>}
          features={['SWR-01', 'SWR-06', 'FIL-07']}
          media="suite-library"
        />
        <CapabilityBlock
          reverse
          title="Identity your IT team already runs"
          body={<p>Single sign-on with SAML or OIDC, SCIM provisioning, required two-factor and session limits.</p>}
          features={['IDN-14', 'IDN-18', 'IDN-17']}
          media="crew-sso"
        />
      </Section>
      <Section id="configuration" width="measure">
        <div className="squircle border border-border bg-card/40 p-6">
          <p className="text-[15px] leading-7 text-muted-foreground">
            Every studio sees all three spaces today, including the Client space. A configuration in which an internal team never sees the Client space is on the <Link href="/roadmap?area=enterprise" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-primary">roadmap</Link>.
          </p>
        </div>
      </Section>
      <CtaBand />
    </>
  )
}
