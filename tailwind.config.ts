import type { Config } from 'tailwindcss'

/**
 * Copied from the app's tailwind.config.ts (S-W W-4), 2026-10-01: the nine
 * named type steps, the semantic colour map and the radius tokens. The dead
 * `mcprime-*` / `brand-*` aliases were not copied — they are aliases with no
 * usages there and would be invented usages here.
 *
 * WEBSITE-ONLY: two display steps above the app's scale (`display`,
 * `display-lg`). A hero headline at 36px is a heading, not a hero, and the
 * landing page the site inherits already set 40/56. Nothing else is added.
 */
const config: Config = {
  // Matte is a dark mode: every `dark:` utility applies under it too.
  darkMode: ['variant', '&:is(.dark *, .matte *)'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '20px' }],
        base: ['14px', { lineHeight: '22px' }],
        lg: ['16px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
        '2xl': ['24px', { lineHeight: '30px', letterSpacing: '-0.015em' }],
        '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
        '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
        display: ['40px', { lineHeight: '44px', letterSpacing: '-0.02em' }],
        'display-lg': ['56px', { lineHeight: '60px', letterSpacing: '-0.025em' }],
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        faint: 'hsl(var(--text-faint) / <alpha-value>)',
        glow: 'hsl(var(--glow) / <alpha-value>)',
        primary: { DEFAULT: 'hsl(var(--primary) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
        secondary: { DEFAULT: 'hsl(var(--secondary) / <alpha-value>)', foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)' },
        destructive: { DEFAULT: 'hsl(var(--destructive) / <alpha-value>)', foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)' },
        muted: { DEFAULT: 'hsl(var(--muted) / <alpha-value>)', foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
        accent: { DEFAULT: 'hsl(var(--accent) / <alpha-value>)', foreground: 'hsl(var(--accent-foreground) / <alpha-value>)' },
        popover: { DEFAULT: 'hsl(var(--popover) / <alpha-value>)', foreground: 'hsl(var(--popover-foreground) / <alpha-value>)' },
        card: { DEFAULT: 'hsl(var(--card) / <alpha-value>)', foreground: 'hsl(var(--card-foreground) / <alpha-value>)' },
        status: {
          blue: 'hsl(var(--status-blue) / <alpha-value>)',
          amber: 'hsl(var(--status-amber) / <alpha-value>)',
          violet: 'hsl(var(--status-violet) / <alpha-value>)',
          green: 'hsl(var(--status-green) / <alpha-value>)',
          gray: 'hsl(var(--status-gray) / <alpha-value>)',
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      maxWidth: { measure: '880px', wide: '1200px' },
    },
  },
  plugins: [],
}

export default config
