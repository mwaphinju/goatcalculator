# GOAT Calculator — Project State

## Current phase

**Phase 6: Render production deployment and live verification**

Status: `AWAITING_REVIEW` — blocked on owner action (see below)

Phases 1 through 5 (all seven calculators, the input default/required-field
policy, and search readiness: metadata, robots.txt, sitemap.xml, structured
data, and the five guide pages) are approved. See "Earlier phases" below
for a condensed history. This phase adds no calculator, guide, account,
analytics, advertising, affiliate link, payment, calendar reminder,
database, API, or financial logic. It adds deployment configuration only:
`render.yaml` (a Render Blueprint for a **Static Site**, not a Web
Service — no Node server, no `next start`, no Docker), and safe static
security headers.

**This assistant has no Render account access, no Git-provider
authorization to connect a repository, and no billing/account
confirmation ability.** The repository is fully prepared and every
pre-deployment check passes (see below), but the actual live deployment
requires the site owner to complete the manual Render dashboard steps
listed in "Owner action required" below. Once the owner reports back the
real live URL, live verification (routes, canonical/OG/robots/sitemap/
JSON-LD against the real URL, screenshots with the address bar visible,
and the Search Console handoff) can proceed in a follow-up turn of this
same phase.

## Owner action required

1. Open the Render dashboard and click **New** → **Static Site** (or
   **New** → **Blueprint** to use the committed `render.yaml` directly).
2. Connect the repository containing the current `main` branch
   (`https://github.com/mwaphinju/goatcalculator`) — this step requires
   the owner's own GitHub authorization inside Render; it cannot be done
   on the owner's behalf.
3. Select the `main` branch.
4. Confirm build command: `npm ci && npm run build`.
5. Confirm publish directory: `out`.
6. If the suggested service name `goatcalculator` is unavailable, choose
   a clear alternative (e.g. `goatcalculator-web`) and note the actual
   assigned URL.
7. Create the Static Site and let the first deploy finish, to learn the
   actual live URL (`https://<service-name>.onrender.com`, or a custom
   domain once configured).
8. In that service's **Environment** tab, set
   `NEXT_PUBLIC_SITE_URL` to the exact live HTTPS URL from step 7 (no
   trailing slash), then trigger a redeploy so canonical URLs, Open
   Graph URLs, `sitemap.xml`, robots.txt's `Sitemap:` line, and every
   structured-data URL are built from the real live URL rather than a
   placeholder.
9. Report the actual live URL back so live verification, screenshots,
   and the Search Console handoff can be completed.

No secrets are required; this site has no private environment variables
beyond `NEXT_PUBLIC_SITE_URL` (which is not a secret).

## Render configuration (`render.yaml`)

```yaml
services:
  - type: web
    name: goatcalculator
    runtime: static
    branch: main
    buildCommand: npm ci && npm run build
    staticPublishPath: ./out
    autoDeploy: true
    headers:
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: Referrer-Policy
        value: strict-origin-when-cross-origin
      - path: /*
        name: Permissions-Policy
        value: camera=(), microphone=(), geolocation=()
      - path: /*
        name: X-Frame-Options
        value: DENY
```

No Content-Security-Policy was added (untested against the exported
site's inline JSON-LD `<script>` tags and Next's hashed asset URLs; an
incorrect CSP could break the site). No redirects or rewrites were added;
Next's static export produces both a `<route>.html` file and a
`<route>/` directory for every page, and Render's static file serving
resolves a clean URL like `/calculators/compound-interest` to
`compound-interest.html` automatically, the same behavior already
verified locally via `npx serve out` throughout every prior phase's
Playwright run.

## Pre-deployment verification (this phase)

All run against the current `main` branch before any deployment attempt:

- `npm run test` — 122/122 passed.
- `npm run typecheck` — clean.
- `npm run lint` — clean.
- `NEXT_PUBLIC_SITE_URL=https://goatcalculator.example npm run build` —
  clean, 21 routes generated (17 pages + `/robots.txt` + `/sitemap.xml`
  + `/_not-found`, matching Phase 5).
- `npx playwright test` — 395/395 passed.
- `out/` inspected directly: `index.html` present; every calculator and
  guide route has its `<route>.html` file; `robots.txt` and
  `sitemap.xml` present; 117 files total.

## Earlier phases

Phases 1 to 5 are approved and functionally unchanged this phase.

- **Phases 1 to 4**: seven calculators (compound interest; savings
  goal/time/comparison; loan payment/payoff; savings scenarios), all
  built on the shared `stepMonth`/`projectBalance` per-month engine
  (`src/lib/finance/projection.ts`), the site-wide input default/
  required-field policy, and `useExampleOrigin`/`useTouchedFields` for
  example-mode and validation timing.
- **Phase 5**: unique metadata (title/description/canonical/Open Graph/
  Twitter summary/robots) on every public page; `robots.txt` and
  `sitemap.xml` generated from one route list (`src/lib/routes.ts`,
  cross-checked against the actual page files on disk); `WebSite`/
  `WebApplication`/`BreadcrumbList` JSON-LD structured data; five guide
  pages under `/guides`, each with an independently checked worked
  example; "Continue planning" internal links and visible breadcrumbs;
  and the validated `NEXT_PUBLIC_SITE_URL` resolution in
  `src/lib/siteConfig.ts` (`absoluteUrl()` is the single function every
  canonical/OG/sitemap/robots/structured-data URL goes through).

Their models, review history, and defects found and fixed are recorded
in prior completion reports and in `CLAUDE.md`.

## Known limitations

- **The site is not yet live.** This phase could not complete an actual
  deployment or live verification; see "Owner action required" above.
- No calculator, guide, or content changed this phase.
- No Content-Security-Policy header (see "Render configuration" above).
- No analytics, advertising, or Search Console verification was added;
  none of that is in scope for this phase or requested.

## Known defects

None known at the time of this report.
