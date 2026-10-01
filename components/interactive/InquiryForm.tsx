'use client'

/**
 * The one form (S-W W-7). One column, labels above, validation on blur with
 * errors that name the fix, focus moved to the first error on submit, 44px
 * targets (sumi form-design). Turnstile's script loads on the FIRST
 * INTERACTION with the form, so a page view carries no third-party script.
 */
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cx as cn } from '@/lib/cx'
import type { InquiryKind } from '@/lib/inquiry'

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void }
  }
}

type Field = 'name' | 'email' | 'company' | 'message' | 'role' | 'topic'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sub = (cb: () => void) => { window.addEventListener('popstate', cb); return () => window.removeEventListener('popstate', cb) }

const field = 'block w-full rounded-lg border border-input bg-background px-3 text-[15px] text-foreground outline-none transition-[border-color,box-shadow] duration-[--dur-press] placeholder:text-faint focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 aria-[invalid=true]:border-destructive disabled:cursor-not-allowed disabled:opacity-60'

export function InquiryForm({
  kind,
  enabled,
  siteKey,
  submitLabel,
  messageLabel = 'Message',
  messageHint,
  defaultTopic = 'sales',
}: {
  kind: InquiryKind
  enabled: boolean
  siteKey: string
  submitLabel: string
  messageLabel?: string
  messageHint?: string
  defaultTopic?: 'sales' | 'support' | 'press' | 'enterprise'
}) {
  const search = React.useSyncExternalStore(sub, () => window.location.search, () => '')
  const urlTopic = new URLSearchParams(search).get('topic')
  const [values, setValues] = React.useState<Record<Field, string>>({ name: '', email: '', company: '', message: '', role: '', topic: '' })
  const topic = values.topic || (urlTopic && ['sales', 'support', 'press', 'enterprise'].includes(urlTopic) ? urlTopic : defaultTopic)
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({})
  const [state, setState] = React.useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [token, setToken] = React.useState<string | null>(null)
  const widget = React.useRef<HTMLDivElement>(null)
  const loaded = React.useRef(false)
  const formRef = React.useRef<HTMLFormElement>(null)

  const validate = (f: Field, v: string): string | undefined => {
    if (f === 'name' && !v.trim()) return 'Enter your name.'
    if (f === 'email' && !EMAIL.test(v.trim())) return 'Enter an email address, like you@studio.com.'
    if (f === 'message' && v.trim().length < 10) return 'Tell us a little more — at least a sentence.'
    if (f === 'role' && kind === 'early-access' && !v) return 'Choose what describes you best.'
    return undefined
  }

  const loadTurnstile = () => {
    if (loaded.current || !siteKey) return
    loaded.current = true
    const render = () => {
      if (widget.current && window.turnstile) {
        window.turnstile.render(widget.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          theme: 'auto',
          callback: (t: string) => setToken(t),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
        })
      }
    }
    if (window.turnstile) return render()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = render
    document.head.appendChild(s)
  }

  const set = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [f]: e.target.value }))
    if (errors[f]) setErrors((x) => ({ ...x, [f]: validate(f, e.target.value) }))
  }
  const blur = (f: Field) => () => setErrors((x) => ({ ...x, [f]: validate(f, values[f]) }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fields: Field[] = kind === 'early-access' ? ['name', 'email', 'role', 'message'] : ['name', 'email', 'message']
    const next: Partial<Record<Field, string>> = {}
    for (const f of fields) next[f] = validate(f, values[f])
    setErrors(next)
    const first = fields.find((f) => next[f])
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setState('sending')
    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: values.name,
          email: values.email,
          company: values.company || undefined,
          role: kind === 'early-access' ? values.role || undefined : undefined,
          topic: kind === 'sales' ? topic : undefined,
          message: values.message,
          website: (formRef.current?.elements.namedItem('website') as HTMLInputElement | null)?.value || undefined,
          token: token ?? undefined,
        }),
      })
      setState(res.ok ? 'sent' : 'failed')
      if (!res.ok) window.turnstile?.reset()
    } catch {
      setState('failed')
    }
  }

  if (state === 'sent') {
    return (
      <div role="status" className="swap-enter squircle-lg border border-border bg-card/50 p-6 sm:p-8">
        <p className="font-display text-xl font-semibold text-foreground">Thank you, {values.name.split(' ')[0]}.</p>
        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">It reached us. A person will reply to {values.email} from a genreline.com address.</p>
      </div>
    )
  }

  const err = (f: Field) => errors[f] && <p id={`${kind}-${f}-error`} className="mt-1.5 text-[13px] text-destructive">{errors[f]}</p>
  const desc = (f: Field) => (errors[f] ? `${kind}-${f}-error` : undefined)

  return (
    <form ref={formRef} onSubmit={submit} onFocusCapture={loadTurnstile} noValidate className="max-w-xl">
      {!enabled && (
        <p className="mb-6 rounded-lg border border-dashed border-border px-4 py-3 text-[14px] text-muted-foreground">
          This form is not taking messages yet.
        </p>
      )}
      <fieldset disabled={!enabled || state === 'sending'} className="space-y-5">
        {kind === 'sales' && (
          <div>
            <label htmlFor={`${kind}-topic`} className="text-[14px] font-medium text-foreground">What is it about?</label>
            <select id={`${kind}-topic`} name="topic" value={topic} onChange={set('topic')} className={cn(field, 'mt-2 h-11')}>
              <option value="sales">Sales</option>
              <option value="enterprise">Enterprise</option>
              <option value="support">Support for my studio</option>
              <option value="press">Press</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor={`${kind}-name`} className="text-[14px] font-medium text-foreground">Name</label>
          <input id={`${kind}-name`} name="name" autoComplete="name" value={values.name} onChange={set('name')} onBlur={blur('name')} aria-invalid={!!errors.name} aria-describedby={desc('name')} className={cn(field, 'mt-2 h-11')} />
          {err('name')}
        </div>
        <div>
          <label htmlFor={`${kind}-email`} className="text-[14px] font-medium text-foreground">Work email</label>
          <input id={`${kind}-email`} name="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} value={values.email} onChange={set('email')} onBlur={blur('email')} aria-invalid={!!errors.email} aria-describedby={desc('email')} className={cn(field, 'mt-2 h-11')} />
          {err('email')}
        </div>
        <div>
          <label htmlFor={`${kind}-company`} className="text-[14px] font-medium text-foreground">Company <span className="font-normal text-muted-foreground">(optional)</span></label>
          <input id={`${kind}-company`} name="company" autoComplete="organization" value={values.company} onChange={set('company')} className={cn(field, 'mt-2 h-11')} />
        </div>
        {kind === 'early-access' && (
          <fieldset aria-describedby={desc('role')}>
            <legend className="text-[14px] font-medium text-foreground">Which describes you best?</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[['filmmaker', 'Filmmaker'], ['studio', 'Studio'], ['actor', 'Actor'], ['other', 'Something else']].map(([v, l]) => (
                <label key={v} className={cn('flex h-11 cursor-pointer items-center justify-center rounded-lg border text-[14px] font-medium transition-colors duration-[--dur-pop] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring', values.role === v ? 'border-primary bg-primary/10 text-foreground' : 'border-input text-muted-foreground hover:text-foreground')}>
                  <input type="radio" name="role" value={v} checked={values.role === v} onChange={(e) => { set('role')(e); setErrors((x) => ({ ...x, role: undefined })) }} className="sr-only" />
                  {l}
                </label>
              ))}
            </div>
            {err('role')}
          </fieldset>
        )}
        <div>
          <label htmlFor={`${kind}-message`} className="text-[14px] font-medium text-foreground">{messageLabel}</label>
          {messageHint && <p id={`${kind}-message-hint`} className="mt-1 text-[13px] text-muted-foreground">{messageHint}</p>}
          <textarea id={`${kind}-message`} name="message" rows={6} value={values.message} onChange={set('message')} onBlur={blur('message')} aria-invalid={!!errors.message} aria-describedby={[desc('message'), messageHint ? `${kind}-message-hint` : ''].filter(Boolean).join(' ') || undefined} className={cn(field, 'mt-2 min-h-[8rem] resize-y py-2.5 leading-relaxed')} />
          {err('message')}
        </div>
        {/* The honeypot: hidden from people and from assistive technology. */}
        <div aria-hidden className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
          <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div ref={widget} />
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Button type="submit" variant="secondary" size="lg" aria-busy={state === 'sending'}>{state === 'sending' ? 'Sending…' : submitLabel}</Button>
          {state === 'failed' && <p role="alert" className="text-[14px] text-destructive">That didn’t go through. Wait a minute and try again.</p>}
        </div>
      </fieldset>
    </form>
  )
}
