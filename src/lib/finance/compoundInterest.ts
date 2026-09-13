import Decimal from "decimal.js";
import type {
  CompoundInterestInput,
  CompoundInterestResult,
  ScheduleRow,
} from "./types";

/**
 * A local Decimal constructor with precision high enough that a 600-month
 * schedule (the calculator's documented maximum) does not accumulate
 * meaningful rounding error, independent of whatever precision another part
 * of the app might configure on the global Decimal object.
 */
const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Monthly-compounding savings projection.
 *
 * Model (monthly compounding only):
 *   i = (annualRatePercent / 100) / 12
 *   End-of-month contributions:   B_next = B * (1 + i) + C
 *   Beginning-of-month contributions: B_next = (B + C) * (1 + i)
 *
 * `totalInterest` is defined as the residual
 * (finalBalance - initialBalance - totalContributions) rather than the sum
 * of the schedule's per-month interest column, so the identity
 *   initialBalance + totalContributions + totalInterest === finalBalance
 * holds exactly (at full internal precision, before any display rounding),
 * by construction rather than by coincidence of floating-point rounding.
 */
export function calculateCompoundInterest(
  input: CompoundInterestInput,
): CompoundInterestResult {
  const { annualRatePercent, months, timing } = input;

  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError("months must be a non-negative integer");
  }
  if (input.initialBalance < 0 || input.monthlyContribution < 0 || annualRatePercent < 0) {
    throw new RangeError(
      "initialBalance, monthlyContribution and annualRatePercent must be non-negative",
    );
  }

  const P = new D(input.initialBalance);
  const C = new D(input.monthlyContribution);
  const monthlyRate = new D(annualRatePercent).div(100).div(12);
  const onePlusI = monthlyRate.plus(1);

  let balance = P;
  let totalContributions = new D(0);
  const schedule: ScheduleRow[] = [];

  for (let m = 1; m <= months; m++) {
    const startingBalance = balance;
    let endingBalance: Decimal;
    let interestThisMonth: Decimal;

    if (timing === "end") {
      const afterGrowth = startingBalance.times(onePlusI);
      interestThisMonth = afterGrowth.minus(startingBalance);
      endingBalance = afterGrowth.plus(C);
    } else {
      const afterContribution = startingBalance.plus(C);
      endingBalance = afterContribution.times(onePlusI);
      interestThisMonth = endingBalance.minus(afterContribution);
    }

    totalContributions = totalContributions.plus(C);
    schedule.push({
      month: m,
      startingBalance: startingBalance.toString(),
      contribution: C.toString(),
      interest: interestThisMonth.toString(),
      endingBalance: endingBalance.toString(),
    });

    balance = endingBalance;
  }

  const finalBalance = balance;
  const totalInterest = finalBalance.minus(P).minus(totalContributions);

  return {
    initialBalance: P.toString(),
    finalBalance: finalBalance.toString(),
    totalContributions: totalContributions.toString(),
    totalInterest: totalInterest.toString(),
    schedule,
  };
}
