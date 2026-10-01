/**
 * The site's own constants — the one place a hostname or the product name is
 * written (the app's lib/product.ts and lib/appOrigin.ts make the same
 * argument: a name that has changed once is written once).
 */
export const PRODUCT_NAME = 'Genreline'
export const SITE_ORIGIN = 'https://genreline.com'
export const APP_ORIGIN = 'https://app.genreline.com'

/** Links across to the app (S-W §4: sign in, open a studio, terms, privacy). */
export const APP = {
  login: `${APP_ORIGIN}/login`,
  signup: `${APP_ORIGIN}/signup`,
  terms: `${APP_ORIGIN}/legal/terms`,
  privacy: `${APP_ORIGIN}/legal/privacy`,
} as const

export const TAGLINE = 'Run the production. Keep the record.'
export const SUBLINE =
  'Genreline is the operating system for a film or media studio: the productions, the crew, the clients, the cuts, the approvals, the contracts and the money — in one place, with a record that holds up after the wrap.'
export const DESCRIPTION =
  'The operating system for film and media studios — approvals that are records, a client portal that wears your studio’s name, releases that write the rights they prove.'

/** FND-04: one US region. S-W §5.2's region statement. */
export const REGION_STATEMENT = 'Hosted in the United States'

/**
 * The legal entity (S0-B §7, S-W §13). NULL until the owner names it — and
 * while it is null there is no copyright line anywhere on the site.
 */
export const LEGAL_ENTITY: string | null = null

/** S-W §13 owner input. Null: the About page carries no "who" section. */
export const FOUNDER: { name: string; role: string; bio: string } | null = null
