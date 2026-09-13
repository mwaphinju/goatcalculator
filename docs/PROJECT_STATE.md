# GOAT Calculator — Project State

## Current phase

**Phase 2: Savings goals, saving time, comparison and input-default policy**

Status: `AWAITING_REVIEW`

Phase 1 (foundation and the compound interest calculator) is approved. See
"Phase 1 history" below for its review rounds. This phase adds three new
calculators, retrofits the input default/required-field policy onto the
approved Phase 1 calculator, and adds print/CSV export to the three new
tools. No calculation logic from Phase 1 changed in a way that alters its
results; `src/lib/finance/compoundInterest.ts` was refactored to reuse the
new shared projection engine internally, but its public function signature,
behavior and all Phase 1 test fixtures are unchanged (verified: the
original 38 Phase 1 vitest assertions still pass unmodified).

## Implemented routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — explanation plus links to all four calculators |
| `/calculators` | Lists all four implemented calculators |
| `/calculators/compound-interest` | Compound interest calculator (Phase 1, retrofitted) |
| `/calculators/savings-goal` | How much do I need to save each month? |
| `/calculators/savings-time` | How long will it take to reach my target? |
| `/calculators/savings-comparison` | What changes if I save more or use a different rate? |
| `/methodology` | Formulas, rate modes, rounding policy, input limits, scope, privacy |

No other routes exist. No loans, mortgages, ads, analytics, accounts, or
unrelated calculators were added.

## Shared financial engine (`src/lib/finance/`)

- `projection.ts` — `stepMonth()` (one month's step, end or beginning
  timing) and `projectBalance()` (runs `stepMonth` for a fixed number of
  months, building the schedule). This is the single implementation of the
  per-month formula; every calculator goes through it rather than
  re-implementing the step.
- `rate.ts` — `monthlyRateFromNominal()`, `monthlyRateFromAPY()`, and
  `resolveMonthlyRate()`. APY is converted directly to a monthly rate
  (`(1 + APY/100)^(1/12) - 1`); it is never compounded again on top of a
  monthly conversion the way a nominal rate is (`rate/100/12`).
- `compoundInterest.ts` — Phase 1's public function, now a thin wrapper
  that resolves a nominal rate and calls `projectBalance`. Same input and
  output shape as Phase 1.
- `scenario.ts` — `runScenario()`, a fixed-duration projection that
  accepts either rate mode. Used by the comparison calculator and to build
  a solved savings goal's confirmation schedule.
- `savingsGoal.ts` — `calculateSavingsGoal()`, a closed-form solver (see
  "Savings goal model" below).
- `savingsTime.ts` — `calculateSavingsTime()`, a bounded month-by-month
  simulation (see "Savings time model" below).
- `savingsComparison.ts` — `compareSavingsScenarios()`, runs two
  `runScenario()` calls and reports the differences.
- `csv.ts` (`src/lib/csv.ts`, not finance-specific) — `toCsv()` and
  `downloadCsv()`, a small local Blob-based CSV export, no server involved.

## Savings goal model

Closed-form inverse of the shared compounding model, not a numerical
search. Given starting balance `P`, target `T`, monthly rate `i`, duration
`N` months:

```
growth = (1 + i) ^ N
balanceFromStartAlone = P * growth
annuityFactor (i != 0): ((growth - 1) / i), times (1 + i) if beginning of each month
annuityFactor (i == 0): N
requiredMonthlyContribution = (T - balanceFromStartAlone) / annuityFactor
```

- `P >= T` → required contribution is $0 ("already met").
- `balanceFromStartAlone >= T` → required contribution is $0 ("interest alone").
- `N == 0` and `T > P` → impossible; explained, not computed as a number.
- Decimal arithmetic at 40 significant digits avoids the floating-point
  cancellation that the naive `(growth-1)/i` form is prone to near `i = 0`
  in ordinary doubles; an exact `i.isZero()` covers that case directly.
