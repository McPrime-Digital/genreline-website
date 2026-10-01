'use client'

/**
 * THE RECORD — the wedge (S-W §2.2, §6 section 3), as something a visitor
 * steps through rather than reads. Two paths: nobody responds, or the client
 * responds. Nothing plays on its own (S-B principle 4): every step is a click.
 *
 * THE TENSE IS A CORRECTNESS PROPERTY (the app's portalCalendar rule): before
 * the deadline the sentence is conditional, after it the sentence is past.
 * And the word is "advances", never "approved" (S-W §2.2 corrects the app's
 * own wording here — the app's portal calendar still says "approved";
 * the certificate sentence below IS the product's, word for word, from
 * components/shared/ApprovalCertificate.tsx).
 */
import * as React from 'react'
import { cx as cn } from '@/lib/cx'

type Step = { when: string; title: string; detail: string }

const BEFORE = 'If nobody responds by Thursday 5:00 PM, this advances automatically and the production moves on.'
const WINDOW_PASSED = 'The deadline has passed. Unless somebody responds now, this advances automatically the next time the record is swept — and it goes down as an automatic advance, not as a sign-off.'
const ADVANCED = 'Nobody responded in time, so this advanced automatically. It is on the record as an automatic advance, not as a sign-off.'
const CERTIFICATE = 'No response was received by the agreed review date. Work proceeded under the review window in the production agreement. This is not a client approval.'

const SILENCE: (Step & { sentence: string })[] = [
  { when: 'Mon 10:00 AM', title: 'Sent for approval', detail: 'Rough cut v3 goes to the client with the review window in the production agreement: Thursday, 5:00 PM.', sentence: BEFORE },
  { when: 'Tue 9:00 AM', title: 'Reminded', detail: 'The approvers who have not responded are reminded. The reminder is on the record.', sentence: BEFORE },
  { when: 'Thu 9:00 AM', title: 'Reminded again', detail: 'The ladder climbs as the deadline gets close. Still on the record.', sentence: BEFORE },
  { when: 'Thu 5:00 PM', title: 'The window closes', detail: 'Nobody has responded. Nothing is written as an approval.', sentence: WINDOW_PASSED },
  { when: 'Next morning', title: 'Advanced automatically', detail: 'The daily sweep advances the stage and names it for what it is: an automatic advance.', sentence: ADVANCED },
]

const RESPONDS: (Step & { sentence: string })[] = [
  { when: 'Mon 10:00 AM', title: 'Sent for approval', detail: 'Rough cut v3 goes to the client with the review window in the production agreement: Thursday, 5:00 PM.', sentence: BEFORE },
  { when: 'Tue 2:40 PM', title: 'Notes on the frame', detail: 'The client leaves two notes, each anchored to its timecode, in the same room as the conversation.', sentence: BEFORE },
  { when: 'Wed 11:15 AM', title: 'Signed off', detail: 'The named approver signs off. The record keeps who, when, and the notes that came with it.', sentence: 'Signed off on Wednesday at 11:15 AM by the named approver. The production moves on.' },
]

export function RecordDemo() {
  const [path, setPath] = React.useState<'silence' | 'responds'>('silence')
  const steps = path === 'silence' ? SILENCE : RESPONDS
  const [step, setStep] = React.useState(0)
  const current = steps[Math.min(step, steps.length - 1)]
  const done = step >= steps.length - 1
  const lapsed = path === 'silence' && step >= 3

  const choose = (p: 'silence' | 'responds') => {
    setPath(p)
    setStep(0)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
      <div>
        <fieldset className="inline-flex rounded-lg border border-border bg-card/40 p-0.5">
          <legend className="sr-only">What happens next</legend>
          {([
            ['silence', 'Nobody responds'],
            ['responds', 'The client responds'],
          ] as const).map(([value, label]) => (
            <label
              key={value}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center rounded-md px-3.5 text-[13px] font-medium transition-colors duration-[--dur-pop]',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                path === value ? 'bg-background text-foreground shadow-[0_1px_2px_hsl(var(--foreground)/0.08)]' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <input type="radio" name="record-path" value={value} checked={path === value} onChange={() => choose(value)} className="sr-only" />
              {label}
            </label>
          ))}
        </fieldset>

        <ol className="mt-6 space-y-1" aria-label="The approval, step by step">
          {steps.map((s, i) => {
            const state = i < step ? 'past' : i === step ? 'current' : 'future'
            return (
              <li key={`${path}-${i}`}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={cn(
                    'group grid w-full grid-cols-[18px_1fr] gap-3 rounded-xl px-3 py-3 text-left outline-none transition-colors duration-[--dur-pop]',
                    'hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring',
                    state === 'current' && 'bg-secondary/60',
                  )}
                >
                  <span aria-hidden className="relative mt-1.5 flex justify-center">
                    <span className={cn('size-2.5 rounded-full border-2 transition-colors duration-[--dur-pop]', state === 'future' ? 'border-border bg-transparent' : i === steps.length - 1 && path === 'silence' && state === 'current' ? 'border-status-violet bg-status-violet' : 'border-primary bg-primary')} />
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block text-[12px] tabular-nums', state === 'future' ? 'text-muted-foreground' : 'text-muted-foreground')}>{s.when}</span>
                    <span className={cn('block text-[15px] font-semibold', state === 'future' ? 'text-muted-foreground' : 'text-foreground')}>{s.title}</span>
                    {state === 'current' && <span className="swap-enter mt-1 block text-[14px] leading-6 text-muted-foreground">{s.detail}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-4 flex items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-foreground outline-none transition-[background-color,transform] duration-[--dur-press] hover:bg-secondary/60 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:opacity-40"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => (done ? 0 : s + 1))}
            className="inline-flex h-9 items-center rounded-lg bg-secondary px-3.5 text-[13px] font-medium text-secondary-foreground outline-none transition-[background-color,transform] duration-[--dur-press] hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
          >
            {done ? 'Start again' : 'Next step'}
          </button>
          <span className="ml-auto text-[12px] tabular-nums text-muted-foreground">{Math.min(step, steps.length - 1) + 1} of {steps.length}</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* The calendar card, set the way the client's calendar sets it. */}
        <div className="squircle-lg border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <span className={cn('rounded-md border px-2 py-1 text-xs font-semibold tabular-nums text-foreground', lapsed ? 'border-status-violet/50 bg-status-violet/10' : 'border-primary/50 bg-primary/10')}>Thu 5:00 PM</span>
            <span className="text-[13px] text-muted-foreground">Rough cut v3 · {path === 'responds' && done ? 'signed off' : lapsed ? 'review window closed' : 'awaiting the client'}</span>
          </div>
          <p key={current.sentence} aria-live="polite" className="swap-enter mt-4 max-w-[42ch] font-display text-[22px] font-semibold leading-snug text-foreground sm:text-[24px]">
            {current.sentence}
          </p>
        </div>

        {/* The certificate — appears when the record has something to certify. */}
        {done && (
          <figure className="swap-enter squircle-lg border border-border bg-background p-6 sm:p-8">
            <figcaption className="text-[12px] font-semibold text-muted-foreground">{path === 'silence' ? 'On the certificate, word for word' : 'On the record'}</figcaption>
            <blockquote className="mt-3 border-l-2 border-primary pl-4 text-[16px] leading-7 text-foreground">
              {path === 'silence' ? CERTIFICATE : 'Signed off by the named approver, with the time and the notes that came with it.'}
            </blockquote>
          </figure>
        )}
      </div>
    </div>
  )
}
