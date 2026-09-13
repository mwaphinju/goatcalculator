import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { compareSavingsScenarios } from "../savingsComparison";
import type { ScenarioInput } from "../types";

// See savingsGoal.test.ts for why reconciliation checks need this instead
// of the default 20-digit-precision Decimal import.
const CheckDecimal = Decimal.clone({ precision: 50 });

const baseScenario: ScenarioInput = {
  startingBalance: 1000,
  monthlyContribution: 100,
  rateMode: "nominal",
  ratePercent: 12,
  months: 12,
  timing: "end",
};

describe("compareSavingsScenarios", () => {
  it("identical scenarios produce zero differences in every figure", () => {
    const result = compareSavingsScenarios(baseScenario, { ...baseScenario });
    expect(result.finalBalanceDifference).toBe("0");
    expect(result.totalContributionsDifference).toBe("0");
    expect(result.totalInterestDifference).toBe("0");
  });

  it("a higher alternative contribution increases the final balance and the contributions difference", () => {
    const alternative: ScenarioInput = { ...baseScenario, monthlyContribution: 200 };
    const result = compareSavingsScenarios(baseScenario, alternative);
    expect(Number(result.finalBalanceDifference)).toBeGreaterThan(0);
    // Independently: 12 months of an extra $100/month is exactly $1,200
    // more contributed, regardless of rate.
    expect(result.totalContributionsDifference).toBe("1200");
  });

  it("a higher alternative rate increases the final balance in the expected direction", () => {
    const alternative: ScenarioInput = { ...baseScenario, ratePercent: 24 };
    const result = compareSavingsScenarios(baseScenario, alternative);
    expect(Number(result.finalBalanceDifference)).toBeGreaterThan(0);
    expect(Number(result.totalInterestDifference)).toBeGreaterThan(0);
    // Contribution amounts are identical, so this difference is 0.
    expect(result.totalContributionsDifference).toBe("0");
  });

  it("a lower alternative contribution decreases the final balance", () => {
    const alternative: ScenarioInput = { ...baseScenario, monthlyContribution: 50 };
    const result = compareSavingsScenarios(baseScenario, alternative);
    expect(Number(result.finalBalanceDifference)).toBeLessThan(0);
  });

  it("each scenario's own schedule reconciles to its own final balance", () => {
    const alternative: ScenarioInput = { ...baseScenario, ratePercent: 8, monthlyContribution: 150 };
    const result = compareSavingsScenarios(baseScenario, alternative);
    for (const scenario of [result.baseline, result.alternative]) {
      const sum = new CheckDecimal(scenario.startingBalance)
        .plus(scenario.totalContributions)
        .plus(scenario.totalInterest);
      expect(sum.toString()).toBe(new CheckDecimal(scenario.finalBalance).toString());

      if (scenario.schedule.length > 0) {
        const lastRow = scenario.schedule[scenario.schedule.length - 1];
        expect(lastRow.endingBalance).toBe(scenario.finalBalance);
      }
    }
  });
});
