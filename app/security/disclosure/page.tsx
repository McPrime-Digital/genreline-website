import { PageHero, Section } from '@/components/site/Frame'
import { InquiryForm } from '@/components/interactive/InquiryForm'
import { inquiryEnabled, TURNSTILE_SITE_KEY } from '@/lib/inquiry'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/security/disclosure')

export default function Disclosure() {
  return (
    <>
      <PageHero
        title="Report a vulnerability."
        lead="If you have found a security problem in Genreline, tell us privately first. We read every report."
        size="md"
      />
      <Section width="measure" className="pt-0">
        <div className="space-y-10 text-[15px] leading-7 text-muted-foreground">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">In scope</h2>
            <p className="mt-2">This website at genreline.com, and the product at app.genreline.com.</p>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">What to include</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>What you found, and where.</li>
              <li>The steps that reproduce it.</li>
              <li>What an attacker could do with it.</li>
              <li>How we can reach you.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">What we ask</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Use only your own accounts and studios. Do not read, change or delete anybody else’s data.</li>
              <li>Do not degrade the service for others — no denial-of-service testing, no high-volume scanning.</li>
              <li>Give us a reasonable time to fix the problem before you talk about it publicly.</li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">What we do</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Acknowledge your report.</li>
              <li>Keep you told about what we find and when it is fixed.</li>
              <li>Credit you, if you would like to be credited.</li>
            </ul>
          </div>
          <div id="report">
            <h2 className="font-display text-xl font-semibold text-foreground">Send a report</h2>
            <div className="mt-4">
              <InquiryForm kind="security" enabled={inquiryEnabled('security')} siteKey={TURNSTILE_SITE_KEY} submitLabel="Send report" messageLabel="What you found" messageHint="Where it is, the steps that reproduce it, and what an attacker could do with it." />
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
