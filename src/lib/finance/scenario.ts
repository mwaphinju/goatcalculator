import Decimal from "decimal.js";
import { resolveMonthlyRate } from "./rate";
import { projectBalance } from "./projection";
import type { ScenarioInput, ScenarioResult } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Runs a single fixed-duration savings scenario (starting balance, monthly
 * contribution, a rate expressed as either a nominal annual rate or an
 * APY, a duration, and contribution timing) through the shared projection
 * engine. Used directly by the savings comparison calculator, and to build
 * the confirmation schedule for a solved savings goal.
 */
export function runScenario(input: ScenarioInput): ScenarioResult {
  const { months, timing, rateMode, ratePercent } = input;

  if (!Number.isInteger(months) || months < 0) {
    throw new RangeError("months must be a non-negative integer");
  }
  if (input.startingBalance < 0 || input.monthlyContribution < 0 || ratePercent < 0) {
    throw new RangeError(
      "startingBalance, monthlyContribution and ratePercent must be non-negative",
    );
  }

  const P = new D(input.startingBalance);
  const C = new D(input.monthlyContribution);
  const monthlyRate = resolveMonthlyRate(rateMode, ratePercent);

  const { finalBalance, totalContributions, schedule } = projectBalance(
    P,
    monthlyRate,
    months,
    C,
    timing,
  );

  const totalInterest = finalBalance.minus(P).minus(totalContributions);

  return {
    startingBalance: P.toString(),
    finalBalance: finalBalance.toString(),
    totalContributions: totalContributions.toString(),
    totalInterest: totalInterest.toString(),
    schedule,
  };
}
