import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'reports/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // S-W §2.2: the website says "advances automatically", never "approved
      // automatically". The rendered-HTML claims check catches copy; this
      // catches the literal at the source before a build runs.
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/approved automatically/i], TemplateElement[value.raw=/approved automatically/i], JSXText[value=/approved automatically/i]",
          message: 'S-W §2.2: say "advances automatically", never "approved automatically".',
        },
      ],
    },
  },
  // The rule's own message, the claims register and the checks name the phrase they forbid.
  { files: ['eslint.config.mjs', 'content/claims.ts', 'scripts/**'], rules: { 'no-restricted-syntax': 'off' } },
]

export default config
