# GOAT Calculator

Free financial calculators that run entirely in the browser. No login, no
bank connection, no database, no AI API for calculations.

## Requirements

- Node.js 20.9+ (Next.js 16's minimum supported version)
- npm

## Setup

```bash
npm install
```

No environment variables are required to run locally. If you want to set
one anyway, copy `.env.example` to `.env.local` first — see that file for
what `NEXT_PUBLIC_SITE_URL` does.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tests

Financial logic (Vitest):

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

Type checking:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
```

Browser tests (Playwright) — these run against the **static export**, so
build it first:

```bash
npm run build
npm run test:e2e
```

(`test:e2e` also builds automatically the first time via Playwright's
`webServer` config if `out/` doesn't exist yet, but running `npm run build`
explicitly first makes sure you're testing the latest code.)

## Production build (static export)

```bash
npm run build
```

This produces a static export in `out/`, per `output: "export"` in
`next.config.ts`. Preview it locally with any static file server, e.g.:

```bash
npx serve out
```

## Project structure

- `src/lib/finance/` — pure, framework-free financial calculation code
  (decimal arithmetic, validation, formatting). Covered by Vitest.
- `src/components/` — React components, including the compound-interest
  calculator's client-side UI.
- `src/app/` — Next.js App Router routes.
- `e2e/` — Playwright browser tests, run against the static export.
- `docs/PROJECT_STATE.md` — current implementation status and phase notes.

## Deployment

Intended for a Render Static Site, serving the `out/` directory produced by
`npm run build`. Not deployed as part of this phase. No domain is assumed —
see `.env.example`.
