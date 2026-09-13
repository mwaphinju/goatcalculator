import Decimal from "decimal.js";
import { monthlyRateFromNominal } from "./rate";
import { projectBalance } from "./projection";
import type { CompoundInterestInput, CompoundInterestResult } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Monthly-compounding savings projection.
 *
 * Model (monthly compounding only):
 *   i = (annualRatePercent / 100) / 12
 *   End of each month:       B_next = B * (1 + i) + C
 *   Beginning of each month: B_next = (B + C) * (1 + i)
 *
 * The per-month step and schedule-building loop live in projection.ts and
 * are shared with the savings goal, savings time, and savings comparison
 * calculators — this function only resolves the nominal rate to a monthly
 * rate and reports the result in the shape Phase 1 established.
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
  const monthlyRate = monthlyRateFromNominal(annualRatePercent);

  const { finalBalance, totalContributions, schedule } = projectBalance(
    P,
    monthlyRate,
    months,
    C,
    timing,
  );

  const totalInterest = finalBalance.minus(P).minus(totalContributions);

  return {
    initialBalance: P.toString(),
    finalBalance: finalBalance.toString(),
    totalContributions: totalContributions.toString(),
    totalInterest: totalInterest.toString(),
    schedule,
  };
}
