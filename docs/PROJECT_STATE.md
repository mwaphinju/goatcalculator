# GOAT Calculator — Project State

## Current phase

**Phase 4: Savings scenarios with visitor-entered inflation and monthly fees**

Status: `AWAITING_REVIEW`

Phases 1 through 3 (foundation, compound interest, savings goal/time/
comparison, the input default/required-field policy, and the loan payment/
payoff calculators) are approved. See "Earlier phases" below for a
condensed history. This phase adds one new calculator, the savings
scenario calculator, that lets a visitor compare three savings
possibilities using assumptions (rate, monthly contribution, monthly
account fee) they choose themselves, plus an optional inflation
assumption used only to estimate buying power. No calculation logic from
Phases 1 through 3 changed, and no new inflation or fee inputs were
retrofitted onto any earlier calculator.

## Implemented routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — explanation plus links to all seven calculators |
| `/calculators` | Lists all seven implemented calculators |
| `/calculators/compound-interest` | Compound interest calculator |
| `/calculators/savings-goal` | How much do I need to save each month? |
| `/calculators/savings-time` | How long will it take to reach my target? |
| `/calculators/savings-comparison` | What changes if I save more or use a different rate? |
| `/calculators/loan-payment` | Estimate a monthly loan payment and amortization schedule |
| `/calculators/loan-payoff` | Compare a baseline payoff against an extra-payment scenario |
| `/calculators/savings-scenarios` | Compare up to three savings possibilities using your own assumptions |
| `/methodology` | Formulas, rate modes, rounding policy, input limits, scope, privacy |

No other routes exist. No accounts, sign-in, analytics, advertising,
payments, APIs, database storage, URL parameters, or browser storage were
added.

## Savings scenario model (`src/lib/finance/savingsScenarios.ts`)

Runs up to three scenario "branches" independently from one shared plan
(starting balance, whole-month duration, contribution timing). Each branch
has its own visitor-chosen annual interest rate, monthly contribution, and
monthly account fee — never a forecast or recommendation. Reuses the
existing shared `stepMonth` (in `projection.ts`) for the growth and
contribution step, then applies that month's fee on top:

```
End of each month:       preFee = starting * (1 + i) + contribution
Beginning of each month:  preFee = (starting + contribution) * (1 + i)
endingBalance = max(0, preFee - fee)
```

`stepMonth` already computes exactly the documented "preFee" balance in
both timing modes, so the fee is simply subtracted afterward, capped at
whatever balance is actually available: the balance never goes negative,
and the fee actually deducted (which can be less than the entered monthly
fee) is tracked separately from the amount the visitor entered. This does
not model account debt or overdraft charges. The monthly rate is
`annual rate / 100 / 12`; this calculator supports a nominal annual rate
compounded monthly only.

**Buying power**: `finalBalance / (1 + inflationRatePercent / 100) ^
(months / 12)`, computed per scenario from the shared inflation
assumption. Inflation never changes the projected account balance itself.
When the inflation rate is exactly 0, buying power is set to the final
balance directly (not computed through the power formula) so it is
guaranteed to equal the final balance exactly, not merely to within a
rounding tolerance.

Independently derived fixtures (via a separate script, not the
implementation): $0 starting, $100/month, 12 months, 0% rate, 0% inflation
gives a final balance and buying power of exactly $1,200.00; $1,000
starting, 0% rate, no contribution, $10/month fee, 12 months gives a final
balance of exactly $880.00 with exactly $120.00 in total fees deducted; a
$1,000 final balance with 10% annual inflation over 12 months gives a
buying power of 909.090909... before rounding, $909.09 displayed; with the
same positive rate and contribution, beginning-of-month timing never
produces a smaller final balance than end-of-month; $5 starting, 0% rate,
no contribution, $10/month fee, one month gives a final balance of exactly
$0.00 with only $5.00 (not $10.00) reported as the actual fee deducted,
and the fee cap continues to hold in later months once the balance is
zero.

## Input default and required-field policy (savings scenarios)

Follows the same site-wide policy from Phase 2, applied to a "Shared plan"
section plus three scenario sections (default names "Scenario A", "Scenario
B", "Scenario C", each visitor-renamable via a plain text field that is not
part of the required/example-tracked fields):

- **Shared plan**: starting balance (defaults to visible `0`), duration
  (required, blank by default, whole months, > 0), contribution timing
  (explicit choice, "End of each month" / "Beginning of each month"),
  inflation rate per year (defaults to visible `0`, meaning no inflation
  adjustment; explained inline that it never changes the projected
  balance).
