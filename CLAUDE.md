@AGENTS.md

# GOAT Calculator

Brand: GOAT Calculator. Tagline: "See what your money could do."

Free financial calculator website, US-first, with country-neutral
calculations also useful to English-speaking UK, Canadian and Australian
visitors. Internal business goal: USD 2,000/month gross advertising revenue
within two years of public launch — an internal target, not a public claim.

## Hard requirements (apply to every phase)

All visitor-facing tools must work without:

- Login or registration, including anonymous authentication.
- Supabase or any database.
- Bank connections or statement uploads.
- Payments or subscriptions.
- An AI API for calculations.

Calculations run in the visitor's browser using deterministic, tested
mathematics — not a server, not an LLM.

Privacy: nothing entered by a visitor is sent to a server or third party.
Financial inputs are not stored automatically and never go into the URL. No
analytics, advertising, or session-replay scripts.

Honesty: no invented reviewers, testimonials, user counts, or endorsements.
No guaranteed-return claims. Only link to calculator pages that are actually
implemented and working — never a placeholder card.

Deployment target: Render Static Site via Next.js static export
(`output: "export"`). Brand name and canonical origin are configurable (see
`src/lib/siteConfig.ts` and `.env.example`) — never assume ownership of a
domain or invent a deployed URL.

## Phase-review process

This project is built in reviewed phases. Each phase:

1. Is implemented completely, tested, and documented in
   `docs/PROJECT_STATE.md` with status `AWAITING_REVIEW`.
2. Ends with a structured completion report and an explicit stop — the next
   phase is never started automatically, even if all checks pass and even if
   a future-phase prompt was supplied in advance.
3. Requires the user to return with a reviewed decision and the next prompt
   before any further implementation work begins.

Passing tests does not authorize moving to the next phase. Do not self-approve
a phase review.

## Technology

- Next.js App Router, TypeScript (strict), static export.
- Tailwind CSS v4 (CSS-first config, see `src/app/globals.css`).
- Pure financial functions live in `src/lib/finance/`, separated from React
  components, and are unit-tested with Vitest.
- `decimal.js` for arbitrary-precision arithmetic; see
  `src/lib/finance/format.ts` for the display-rounding policy.
- Playwright for browser tests, run against the static export in `out/`.

See `docs/PROJECT_STATE.md` for what is currently implemented, and
`README.md` for exact setup/dev/test/build commands.
