/**
 * Input limits for the compound-interest calculator.
 *
 * These bounds exist to keep results finite, keep the schedule table and
 * chart renderable in the browser, and rule out inputs that would produce
 * meaningless results (e.g. a billion-dollar starting balance). They are
 * deliberately generous for a personal-savings tool, not a claim about what
 * is realistic.
 */
export const COMPOUND_INTEREST_LIMITS = {
  initialBalance: { min: 0, max: 10_000_000 },
  monthlyContribution: { min: 0, max: 1_000_000 },
  annualRatePercent: { min: 0, max: 100 },
  months: { min: 0, max: 600 },
} as const;

export const MAX_YEARS = Math.floor(COMPOUND_INTEREST_LIMITS.months.max / 12);