- **Each scenario branch**: annual interest rate (required, blank by
  default, explicit 0% valid), monthly contribution (defaults to visible
  `0`), monthly account fee (defaults to visible `0`).

A result is computed only once the duration and all three scenarios'
rates are valid. A blank required field is never treated as zero. A
defaulted-zero field is restored to `0` on blur if cleared. Error messages
appear only after the field is touched or the form is otherwise
interacted with (`useTouchedFields` / `useExampleOrigin`, as in every
other calculator). Renaming a scenario changes only its display label
(including the CSV and chart legend), never the calculation; the UI
states this explicitly.

## Input limits (`src/lib/finance/limits.ts`)

`SAVINGS_SCENARIOS_LIMITS`: starting balance 0 to 10,000,000; duration 1 to
600 whole months; rate (per scenario) and inflation rate 0% to 100%;
monthly contribution and monthly account fee (per scenario) 0 to
1,000,000.

## New files this phase

- `src/lib/finance/savingsScenarios.ts` — calculation engine
  (`calculateSavingsScenarios`).
- `src/lib/finance/types.ts`, `limits.ts` — extended with
  `SavingsScenarioBranchInput`, `SavingsScenariosInput`,
  `SavingsScenarioResult`, `SavingsScenariosResult`, and
  `SAVINGS_SCENARIOS_LIMITS`. No new validators were needed; existing
  `validateNumberField` and `validatePositiveMonthsField` cover every
  field.
- `src/lib/finance/__tests__/savingsScenarios.test.ts` —
  independently-derived-fixture unit tests (14 tests).
- `src/components/savings-scenarios/SavingsScenariosCalculator.tsx` —
  orchestrator component; `ScenarioBranchFields.tsx` — one editable
  scenario branch (name, rate, contribution, fee), used three times.
- `src/components/shared/ScenarioComparisonChart.tsx` — accessible
  multi-line chart, one line per scenario, each with both a distinct
  color and a distinct dash pattern (solid/dashed/dotted) so scenarios
  stay distinguishable without color alone.
- `src/components/shared/ScenarioComparisonTable.tsx` — compact summary
  table (final balance, buying power, contributions, interest, fees per
  scenario).
- `src/components/shared/ScenarioMonthlyScheduleTable.tsx` — month-by-month
  ending balance per scenario, using the established horizontal-scroll
  pattern.
- `src/app/calculators/savings-scenarios/page.tsx` — static explanatory
  page (calculation order, inflation formula, fee treatment, scope).
- `src/app/calculators/page.tsx`, `src/app/page.tsx`,
  `src/app/methodology/page.tsx` — updated to link to and document the new
  calculator.
- `e2e/savings-scenarios.spec.ts` — new browser test suite (25 tests);
  `e2e/navigation.spec.ts`, `responsive.spec.ts`, `wording.spec.ts`,
  `exports.spec.ts`, `accessibility.spec.ts`, `screenshots.spec.ts`
  updated to cover the new route.
- `CLAUDE.md` — no changes needed this phase; the existing public-wording
  and input-policy rules already covered every case encountered.

## Earlier phases

Phases 1 to 3 (compound interest; savings goal/time/comparison; loan
payment/payoff) are approved and unchanged this phase. Their models,
review-round history, and defects found and fixed are recorded in prior
completion reports and in `CLAUDE.md`. Summary: `stepMonth`/
`projectBalance` (`projection.ts`) is the single shared per-month formula
every calculator, including this phase's savings scenario engine, is
built on; `useExampleOrigin` and `useTouchedFields` are the shared
example-mode and validation-timing hooks; `PrintDetailsExpander` forces
closed `<details>` assumptions panels open for printing; both loan
calculators use a fixed annual note rate, explicitly documented as not
necessarily an APR.

## Known limitations (by design, in scope for a later phase)

- No taxes, changing rates, deposits that vary over time, investment
  losses, account debt, overdraft charges, or withdrawal limits on any
  calculator.
- The savings scenario calculator's inflation and monthly-fee inputs are
  specific to that calculator; no other calculator was retrofitted with
  them this phase.
- No compounding frequency other than monthly; loan payments are monthly
  only.
- No mortgage-specific, auto-loan, or credit-card calculators; no APR
  calculation; no lender integration of any kind.
- Not deployed. No domain assumed (`NEXT_PUBLIC_SITE_URL` unset locally).

## Known defects

None known at the time of this report. See the completion report for full
verification detail.
