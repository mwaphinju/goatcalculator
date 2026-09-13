import Decimal from "decimal.js";
import { resolveMonthlyRate } from "./rate";
import { projectBalance } from "./projection";
import type { SavingsGoalInput, SavingsGoalResult } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Solves for the monthly contribution required to reach a target balance,
 * using the closed-form inverse of the shared savings model rather than a
 * numerical search. Decimal arithmetic at 40 significant digits keeps this
 * stable even as the monthly rate approaches zero, where the naive
 * ((1+i)^N - 1) / i form is prone to floating-point cancellation in
 * ordinary doubles; an exact-zero rate is handled as its own case instead
 * of relying on the formula's limit.
 *
 * Future value of the starting balance alone, after N months at monthly
 * rate i:
 *   growth = (1 + i) ^ N
 *   balanceFromStartAlone = P * growth
 *
 * Future value contributed by C over N months (the "annuity factor"):
 *   End of each month:       ((growth - 1) / i) * C           (i != 0)
 *   Beginning of each month: ((growth - 1) / i) * (1 + i) * C (i != 0)
 *   Either timing, i == 0:   N * C
 *
 * Solving balanceFromStartAlone + annuityFactor * C = target for C gives
 * the required contribution. Once C is known (0 for the already-met and
 * interest-alone cases), the confirmation schedule is built by running
 * that contribution back through the same shared projection engine every
 * other calculator uses, so the reported final balance, contributions and
 * interest are never computed by a second, separate code path.
 */
export function calculateSavingsGoal(input: SavingsGoalInput): SavingsGoalResult {
  const { targetBalance, months, timing, rateMode, ratePercent } = input;

  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError("months must be a non-negative integer");
  }
  if (input.startingBalance < 0 || targetBalance < 0 || ratePercent < 0) {
    throw new RangeError("startingBalance, targetBalance and ratePercent must be non-negative");
  }
  if (targetBalance <= 0) {
    throw new RangeError("targetBalance must be greater than zero");
  }

  const P = new D(input.startingBalance);
  const T = new D(targetBalance);

  if (P.gte(T)) {
    return finalizeResult("already-met", new D(0), P, months, rateMode, ratePercent, timing);
  }

  if (months === 0) {
    // P < T already established above, and there are zero monthly steps in
    // which contributions or growth could close the gap.
    return {
      reason: "impossible-zero-duration",
      requiredMonthlyContribution: null,
      startingBalance: P.toString(),
      finalBalance: P.toString(),
      totalContributions: "0",
      totalInterest: "0",
      schedule: [],
    };
  }

  const monthlyRate = resolveMonthlyRate(rateMode, ratePercent);
  const growth = monthlyRate.plus(1).pow(months);
  const balanceFromStartAlone = P.times(growth);

  if (balanceFromStartAlone.gte(T)) {
    return finalizeResult("interest-alone", new D(0), P, months, rateMode, ratePercent, timing);
  }

  const remaining = T.minus(balanceFromStartAlone);
  let annuityFactor: Decimal;
  if (monthlyRate.isZero()) {
    annuityFactor = new D(months);
  } else {
    const endOfMonthFactor = growth.minus(1).div(monthlyRate);
    annuityFactor = timing === "begin" ? endOfMonthFactor.times(monthlyRate.plus(1)) : endOfMonthFactor;
  }

  const requiredMonthlyContribution = remaining.div(annuityFactor);
  return finalizeResult("normal", requiredMonthlyContribution, P, months, rateMode, ratePercent, timing);
}

function finalizeResult(
  reason: SavingsGoalResult["reason"],
  requiredMonthlyContribution: Decimal,
  P: Decimal,
  months: number,
  rateMode: SavingsGoalInput["rateMode"],
  ratePercent: number,
  timing: SavingsGoalInput["timing"],
): SavingsGoalResult {
  const monthlyRate = resolveMonthlyRate(rateMode, ratePercent);
  const { finalBalance, totalContributions, schedule } = projectBalance(
    P,
    monthlyRate,
    months,
    requiredMonthlyContribution,
    timing,
  );
  return {
    reason,
    requiredMonthlyContribution: requiredMonthlyContribution.toString(),
    startingBalance: P.toString(),
    finalBalance: finalBalance.toString(),
    totalContributions: totalContributions.toString(),
    totalInterest: finalBalance.minus(P).minus(totalContributions).toString(),
    schedule,
  };
}
