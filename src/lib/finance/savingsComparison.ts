import Decimal from "decimal.js";
import { runScenario } from "./scenario";
import type { ScenarioInput, ComparisonResult } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Runs a baseline and an alternative scenario through the shared
 * projection engine (via `runScenario`) and reports the differences
 * between them. Deliberately does not judge one scenario as "better" —
 * that framing depends on assumptions this calculator has no way to know
 * (how achievable a higher contribution actually is, whether a higher rate
 * is realistic), so it only reports the numeric differences.
 */
export function compareSavingsScenarios(
  baselineInput: ScenarioInput,
  alternativeInput: ScenarioInput,
): ComparisonResult {
  const baseline = runScenario(baselineInput);
  const alternative = runScenario(alternativeInput);

  const finalBalanceDifference = new D(alternative.finalBalance).minus(baseline.finalBalance);
  const totalContributionsDifference = new D(alternative.totalContributions).minus(
    baseline.totalContributions,
  );
  const totalInterestDifference = new D(alternative.totalInterest).minus(baseline.totalInterest);

  return {
    baseline,
    alternative,
    finalBalanceDifference: finalBalanceDifference.toString(),
    totalContributionsDifference: totalContributionsDifference.toString(),
    totalInterestDifference: totalInterestDifference.toString(),
  };
}