- The confirmation schedule (final balance, contributions, interest) is
  built by running the solved contribution back through `projectBalance`,
  the same engine every other calculator uses — never a second, separate
  computation.

## Savings time model

A bounded, one-month-at-a-time simulation using `stepMonth`, not a
closed-form solve (there is no clean inverse for "first month a threshold
is crossed" the way there is for "amount needed after N fixed months").
Target checking happens once per month, immediately after that month's
growth and contribution have both been applied in the chosen order — never
mid-step. Runs up to `SAVINGS_TIME_LIMITS.maxMonths` (1,200 months, 100
years); if the target isn't reached by then, the result says so rather
than inventing an end date. `startingBalance >= target` short-circuits to
"already reached, 0 months" without simulating. A zero contribution and a
non-positive rate short-circuits to "not reached" without simulating,
since the balance provably cannot move.

## Savings comparison model

Runs a baseline and an alternative `ScenarioInput` through `runScenario()`
independently and reports the numeric differences (final balance, total
contributions, total interest). Never claims one scenario is "better."

## Input default and required-field policy

Applied to every field on every Phase 2 calculator, and retrofitted onto
Phase 1's compound interest calculator:

- **Defaulted zero**: the field visibly shows `0` (or is pre-filled) and
  is usable immediately. Used only where zero naturally means "none"
  (starting/initial balance, monthly contribution, and — compound interest
  only — duration). Clearing the field restores `0` on blur
  (`restoreZeroOnBlur` in each calculator component); a field is never
  silently treated as zero while it is transiently blank.
- **Required**: the field starts empty; its visible label text includes
  "(Required)" (not just a placeholder), and `aria-required="true"` is set
  for assistive technology. Used for target balance, duration (on the
  three new calculators), and every rate field. A rate never defaults to
  0% — the visitor must explicitly type it, including typing `0`.
- **Explicit choice**: rate type and contribution timing are always a
  visibly selected radio option, defaulting to nominal rate / end of each
  month respectively, with no ambiguous unselected state.

A required field's inline error message (e.g. "Enter an annual rate or
APY.") appears only once the visitor has interacted with that field (on
blur) or with the form generally (`origin !== "default"` in the
`useExampleOrigin` state machine — see below) — never on first paint.
Implemented via `useTouchedFields` (`src/hooks/useTouchedFields.ts`).

The example-mode state machine from Phase 1 (`empty/default -> example ->
user`, with per-field "still shows an example value" residue tracking) was
extracted into a shared hook, `useExampleOrigin`
(`src/hooks/useExampleOrigin.ts`), and reused by all four calculators. A
defaulted-zero value is never itself labeled as an illustrative example —
only fields actually filled in by "Try an example" get that label.

## Shared UI components (`src/components/shared/`)

`NumberField` (required/example/blur-aware text input), `FieldHelp` ("Not
sure what to enter?" affordance), `RateField` (rate-mode radio group plus
the rate amount field, bundled since every calculator with a rate needs
both), `RadioGroup`, `StatCard` (responsive type sizing so extreme values
never force page overflow), `GrowthChart`, `MonthlyScheduleTable`,
`ScrollableRegion` (the accessible horizontal-scroll pattern: focusable,
labelled, and only shows "Scroll to view all columns." once content
actually overflows, detected via `ResizeObserver`), `PrintButton`,
`CsvDownloadButton`, and `PrintDetailsExpander` (see "Print view" below).
Promoted from Phase 1's compound-interest-only components; Phase 1's
calculator now imports these same shared components rather than its own
copies.

## Print view

