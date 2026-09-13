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

## Public wording style

All text rendered on visitor-facing pages (headings, navigation, labels,
help text, validation messages, example notices, results and assumptions,
chart captions and accessible text, methodology content, page titles and
metadata) must not use em dashes, en dashes, or a hyphen used as a
dash-style phrase separator. Split into two sentences, or use a comma or
parentheses, instead. Write numeric ranges with "to" (e.g. "0 to 11"), not a
dash. This does not apply to source-code comments or test names, which are
not visitor-facing.

Preserve, unchanged by this rule: mathematical minus signs in formulas
(e.g. `final balance − initial balance − total contributions`), route
paths, filenames, package names, and code syntax.

Specific hyphenated terms are not preserved in public prose — use the
natural alternative instead, adapting the surrounding sentence to read
naturally:

- "end-of-month" → "end of each month"
- "beginning-of-month" → "beginning of each month"
- "month-by-month" → "monthly"
- "round-half-up" → explain the behavior in a sentence (e.g. "Amounts are
  rounded to the nearest cent. Exact halfway values are rounded up.")
- "arbitrary-precision" → "high precision", with the actual significant-digit
  setting stated where useful
- "fixed-rate" → "a loan with a fixed interest rate" / "at a fixed interest
  rate", adapting the sentence around it
- "one-time" → "one time" (no hyphen)

Beyond this specific list, use judgment for other genuinely awkward
rewrites rather than a blanket find-and-replace — but do not reintroduce
any of the five terms above into visitor-facing text.

## Input default and required-field policy

Applies to every input on every calculator, present and future:

- Use a visible **zero default** only when zero naturally means "none"
  (e.g. starting balance, monthly contribution). The field shows `0`
  immediately and is usable right away; if a visitor clears it, restore
  `0` on blur rather than ever silently treating a blank field as zero.
- Otherwise the field is **required**: it starts empty, its visible label
  text includes "(Required)" (not just a placeholder), and
  `aria-required="true"` is set. A rate (nominal or APY) is always
  required and never defaults to 0%. Show the field's error message only
  after the visitor has interacted with it (blur) or with the form
  generally — never on first paint.
- A structural choice with no ambiguous unselected state (rate type,
  contribution timing) is an **explicit choice**: always a visibly
  selected radio option with a sensible default.

Reusable building blocks: `useExampleOrigin` and `useTouchedFields`
(`src/hooks/`) for the state machine; `NumberField`, `RateField`,
`RadioGroup` (`src/components/shared/`) for the fields themselves.

## Technology

- Next.js App Router, TypeScript (strict), static export.
- Tailwind CSS v4 (CSS-first config, see `src/app/globals.css`).
- Pure financial functions live in `src/lib/finance/`, separated from React
  components, and are unit-tested with Vitest. The per-month step and
  schedule-building loop live in `projection.ts` and are shared by every
  calculator — implement new calculators on top of `projectBalance`/
  `stepMonth` rather than re-deriving the step.
- `decimal.js` for high-precision arithmetic; see
  `src/lib/finance/format.ts` for the display-rounding policy.
- Shared, calculator-agnostic UI lives in `src/components/shared/`; put a
  new calculator's own orchestrator component under
  `src/components/<calculator-name>/`.
- CSV export: `src/lib/csv.ts` (`toCsv`/`downloadCsv`), local
  Blob-based, no server. Print view: `.no-print` utility class plus
  `PrintDetailsExpander` (mounted once in the root layout) to force
  `<details>` open for printing — see `docs/PROJECT_STATE.md` for why a
  pure-CSS approach does not work for this in Chromium.
- Playwright for browser tests, run against the static export in `out/`.

See `docs/PROJECT_STATE.md` for what is currently implemented, and
`README.md` for exact setup/dev/test/build commands.
