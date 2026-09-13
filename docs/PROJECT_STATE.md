# GOAT Calculator — Project State

## Current phase

**Phase 3: Loan payment and loan payoff calculators**

Status: `AWAITING_REVIEW`

Phases 1 and 2 (foundation, compound interest, savings goal/time/comparison,
and the input default/required-field policy) are approved. See "Earlier
phases" below for a condensed history. This phase adds two educational
fixed-payment loan calculators. No calculation logic from Phases 1 or 2
changed; two shared comparison components were generalized and relocated
(see "Shared UI components" below) but their savings-comparison behavior is
unchanged, verified by re-running that suite.

## Implemented routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — explanation plus links to all six calculators |
| `/calculators` | Lists all six implemented calculators |
| `/calculators/compound-interest` | Compound interest calculator |
| `/calculators/savings-goal` | How much do I need to save each month? |
| `/calculators/savings-time` | How long will it take to reach my target? |
| `/calculators/savings-comparison` | What changes if I save more or use a different rate? |
| `/calculators/loan-payment` | Estimate a monthly loan payment and amortization schedule |
| `/calculators/loan-payoff` | Compare a baseline payoff against an extra-payment scenario |
| `/methodology` | Formulas, rate modes, rounding policy, input limits, scope, privacy |

No other routes exist. No mortgage, auto-loan, credit-card, lender referral,
ads, analytics, accounts, or unrelated calculators were added.

## Loan payment model (`src/lib/finance/loanPayment.ts`)

Closed-form fixed monthly payment, given loan amount `P`, monthly rate `i`
(annual note rate / 100 / 12), and `n` monthly payments:

```
i > 0: M = P × i / (1 − (1 + i)^−n)
i = 0: M = P / n
```

`M` is computed at high internal (40 significant digit) precision, then
rounded once to the nearest cent (`ROUND_HALF_UP`) to become the actual
scheduled payment. The amortization schedule then applies, for each month:
interest first (on the current balance), then the rounded scheduled
payment, with the remainder reducing principal. The final row is capped at
the exact remaining balance owed, so the schedule always reaches exactly
`$0.00` and never goes negative — this can make the last row's payment
differ slightly from the flat scheduled payment shown for every other row,
which is expected and documented on the page. Monthly payment frequency
only; no other frequency is offered or implied.

Independently derived fixtures (via a separate plain-JS script, not the
implementation): $10,000 at 12% over 12 months gives a theoretical payment
of $888.4878867834170733998783122788652898046, rounding to $888.49; $1,200
at 0% over 12 months gives exactly $100.00 for all 12 rows.

## Loan payoff model (`src/lib/finance/loanPayoff.ts`)

A bounded month-by-month simulation (no closed form exists for "first month
a threshold is crossed" the way there is for a fixed-payment solve). Two
scenarios are always run and compared: a **baseline** (required payment
only, no extras) and the visitor's **extra-payment scenario** (required
payment, an optional recurring monthly extra, and an optional one-time
extra applied only in one selected month).

Each simulated month, in order: interest accrues on the current balance
first; then the required payment is applied; then the recurring extra
payment; then, in the selected month only, the one-time extra payment.
Every payment is capped at the amount actually owed that month — a
requested extra beyond what was owed is reported separately as an unused
amount and is never counted as paid. "Month 1" is defined as the first
modeled payment month.

**Non-amortizing detection**: before simulating, the required payment plus
recurring extra is compared against the first month's interest. If it does
not exceed that interest, the balance cannot decrease (a fixed rate and a
covered — or larger — payment guarantees strictly decreasing interest and
therefore continued amortization once the first month is covered, so a
single up-front check is sufficient; no per-month check is needed). In that
case no payoff date is invented: the result states plainly that the balance
does not decrease under this payment, and shows only the minimum payment
that would cover the first month's interest, labeled explicitly as an
educational reference point, not a lender requirement. No comparison or
interest-saved figure is shown for a non-amortizing scenario.

**Maximum horizon**: simulation runs up to `LOAN_PAYOFF_LIMITS.maxMonths`
(1,200 months, 100 years). If a valid, amortizing loan does not pay off
within that horizon, the result says so rather than inventing a payoff
date.

`monthsSaved` and `interestSaved` are computed only when both the baseline
and extra-payment scenarios amortize within the horizon; otherwise they are
`null` and the UI shows "Not applicable" rather than a number.

Independently derived fixtures (via a separate script, not the
implementation): $10,000 at 6% with a $200 required monthly payment pays
off the baseline in 58 months (4 years, 10 months) with $1,536.14 total
interest; adding a $50 recurring extra pays off in 45 months (3 years, 9
months) with $1,185.17 interest, saving 13 months and $350.97; a $1,000
one-time extra in month 6 pays off in 52 months; an oversized $50,000
one-time extra in month 1 is capped, paying off in 1 month with $40,150.00
reported as unused; a $10,000 balance at 12% with a $50 required payment
(below the $100 first-month interest) is non-amortizing; a $1,000,000
balance at 1% with an $840 required payment (against ~$833.33 first-month
interest) does not pay off within the 1,200-month maximum.

## Cent rounding policy (both loan calculators)

