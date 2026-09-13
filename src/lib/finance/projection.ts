import Decimal from "decimal.js";
import type { ContributionTiming, ScheduleRow } from "./types";

/**
 * A local Decimal constructor with precision high enough that a long
 * schedule does not accumulate meaningful rounding error, independent of
 * whatever precision another part of the app might configure on the global
 * Decimal object.
 */
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export interface MonthStep {
  endingBalance: Decimal;
  interest: Decimal;
}

/**
 * Applies exactly one monthly step of the shared savings model:
 *
 *   End of each month:       B_next = B * (1 + i) + C
 *   Beginning of each month: B_next = (B + C) * (1 + i)
 *
 * This is the single place the per-month formula is implemented; every
 * calculator (compound interest, savings goal, savings time, and savings
 * comparison) goes through this function rather than re-implementing the
 * step itself.
 */
export function stepMonth(
  balance: Decimal,
  monthlyRate: Decimal,
  contribution: Decimal,
  timing: ContributionTiming,
): MonthStep {
  const onePlusI = monthlyRate.plus(1);

  if (timing === "end") {
    const afterGrowth = balance.times(onePlusI);
    return { endingBalance: afterGrowth.plus(contribution), interest: afterGrowth.minus(balance) };
  }

  const afterContribution = balance.plus(contribution);
  const endingBalance = afterContribution.times(onePlusI);
  return { endingBalance, interest: endingBalance.minus(afterContribution) };
}

export interface ProjectionResult {
  finalBalance: Decimal;
  totalContributions: Decimal;
  schedule: ScheduleRow[];
}

/**
 * Runs `stepMonth` for a fixed number of months, building the full
 * month-by-month schedule. Used whenever the duration is already known
 * (compound interest, savings comparison, and the confirmation schedule
 * for a solved savings goal). `findMonthsToReachTarget` in savingsTime.ts
 * uses `stepMonth` directly instead, since it needs to stop as soon as a
 * target is reached rather than always running a fixed number of months.
 */
export function projectBalance(
  initialBalance: Decimal,
  monthlyRate: Decimal,
  months: number,
  monthlyContribution: Decimal,
  timing: ContributionTiming,
): ProjectionResult {
  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError("months must be a non-negative integer");
  }

  let balance = initialBalance;
  let totalContributions = new D(0);
  const schedule: ScheduleRow[] = [];

  for (let m = 1; m <= months; m++) {
    const startingBalance = balance;
    const { endingBalance, interest } = stepMonth(startingBalance, monthlyRate, monthlyContribution, timing);

    totalContributions = totalContributions.plus(monthlyContribution);
    schedule.push({
      month: m,
      startingBalance: startingBalance.toString(),
      contribution: monthlyContribution.toString(),
      interest: interest.toString(),
      endingBalance: endingBalance.toString(),
    });

    balance = endingBalance;
  }

  return { finalBalance: balance, totalContributions, schedule };
}

export { D as ProjectionDecimal };
