/** @type {import('postcss-load-config').Config} */
// postcss-import inlines styles/tokens.css BEFORE Tailwind runs, so the
// @layer/@apply blocks in the copied token file are processed as one sheet.
const config = { plugins: { 'postcss-import': {}, tailwindcss: {} } }
export default config
