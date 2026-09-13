# GOAT Calculator — Project State

## Current phase

**Phase 1: Foundation and working compound-interest calculator**

Status: `AWAITING_REVIEW`

## Implemented routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage — brief product explanation, direct link to the calculator |
| `/calculators` | Lists implemented calculators only (currently one) |
| `/calculators/compound-interest` | The compound interest calculator |
| `/methodology` | Formula, rounding policy, input limits, scope, privacy |

No other routes exist. `/calculators` only links to
`/calculators/compound-interest` — there are no placeholder cards for
unbuilt tools.

## Implemented features

- Monthly-compounding savings projection with optional monthly
  contributions, end-of-month or beginning-of-month timing.
- Duration entry as whole months, or as years + months (converted to whole
  months internally).
- Distinct empty / invalid / valid-user-scenario / illustrative-example
  states, with an explicit, one-way-tracked transition out of example mode
  per field (see "Example mode" below).
- Results: final balance, initial balance, total contributions, total
  interest, an accessible SVG growth chart, a full month-by-month schedule
  table, an "Assumptions used" `<details>` panel synchronized to the same
  input object used for the calculation, and a deterministic
  contributions-vs-interest explanation sentence.
- Formula, timing assumptions, an independently-verified worked example, and
  the taxes/fees/inflation scope disclaimer are all present in the
  server-rendered (static-export) HTML, not gated behind client JS.
- Input validation with documented limits (see `src/lib/finance/limits.ts`);
  negative values rejected; empty string is tracked separately from an
  explicit zero throughout (form state, validation, and calculation).
- No login, no database, no bank connections, no payments, no AI API calls.
  No analytics/ads/session-replay. No financial values in the URL. Nothing
  is sent off-device.

## Example mode — state machine

Origin state: `empty → example → user` (one-way; there is no path back to
`empty` or `example` once left).

- `empty`: all four fields (initial balance, rate, duration, monthly
  contribution) are blank. No result is computed.
- `example`: "Try an example" (available from a "Not sure what to enter?"
  help affordance under the rate and contribution fields) fills all four
  fields with the same illustrative scenario (see `EXAMPLE` in
  `CompoundInterestCalculator.tsx`) and shows "Illustrative example — edit
  these assumptions." near both the inputs and the results.
- `user`: triggered by editing any field (or the contribution-timing
  radios) while in `example` mode, or by typing into a blank field from
  `empty`. On the `example → user` transition, every field *other than* the
  one just edited is recorded as "still holding an example value" and gets
  an individual "Example value — not yet edited" tag; a banner names which
  fields those are. Each such field's tag/mention clears as soon as that
  specific field is edited. This avoids ever silently treating an untouched
  example value as something the visitor typed.

## Financial model, timing, and rounding — summary

Monthly compounding only (no other frequency is offered). Given nominal
annual rate `r` (percent) and monthly rate `i = (r / 100) / 12`:

- End-of-month contributions: `B_next = B × (1 + i) + C`
- Beginning-of-month contributions: `B_next = (B + C) × (1 + i)`

`totalInterest` is defined as `finalBalance − initialBalance −
totalContributions` (a residual), which makes the identity `initialBalance +
totalContributions + totalInterest = finalBalance` hold exactly at full
internal precision, by construction — see
`src/lib/finance/compoundInterest.ts`.

Internal arithmetic uses `decimal.js` at 40 significant digits (not IEEE
double floats), cloned locally in `compoundInterest.ts` so it's independent
of any other precision configuration elsewhere in the app. Display values
are rounded separately, round-half-up to the nearest cent, only at render
time (`src/lib/finance/format.ts`); this can make independently-rounded
displayed figures differ from each other by up to $0.01, which is
documented on the methodology page.

Documented input limits (`src/lib/finance/limits.ts`):

- Initial balance: 0 – 10,000,000
- Monthly contribution: 0 – 1,000,000
- Nominal annual rate: 0% – 100%
- Duration: 0 – 600 whole months

## Decisions and interpretations worth flagging for review

- **Currency**: the calculator is deliberately currency-agnostic (no
  `Intl` currency-style formatting locked to USD). A "$" is used as a
  generic unit symbol; the methodology page explains the math is identical
  for USD/GBP/CAD/AUD. Flag if a literal "$" symbol is undesirable for a
  UK/CA/AU-first framing later.
- **Contribution timing default**: defaults to "End of month" on load. This
  is treated as a mechanics choice (not a financial assumption needing an
  "I don't know" affordance), since the two options are always visible,
  labeled, and require no guess about market conditions.
- **Duration mode toggle** (months vs. years+months) does not itself count
  as "editing" a value — switching representation without changing the
  underlying total does not exit example mode.
- **Result gating**: the results panel (stats, chart, assumptions,
  schedule) only renders when all four required fields are simultaneously
  valid. Clearing any one field after a valid result hides the entire
  results panel (chosen over "mark stale" — see Phase 1 prompt section 6,
  which allows either).
- Large numbers (near the documented limits, results can reach ~10^28) are
  handled with `break-words` on the stat cards so they wrap instead of
  overflowing; verified by an e2e test at the limit values.

## Known limitations (by design, in scope for a later phase)

- No taxes, fees, inflation, variable rates, or APY input mode.
- No compounding frequency other than monthly.
- No comparison view, savings-goal solver, or multi-scenario tooling.
- Not deployed. No domain assumed (`NEXT_PUBLIC_SITE_URL` unset locally).

## Known defects

None known at the time of this report. See the completion report for full
verification detail.
