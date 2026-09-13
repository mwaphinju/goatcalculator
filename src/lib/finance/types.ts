export type ContributionTiming = "end" | "begin";

/**
 * How a visitor's entered rate should be interpreted:
 * - "nominal": a nominal annual rate that still needs monthly compounding
 *   applied (i = rate / 100 / 12).
 * - "apy": an annual percentage yield, already an effective annual rate.
 *   Converted directly to a monthly rate without additional compounding
 *   layered on top (i = (1 + apy / 100) ^ (1/12) - 1).
 */
export type RateMode = "nominal" | "apy";

/**
 * Fully-validated, numeric input to the compound-interest engine.
 * Callers (form code) are responsible for turning raw strings into this
 * shape and rejecting anything outside the documented limits first.
 */
export interface CompoundInterestInput {
  /** Starting balance in dollars (or the visitor's currency unit). >= 0. */
  initialBalance: number;
  /** Nominal annual interest rate expressed as a percent, e.g. 12 for 12%. >= 0. */
  annualRatePercent: number;
  /** Whole number of monthly compounding steps to run. >= 0, integer. */
  months: number;
  /** Contribution made every month, in the same unit as initialBalance. >= 0. */
  monthlyContribution: number;
  /** Whether the monthly contribution is applied before or after that month's growth. */
  timing: ContributionTiming;
}

/** One row of the month-by-month schedule, as exact decimal strings. */
export interface ScheduleRow {
  month: number;
  startingBalance: string;
  contribution: string;
  interest: string;
  endingBalance: string;
}

export interface CompoundInterestResult {
  /** Balance before any growth or contributions, as an exact decimal string. */
  initialBalance: string;
  /** Balance after the final month, as an exact decimal string. */
  finalBalance: string;
  /** Sum of all monthly contributions, as an exact decimal string. */
  totalContributions: string;
  /** finalBalance - initialBalance - totalContributions, as an exact decimal string. */
  totalInterest: string;
  schedule: ScheduleRow[];
}

/** A fully-validated, numeric scenario: starting balance, contribution, rate and duration. */
export interface ScenarioInput {
  startingBalance: number;
  monthlyContribution: number;
  rateMode: RateMode;
  ratePercent: number;
  months: number;
  timing: ContributionTiming;
}

export interface ScenarioResult {
  startingBalance: string;
  finalBalance: string;
  totalContributions: string;
  totalInterest: string;
  schedule: ScheduleRow[];
}

export interface SavingsGoalInput {
  startingBalance: number;
  targetBalance: number;
  months: number;
  rateMode: RateMode;
  ratePercent: number;
  timing: ContributionTiming;
}

export type SavingsGoalReason =
  | "already-met"
  | "interest-alone"
  | "impossible-zero-duration"
  | "normal";

export interface SavingsGoalResult {
  reason: SavingsGoalReason;
  /** Required monthly contribution, as an exact decimal string. Null only when unreachable. */
  requiredMonthlyContribution: string | null;
  startingBalance: string;
  finalBalance: string;
  totalContributions: string;
  totalInterest: string;
  schedule: ScheduleRow[];
}

export interface SavingsTimeInput {
  startingBalance: number;
  targetBalance: number;
  monthlyContribution: number;
  rateMode: RateMode;
  ratePercent: number;
  timing: ContributionTiming;
}

export type SavingsTimeReason = "already-reached" | "not-reached" | "exceeds-max" | "reached";

export interface SavingsTimeResult {
  reason: SavingsTimeReason;
  /** First whole month the target is reached, or null if not reached. */
  monthsToReach: number | null;
  startingBalance: string;
  finalBalance: string;
  totalContributions: string;
  totalInterest: string;
  schedule: ScheduleRow[];
  maxMonths: number;
}

export interface ComparisonResult {
  baseline: ScenarioResult;
  alternative: ScenarioResult;
  finalBalanceDifference: string;
  totalContributionsDifference: string;
  totalInterestDifference: string;
}

/** A fully-validated, numeric input to the loan payment calculator. */
export interface LoanPaymentInput {
  /** Original loan amount ("P" in the formula). > 0. */
  loanAmount: number;
  /** Annual note interest rate expressed as a percent, e.g. 12 for 12%. >= 0. This is not necessarily an APR. */
  annualRatePercent: number;
  /** Whole number of monthly payments ("n"). > 0, integer. */
  months: number;
}

/** One row of a fixed-rate loan's amortization schedule, as exact decimal strings. */
export interface LoanScheduleRow {
  month: number;
  startingBalance: string;
  payment: string;
  principal: string;
  interest: string;
  endingBalance: string;
}

export interface LoanPaymentResult {
  loanAmount: string;
  /**
   * The theoretical monthly principal-and-interest payment ("M" in the
   * formula), at full internal precision, before any cent rounding. The
   * schedule itself uses this value rounded to the cent as the payment
   * applied every month except the last, which is capped at the exact
   * remaining amount owed — see the cent rounding policy documented next
   * to `calculateLoanPayment`.
   */
  monthlyPayment: string;
  totalPaid: string;
  totalInterest: string;
  schedule: LoanScheduleRow[];
}

/** A fully-validated, numeric input to the loan payoff calculator. */
export interface LoanPayoffInput {
  /** Current remaining loan balance. > 0. */
  currentBalance: number;
  /** Annual note interest rate expressed as a percent. >= 0. Not necessarily an APR. */
  annualRatePercent: number;
  /** The visitor's actual required monthly payment. > 0. */
  requiredMonthlyPayment: number;
  /** Extra amount paid every month on top of the required payment. >= 0. */
  extraMonthlyPayment: number;
  /** A single additional lump-sum payment made once. >= 0. */
  oneTimeExtraPayment: number;
  /** Which modeled month (1 = the first payment month) the one-time extra is applied in. >= 1. */
  oneTimeExtraMonth: number;
}

export type LoanPayoffScenarioReason = "amortizing" | "non-amortizing" | "exceeds-max";

export interface LoanPayoffScheduleRow {
  month: number;
  startingBalance: string;
  interest: string;
  /** Total amount actually applied this month (required + any extra), after capping at the amount owed. */
  payment: string;
  principal: string;
  endingBalance: string;
}

export interface LoanPayoffScenarioResult {
  reason: LoanPayoffScenarioReason;
  /** The first month the balance reaches zero, or null if non-amortizing or the horizon was exceeded. */
  monthsToPayoff: number | null;
  totalPaid: string;
  totalInterest: string;
  schedule: LoanPayoffScheduleRow[];
  /**
   * Any requested one-time extra payment that was never actually applied
   * (either because the loan paid off before the requested month, or
   * because the amount owed that month was less than requested). Never
   * counted as paid.
   */
  unusedOneTimeExtra: string;
  /**
   * The first month's interest alone, shown as an educational reference
   * point regardless of whether this scenario amortizes: a payment at or
   * below this amount would not reduce the balance at all. Not a lender
   * requirement.
   */
  minimumPaymentToCoverInterest: string;
  maxMonths: number;
}

export interface LoanPayoffResult {
  baseline: LoanPayoffScenarioResult;
  withExtra: LoanPayoffScenarioResult;
  /** baseline.monthsToPayoff - withExtra.monthsToPayoff, only when both scenarios amortize within the horizon. */
  monthsSaved: number | null;
  /** baseline.totalInterest - withExtra.totalInterest, only when both scenarios amortize within the horizon. */
  interestSaved: string | null;
}
