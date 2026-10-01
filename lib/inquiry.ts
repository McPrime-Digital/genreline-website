/**
 * Which inquiry forms can send. A form is ENABLED only when its inbox, the
 * sending address and the Resend key exist (S-W §13: "Forms disabled on
 * preview" until the owner names the inboxes). Read at BUILD time by the
 * static pages, and again by the route on every request.
 */
export type InquiryKind = 'sales' | 'early-access' | 'security'

export const INBOX_ENV: Record<InquiryKind, string> = {
  sales: 'INQUIRY_TO_SALES',
  'early-access': 'INQUIRY_TO_EARLY_ACCESS',
  security: 'INQUIRY_TO_SECURITY',
}

export function inquiryEnabled(kind: InquiryKind): boolean {
  return Boolean(process.env[INBOX_ENV[kind]] && process.env.RESEND_API_KEY && process.env.INQUIRY_FROM_EMAIL)
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''
