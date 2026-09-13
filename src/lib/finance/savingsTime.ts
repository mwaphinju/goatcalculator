import Decimal from "decimal.js";
import { resolveMonthlyRate } from "./rate";
import { stepMonth } from "./projection";
import { SAVINGS_TIME_LIMITS } from "./limits";
import type { SavingsTimeInput, SavingsTimeResult, ScheduleRow } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Finds the first whole month at which a target balance is reached, by
 * running the same shared per-month step (`stepMonth`, from
 * projection.ts) one month at a time and checking the balance after each
 * step, up to a documented maximum horizon
 * (`SAVINGS_TIME_LIMITS.maxMonths`). Target checking happens once per
 * month, immediately after that month's growth and contribution have both
 * been applied in the chosen order (matching how "end of each month" and
 * "beginning of each month" are defined everywhere else in this app) —
 * never mid-step.
 *
 * A bounded simulation, not a closed-form solve, because "first month the
 * balance crosses a threshold" has no clean inverse the way a fixed-N
 * future value does: the closed-form savings goal solver in
 * savingsGoal.ts answers a different question (how much per month, for a
 * chosen N), not this one (how many months, for a chosen contribution).
 */
export function calculateSavingsTime(input: SavingsTimeInput): SavingsTimeResult {
  const { targetBalance, monthlyContribution, timing, rateMode, ratePercent } = input;

  if (input.startingBalance < 0 || targetBalance < 0 || monthlyContribution < 0 || ratePercent < 0) {
    throw new RangeError(
      "startingBalance, targetBalance, monthlyContribution and ratePercent must be non-negative",
    );
  }
  if (targetBalance <= 0) {
    throw new RangeError("targetBalance must be greater than zero");
  }

  const P = new D(input.startingBalance);
  const T = new D(targetBalance);
  const C = new D(monthlyContribution);
  const monthlyRate = resolveMonthlyRate(rateMode, ratePercent);
  const maxMonths = SAVINGS_TIME_LIMITS.maxMonths;

  if (P.gte(T)) {
    return {
      reason: "already-reached",
      monthsToReach: 0,
      startingBalance: P.toString(),
      finalBalance: P.toString(),
      totalContributions: "0",
      totalInterest: "0",
      schedule: [],
      maxMonths,
    };
  }

  if (C.isZero() && monthlyRate.lte(0)) {
    // No contribution and no positive growth: the balance can never move,
    // so there is no point simulating up to the horizon to find that out.
    return {
      reason: "not-reached",
      monthsToReach: null,
      startingBalance: P.toString(),
      finalBalance: P.toString(),
      totalContributions: "0",
      totalInterest: "0",
      schedule: [],
      maxMonths,
    };
  }

  let balance = P;
  let totalContributions = new D(0);
  const schedule: ScheduleRow[] = [];

  for (let m = 1; m <= maxMonths; m++) {
    const startingBalance = balance;
    const { endingBalance, interest } = stepMonth(startingBalance, monthlyRate, C, timing);

    totalContributions = totalContributions.plus(C);
    schedule.push({
      month: m,
      startingBalance: startingBalance.toString(),
      contribution: C.toString(),
      interest: interest.toString(),
      endingBalance: endingBalance.toString(),
    });

    balance = endingBalance;

    if (balance.gte(T)) {
      return {
        reason: "reached",
        monthsToReach: m,
        startingBalance: P.toString(),
        finalBalance: balance.toString(),
        totalContributions: totalContributions.toString(),
        totalInterest: balance.minus(P).minus(totalContributions).toString(),
        schedule,
        maxMonths,
      };
    }
  }

  return {
    reason: "exceeds-max",
    monthsToReach: null,
    startingBalance: P.toString(),
    finalBalance: balance.toString(),
    totalContributions: totalContributions.toString(),
    totalInterest: balance.minus(P).minus(totalContributions).toString(),
    schedule,
    maxMonths,
  };
}
