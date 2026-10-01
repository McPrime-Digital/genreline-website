/**
 * THE ONE SERVER ROUTE (S-W W-7, §9.3). Validates, checks Turnstile, sends one
 * email through Resend to the inbox for that kind — and STORES NOTHING: no
 * database, no lead table, no third-party form service.
 *
 * ONE NEUTRAL ANSWER FOR EVERY FAILURE. Bad input, a failed challenge, a rate
 * limit, a missing inbox, a refused send: all return the same sentence, so the
 * route teaches a script nothing about why it was refused.
 *
 * RATE LIMITING IS PER INSTANCE, AND THAT IS STATED. A store would be a thing
 * this route keeps, and W-7 says it keeps nothing; the app's own lesson is
 * that a process-memory counter is per instance. So this is a speed bump —
 * three per address and ten per IP in ten minutes, per warm instance — and
 * Turnstile is the gate. The owner step for a hard limit is a Vercel Firewall
 * rate-limit rule on /api/inquiry (recorded in the report).
 */
import { z } from 'zod'
import { INBOX_ENV, type InquiryKind } from '@/lib/inquiry'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NEUTRAL = { ok: false, message: 'That didn’t go through. Wait a minute and try again.' }
const refuse = (status = 400) => Response.json(NEUTRAL, { status })

const Body = z.object({
  kind: z.enum(['sales', 'early-access', 'security']),
  name: z.string().trim().min(1).max(120),
  email: z.email().trim().max(254),
  company: z.string().trim().max(160).optional(),
  role: z.enum(['filmmaker', 'studio', 'actor', 'other']).optional(),
  topic: z.enum(['sales', 'support', 'press', 'enterprise']).optional(),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional(), // honeypot — a person never fills it
  token: z.string().max(2048).optional(),
})

const hits = new Map<string, number[]>()
function limited(key: string, max: number, windowMs = 10 * 60_000): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) hits.clear() // bounded memory, by design
  return recent.length > max
}

function clientIp(req: Request): string {
  // Vercel overwrites these and forwards no client-supplied value (the app's
  // lib/rateLimit.ts reads them in the same order, for the same reason).
  return req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
}

async function turnstileOk(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return process.env.VERCEL_ENV !== 'production' // required in production
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip !== 'unknown') body.set('remoteip', ip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(5000) })
    const json = (await res.json()) as { success?: boolean }
    return json.success === true
  } catch {
    return false
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
const LABEL: Record<InquiryKind, string> = { sales: 'Contact', 'early-access': 'Early access', security: 'Security report' }

export async function POST(req: Request) {
  // Same-origin only: a form that sends email must not be a relay for other sites.
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origin || !host || new URL(origin).host !== host) return refuse(403)
  if (Number(req.headers.get('content-length') ?? 0) > 20_000) return refuse(413)

  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return refuse()
  const d = parsed.data
  if (d.website) return Response.json({ ok: true }) // the honeypot: accept and drop

  const ip = clientIp(req)
  if (limited(`ip:${ip}`, 10) || limited(`email:${d.email.toLowerCase()}`, 3)) return refuse(429)
  if (!(await turnstileOk(d.token, ip))) return refuse(403)

  const to = process.env[INBOX_ENV[d.kind]]
  const from = process.env.INQUIRY_FROM_EMAIL
  const key = process.env.RESEND_API_KEY
  if (!to || !from || !key) return refuse(503)

  const lines: [string, string | undefined][] = [
    ['Kind', LABEL[d.kind]], ['Topic', d.topic], ['Name', d.name], ['Email', d.email],
    ['Company', d.company], ['Role', d.role], ['Message', d.message],
  ]
  const present = lines.filter(([, v]) => v) as [string, string][]
  const text = present.map(([k, v]) => `${k}: ${v}`).join('\n\n')
  const html = `<table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px">${present
    .map(([k, v]) => `<tr><td style="color:#525C66;vertical-align:top">${esc(k)}</td><td style="white-space:pre-wrap">${esc(v)}</td></tr>`)
    .join('')}</table>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to,
        reply_to: d.email,
        subject: `[${LABEL[d.kind]}${d.topic ? ` · ${d.topic}` : ''}] ${d.name}${d.company ? ` — ${d.company}` : ''}`.slice(0, 200),
        text,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[inquiry] Resend refused', res.status, await res.text().catch(() => ''))
      return refuse(502)
    }
  } catch (err) {
    console.error('[inquiry] send failed', err)
    return refuse(502)
  }
  return Response.json({ ok: true })
}