Every closed `<details>` (assumptions summaries) needs to be visible in a
printed page even if the visitor never clicked it open on screen. Chromium
hides closed-`<details>` content in a way that plain CSS (`display`, even
`content-visibility` overrides) does not reliably unhide — this was
discovered and fixed during Phase 2 verification (see the completion
report). The actual fix, `PrintDetailsExpander`
(`src/components/shared/PrintDetailsExpander.tsx`, mounted once in the
root layout), listens for the standard `beforeprint`/`afterprint` events
(fired by both the in-page "Print this result" button and a visitor's own
browser print command) and opens every `<details>` immediately before
printing, restoring whichever ones were closed immediately after. Print
CSS (`globals.css`) separately hides `.no-print`-marked chrome (site
header/footer, the print/CSV/example buttons themselves).

## CSV export

Each of the three new calculators has a "Download CSV" button
(`CsvDownloadButton` + `toCsv`/`downloadCsv` from `src/lib/csv.ts`). The
file is assembled as a string and handed to the browser as a local
Blob/object URL — no server round trip, no financial values ever placed in
the page URL. Every export includes the calculator name, a
`Generated,<date/time>` row (captured at click time), every entered
assumption (rate type, rate, timing, duration/target as applicable), the
"Excludes taxes, fees, inflation and variable rates" note, and the full
monthly (or comparison) schedule. Figures in the CSV use the same
display-rounded values shown on screen, so the export reconciles with the
displayed result exactly (verified by e2e test).

## Input limits (`src/lib/finance/limits.ts`)

- Compound interest (unchanged from Phase 1): initial balance 0 to
  10,000,000; monthly contribution 0 to 1,000,000; nominal rate 0% to
  100%; duration 0 to 600 months.
- Savings goal / savings comparison: starting balance 0 to 10,000,000;
  monthly contribution 0 to 1,000,000; rate (nominal or APY) 0% to 100%;
  duration 0 to 600 months; target balance must be greater than 0, up to
  100,000,000.
- Savings time: same starting balance/contribution/rate bounds; target
  balance greater than 0, up to 100,000,000; documented maximum horizon of
  1,200 months (100 years).

## Impossible/edge-case behavior

- Savings goal, zero duration with target above starting balance:
  explained as impossible (no monthly period available), not computed as
  a misleading number.
- Savings time, target unreachable under the entered assumptions (no
  contribution, no positive rate): explained immediately as "not reached,"
  without a 1,200-month simulation.
- Savings time, target not reached within the 1,200-month maximum: reported
  as such; no invented end date.
- All three new calculators reject negative inputs and a non-positive
  target balance, and never return `Infinity`, `NaN`, or a negative
  required contribution (verified by both unit and e2e tests, including at
  the documented upper limits).

## Phase 1 history

### Review round 1 — fix applied

The example-mode label used an em dash ("Illustrative example — edit
these assumptions.") instead of the required "Illustrative example. Edit
these assumptions." Fixed, and a full public-wording review for em/en
dashes was completed; the rule is recorded in `CLAUDE.md`.

### Review round 2 — fix applied

The round 1 preserve-list incorrectly exempted "end-of-month",
"beginning-of-month", "month-by-month", "round-half-up" and
"arbitrary-precision" from the public wording rule; all five were replaced
with natural alternatives. Normal-magnitude currency results (e.g.
$18,207.33) were wrapping across lines inside their stat card at some
widths; fixed with a responsive stat grid and the `StatCard` component's
responsive type sizing (see "Shared UI components" above, since promoted).

### Review round 3 — fix applied

Timing radio labels, the assumptions summary, and related prose now read
"End of each month" / "Beginning of each month" everywhere. The monthly
schedule table gained the accessible horizontal-scroll pattern (see
"Shared UI components" above).

## Known limitations (by design, in scope for a later phase)

- No taxes, fees, inflation, or variable-rate modeling on any calculator.
- No compounding frequency other than monthly.
- No loans, mortgages, or other unrelated calculators.
- Not deployed. No domain assumed (`NEXT_PUBLIC_SITE_URL` unset locally).

## Known defects

None known at the time of this report. See the completion report for full
verification detail, including a defect found and fixed during this
phase's own verification (the print-view `<details>` issue above).
