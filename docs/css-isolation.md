# Tailwind and Form.io styles

React UI uses standard Tailwind classes (`flex`, `md:p-10`, `hover:bg-sage`) without a prefix. Theme variables use `--color-*`. App typography lives in `src/styles/typography.css` rather than depending on Bootstrap resets.

`src/main.tsx` imports the virtual vendor stylesheet produced by `tooling/scoped-vendor.ts`. The Vite plugin reads the installed Bootstrap and Form.io CSS, parses selector lists and adds `:where(.formio-surface)` to each selector. Root/body rules target that wrapper; media queries and keyframes remain intact. Obsolete charset directives are removed before combining the styles. Generated vendor CSS is placed in the declared `vendor` layer, between Tailwind base and app components/utilities.

Only the actual Form.io renderer uses `.formio-surface`. The structured React renderer stays outside it. Keep future vendor-generated DOM inside that surface; components portalled outside it need an explicitly scoped host. Both Vite development and production builds use the same plugin, without committing generated vendor CSS.

`tests/scoped-vendor.test.ts` checks all installed vendor selectors and special CSS constructs. `e2e/css-isolation.spec.ts` compares real computed styles inside/outside the scope and checks legacy forms on desktop/mobile. The full E2E suite covers the structured renderer and form previews inside admin modals.

References: [Tailwind utilities](https://tailwindcss.com/docs/styling-with-utility-classes), [PostCSS selector parser](https://github.com/postcss/postcss-selector-parser).
