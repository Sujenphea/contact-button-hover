# Contact Button Hover

An animated "Contact" button built with [Astro](https://astro.build) and
[Tailwind CSS](https://tailwindcss.com). On hover (or keyboard focus) a small
circle morphs into a full panel that reveals masked text, driven by GSAP's
`MorphSVGPlugin`. Supports multiple independent instances and is keyboard- and
screen-reader-accessible.

## Tech stack

- **Astro 5** — component framework and static build
- **Tailwind CSS 4** — styling (via `@tailwindcss/vite`)
- **GSAP 3** — `MorphSVGPlugin` for the SVG path morph
- **Lenis** — smooth scrolling
- **TypeScript**, **ESLint**, **Prettier**
- **Vitest** (unit) and **Playwright** (e2e + accessibility)

## Getting started

```sh
npm install
npm run dev
```

The dev server runs at `http://localhost:4321`.

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the local dev server           |
| `npm run build`        | Build the production site to `dist/` |
| `npm run preview`      | Preview the production build         |
| `npm test`             | Run unit tests (Vitest)              |
| `npm run test:watch`   | Run unit tests in watch mode         |
| `npm run test:e2e`     | Run end-to-end tests (Playwright)    |
| `npm run test:e2e:ui`  | Run e2e tests with the Playwright UI |

## Usage

Drop the component into any Astro page and optionally override the label:

```astro
---
import HoverButton from "../components/HoverButton/HoverButton.astro"
---

<HoverButton label="Contact" />
```

The accompanying logic lives in
[`src/components/HoverButton/HoverButton.ts`](src/components/HoverButton/HoverButton.ts),
which discovers every `.js-hover-button` root on the page and wires up its own
hover, focus, and morph animations.

## License

[MIT](LICENSE)
