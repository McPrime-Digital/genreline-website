import { Feature } from '@/components/FeatureLabel'
import { CapabilityBlock, Connects, CtaBand, PageHero, Replaces, SecurityNote, Section } from '@/components/site/Frame'
import { pageMeta } from '@/lib/meta'

export const metadata = pageMeta('/product/meetings')

export default function Meetings() {
  return (
    <>
      <PageHero
        title="Meet, review together, keep the notes."
        lead="Audio and video meetings in the place the work lives, a review session that plays the cut in sync for the whole room, and a calendar where the dates that matter arrive by themselves."
        media="client-meetings"
      />
      <Section id="replaces" title="What it replaces">
        <Replaces items={['A video-call link pasted into a chat', 'Screen-sharing a cut', 'A booking page', 'Notes typed up after the call']} />
      </Section>
      <Section id="capabilities" className="pt-0">
        <CapabilityBlock
          title="Meetings where the work is"
          body={<p>Start a call from any room header. A meeting addressed to a client company is joinable by its team at once, and an outside collaborator seated in a room can join that room’s meetings. Background blur and noise suppression run on the device.</p>}
          features={['MTG-01', 'MSG-21', 'MSG-20', 'MTG-10']}
          media="client-meetings"
        />
        <CapabilityBlock
          reverse
          title="A review session, in sync"
          body={<p>The cut plays on a shared playhead that compensates for each person’s latency and closes small drifts by nudging the speed rather than jumping. Drawing pauses the room on the frame being discussed, and the drawing is kept at that timecode after everybody leaves.</p>}
          features={['APR-15', 'APR-13', 'APR-19']}
        />
        <CapabilityBlock
          title="Recording"
          body={<p>Record a session from the meeting itself.</p>}
          features={['MTG-08']}
        />
        <CapabilityBlock
          reverse
          title="A calendar on both sides"
          body={<p>Approval deadlines, invoice due dates and shoot days are projected onto the calendar — and removed when they no longer apply — for the studio and for the client.</p>}
          features={['MTG-02']}
          media="crew-calendar"
        />
        <CapabilityBlock
          title="Booking, where the meeting is the booking"
          body={<p>Set availability with rules and overrides, safe across time zones. A client books from the portal, and the booking is a scheduled meeting on both calendars.</p>}
          features={['MTG-04']}
          media={['portal-meetings', 'client-meetings']}
        />
      </Section>
      <Section id="connects" title="How it connects">
        <Connects
          items={[
            { href: '/product/review', title: 'Review and approval', body: 'The notes from a session sit beside the approval they inform.' },
            { href: '/product/production', title: 'Production', body: 'Shoot days land on the same calendar.' },
            { href: '/product/client', title: 'The client’s portal', body: 'Clients join and book from the portal.' },
          ]}
        />
      </Section>
      <Section id="security" width="measure">
        <SecurityNote>
          <p><Feature id="FND-01">Studio isolation is enforced in the database and proven by 76 automated security checks.</Feature> A meeting admits exactly the people who can read it, and among those checks: a client can never read an internal meeting.</p>
        </SecurityNote>
      </Section>
      <CtaBand />
    </>
  )
}
