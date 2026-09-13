export type ContributionTiming = "end" | "begin";

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
