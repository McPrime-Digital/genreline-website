import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { RecordDemo } from '@/components/interactive/RecordDemo'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/review')

export default function Review() {
  return (
    <>
      <PageHero
        title="Approval is a record, not a status."
        lead="Stages, review windows and reminders, frame-accurate notes, and a certificate that holds up years later — with silence recorded as silence, never as a sign-off."
        media="client-review-record"
      />
      <Section id="the-record" title="What happens when nobody answers" lead="Step through an approval both ways. The words are the ones the record keeps.">
        <RecordDemo />
      </Section>
      <Section id="replaces" title="What it replaces">
        <Replaces items={['A review tool', 'Approval by email', 'A spreadsheet of who signed off', 'Screenshots of a chat as evidence']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Stages and review windows"
          body={<p>Send a file, a document, a task or a message for approval. Approvers can be a person, a whole client company or a role. Each stage has a review window and a reminder ladder, and the same approval appears in the room, in the review list and on the record.</p>}
          features={['APR-01', 'MSG-19', 'APR-03', 'APR-05']}
        />
        <CapabilityBlock
          reverse
          title="The certificate"
          body={
            <>
              <p>Every approval prints as a certificate: every stage, every decision, every reminder, in order. When a stage advanced on silence, the certificate says so in these words:</p>
              <blockquote className="border-l-2 border-primary pl-4 text-foreground">No response was received by the agreed review date. Work proceeded under the review window in the production agreement. This is not a client approval.</blockquote>
            </>
          }
          features={['APR-02']}
          media="portal-certificate"
        />
        <CapabilityBlock
          title="What the approver actually saw"
          body={<p>A screening link records how far each guest watched — the furthest point reached, not just whether the link was opened — and the studio sees it beside the decision. A note a guest leaves is kept as evidence, with how far they had watched when they wrote it.</p>}
          features={['APR-20', 'APR-18']}
        />
        <CapabilityBlock
          reverse
          title="Frame-accurate review"
          body={<p>Notes anchored to the timecode, drawings on the frame that stay after the call, side-by-side and overlay compare with the second player following the first, and every version stacked on the one before it.</p>}
          features={['APR-14', 'APR-11', 'APR-13', 'APR-12', 'APR-08']}
          media="portal-review"
        />
        <CapabilityBlock
          title="Notes that go straight into the edit"
          body={<p>Export the notes as markers for Resolve, Final Cut and Premiere, or as CSV. The frame rate is declared, never guessed. Editors can work the notes from inside their editor through the published panel bridge.</p>}
          features={['APR-16', 'APR-17']}
        />
        <CapabilityBlock
          reverse
          title="Before anyone gives a colour note"
          body={<p>The asset declares its colour space, the browser reports what the display can show, and the reviewer is warned before giving a colour note on a screen that cannot show the picture.</p>}
          features={['APR-19']}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/meetings', title: 'Review together', body: 'A review session plays the cut in sync for everybody in the room.' },
            { href: '/product/files', title: 'The screening room', body: 'Guest links for people without accounts, with a record of what they watched.' },
            { href: '/product/client', title: 'The client’s portal', body: 'The client reviews and decides in a portal that wears your studio’s brand.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> Among those checks: an internal approval is never readable by a client, and a lapsed stage carries no decision row.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