Balance, interest, and principal are kept at high internal precision (40
significant digits) throughout every calculation. Only two things are ever
rounded to the nearest cent: the scheduled monthly payment itself (once,
up front, via `ROUND_HALF_UP`) and every value actually displayed or
exported. Because each displayed figure is rounded independently, two
displayed figures can differ from their unrounded sum by up to $0.01 — the
same site-wide display-rounding note used by every calculator. Real lender
schedules may differ further due to rounding conventions, payment date,
fees, escrow, penalties, and changing rates; both calculator pages state
this explicitly.

## Note rate versus APR

Both loan calculators use the annual note interest rate the visitor enters,
which is explicitly documented as not necessarily the same as an APR (an
APR can include certain fees on top of the note rate). Neither calculator
calculates or claims an all-in APR, implies loan approval, quotes a lender,
recommends a provider, or advises whether refinancing is suitable.

## Input default and required-field policy (loan calculators)

Follows the same site-wide policy from Phase 2:

- **Loan payment**: loan amount (required, > 0), annual note rate
  (required, blank by default, explicit 0% valid), loan term (required,
  > 0 whole months, entry supports months or years-plus-months).
- **Loan payoff**: current balance (required, > 0), annual note rate
  (required), required monthly payment (required, > 0), recurring extra
  monthly payment (defaults to visible `0`, meaning none), one-time extra
  payment (defaults to visible `0`), month for the one-time extra (defaults
  to visibly selected "1", the first modeled payment month; applies only if
  the one-time extra is greater than $0).

A blank required field is never treated as zero. A defaulted-zero field is
restored to `0` on blur if cleared. Error messages appear only after the
field is touched or the form is otherwise interacted with, consistent with
`useTouchedFields` / `useExampleOrigin` (see Phase 2 history).

## Input limits (`src/lib/finance/limits.ts`)

- Loan payment: loan amount 0 to 10,000,000; rate 0% to 100%; term 0 to
  600 months.
- Loan payoff: current balance 0 to 10,000,000; rate 0% to 100%; required
  monthly payment 0 to 1,000,000; extra monthly payment 0 to 1,000,000;
  one-time extra payment 0 to 10,000,000; documented maximum simulation
  horizon of 1,200 months (100 years).

## New files this phase

- `src/lib/finance/loanPayment.ts`, `loanPayoff.ts` — calculation engines.
- `src/lib/finance/types.ts`, `limits.ts`, `validation.ts` — extended with
  loan input/result types, loan limits, and two new validators
  (`validatePositiveAmountField`, `validatePositiveMonthsField`).
- `src/lib/finance/__tests__/loanPayment.test.ts`,
  `loanPayoff.test.ts` — independently-derived-fixture unit tests.
- `src/components/loan-payment/LoanPaymentCalculator.tsx`,
  `src/components/loan-payoff/LoanPayoffCalculator.tsx` — orchestrator
  components.
- `src/components/shared/LoanScheduleTable.tsx`,
  `LoanBalanceChart.tsx` — loan-specific accessible schedule table and
  balance chart.
- `src/components/shared/ComparisonChart.tsx`,
  `ComparisonTable.tsx` — generalized and relocated from
  `src/components/savings-comparison/` (minimal structural props) so the
  loan payoff comparison can reuse them; `SavingsComparisonCalculator.tsx`
  updated to import from the new location.
- `src/app/calculators/loan-payment/page.tsx`,
  `src/app/calculators/loan-payoff/page.tsx` — static explanatory pages.
- `src/app/calculators/page.tsx`, `src/app/page.tsx`,
  `src/app/methodology/page.tsx` — updated to link to and document the two
  new calculators.
- `e2e/loan-payment.spec.ts`, `e2e/loan-payoff.spec.ts` — new browser test
  suites; `e2e/navigation.spec.ts`, `responsive.spec.ts`, `wording.spec.ts`,
  `exports.spec.ts`, `accessibility.spec.ts` updated to cover the two new
  routes.

## Earlier phases

Phase 1 (compound interest calculator, foundation) and Phase 2 (savings
goal/time/comparison calculators, the shared financial engine, and the
input default/required-field policy) are approved and unchanged this
phase. Their models, review-round history, and defects-found-and-fixed are
recorded in prior completion reports and in `CLAUDE.md`'s public wording
rules (em/en dash prohibition, specific hyphenated-term replacements,
timing wording). Summary: `stepMonth`/`projectBalance` (`projection.ts`)
is the single shared per-month formula every calculator (including the
loan calculators) is built on; `useExampleOrigin` and `useTouchedFields`
are the shared example-mode and validation-timing hooks; `PrintDetailsExpander`
forces closed `<details>` assumptions panels open for printing.

## Known limitations (by design, in scope for a later phase)

- No taxes, fees, inflation, insurance, escrow, penalties, or variable-rate
  modeling on any calculator.
- No compounding frequency other than monthly; loan payments are monthly
  only.
- No mortgage-specific, auto-loan, or credit-card calculators; no APR
  calculation; no lender integration of any kind.
- Not deployed. No domain assumed (`NEXT_PUBLIC_SITE_URL` unset locally).

## Known defects

None known at the time of this report. See the completion report for full
verification detail.
