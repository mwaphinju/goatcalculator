/**
 * Input limits shared across the savings calculators.
 *
 * These bounds exist to keep results finite, keep schedule tables and
 * charts renderable in the browser, and rule out inputs that would produce
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

/** Shared across every calculator that accepts a nominal rate or an APY. */
export const RATE_LIMITS = { min: 0, max: 100 } as const;

export const SAVINGS_GOAL_LIMITS = {
  startingBalance: { min: 0, max: 10_000_000 },
  targetBalance: { min: 0, max: 100_000_000 },
  months: { min: 0, max: 600 },
  rate: RATE_LIMITS,
} as const;

export const SAVINGS_TIME_LIMITS = {
  startingBalance: { min: 0, max: 10_000_000 },
  targetBalance: { min: 0, max: 100_000_000 },
  monthlyContribution: { min: 0, max: 1_000_000 },
  rate: RATE_LIMITS,
  /**
   * Documented maximum horizon this calculator will search before
   * reporting that a target is not reached under the entered assumptions.
   * Wider than the compound-interest calculator's 600-month cap because a
   * small contribution at a low rate can legitimately take longer than 50
   * years to reach a large target, and that is itself a useful thing for a
   * visitor to learn rather than being silently cut off at 600 months.
   */
  maxMonths: 1200,
} as const;

export const SAVINGS_COMPARISON_LIMITS = {
  startingBalance: { min: 0, max: 10_000_000 },
  monthlyContribution: { min: 0, max: 1_000_000 },
  rate: RATE_LIMITS,
  months: { min: 0, max: 600 },
} as const;

export const LOAN_PAYMENT_LIMITS = {
  loanAmount: { min: 0, max: 10_000_000 },
  rate: RATE_LIMITS,
  months: { min: 0, max: 600 },
} as const;

export const LOAN_PAYOFF_LIMITS = {
  currentBalance: { min: 0, max: 10_000_000 },
  rate: RATE_LIMITS,
  requiredMonthlyPayment: { min: 0, max: 1_000_000 },
  extraMonthlyPayment: { min: 0, max: 1_000_000 },
  oneTimeExtraPayment: { min: 0, max: 10_000_000 },
  /**
   * Documented maximum horizon this calculator will simulate before
   * reporting that a valid amortizing loan does not pay off within the
   * supported period, matching the savings time calculator's precedent
   * (see SAVINGS_TIME_LIMITS above).
   */
  maxMonths: 1200,
} as const;
