import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateSavingsScenarios } from "../savingsScenarios";
import type { SavingsScenarioBranchInput, SavingsScenariosInput } from "../types";

const CheckDecimal = Decimal.clone({ precision: 50 });

const ZERO_BRANCH: SavingsScenarioBranchInput = { ratePercent: 0, monthlyContribution: 0, monthlyFee: 0 };

function buildInput(overrides: Partial<SavingsScenariosInput>, branch: SavingsScenarioBranchInput): SavingsScenariosInput {
  return {
    startingBalance: 0,
    months: 12,
    timing: "end",
    inflationRatePercent: 0,
    scenarios: [branch, ZERO_BRANCH, ZERO_BRANCH],
    ...overrides,
  };
}

/**
 * Expected values below were derived independently of the implementation
 * under test (plain arithmetic worked out by hand / with Math.pow, not by
 * calling `calculateSavingsScenarios`):
 *
 *   End of each month:       preFee = starting * (1 + i) + contribution
 *   Beginning of each month: preFee = (starting + contribution) * (1 + i)
 *   endingBalance = max(0, preFee - fee)
 *   buyingPower = finalBalance / (1 + inflation/100) ^ (months/12)
 */
describe("calculateSavingsScenarios — required fixtures", () => {
  it("zero rate, zero fee: $0 starting, $100/month, 12 months: final balance is exactly $1,200.00, buying power equals it", () => {
    const result = calculateSavingsScenarios(
      buildInput({ startingBalance: 0 }, { ratePercent: 0, monthlyContribution: 100, monthlyFee: 0 }),
    );
    const scenario = result.scenarios[0];
    expect(scenario.finalBalance).toBe("1200");
    expect(scenario.buyingPowerToday).toBe("1200");
    expect(scenario.totalContributions).toBe("1200");
    expect(scenario.totalInterest).toBe("0");
    expect(scenario.totalFeesDeducted).toBe("0");
  });

  it("fee case: $1,000 starting, 0% rate, no contribution, $10 monthly fee, 12 months: final balance is exactly $880.00, actual fees deducted are exactly $120.00", () => {
    const result = calculateSavingsScenarios(
      buildInput({ startingBalance: 1000 }, { ratePercent: 0, monthlyContribution: 0, monthlyFee: 10 }),
    );
    const scenario = result.scenarios[0];
    expect(scenario.finalBalance).toBe("880");
    expect(scenario.totalFeesDeducted).toBe("120");
  });

  it("inflation case: a $1,000 final balance after 12 months with 10% annual inflation has a buying power of 909.0909... before display rounding, $909.09 when formatted", () => {
    const result = calculateSavingsScenarios(
      buildInput(
        { startingBalance: 1000, inflationRatePercent: 10 },
        { ratePercent: 0, monthlyContribution: 0, monthlyFee: 0 },
      ),
    );
    const scenario = result.scenarios[0];
    expect(scenario.finalBalance).toBe("1000");
    const buyingPower = new CheckDecimal(scenario.buyingPowerToday);
    const expected = new CheckDecimal(1000).div(1.1);
    expect(buyingPower.minus(expected).abs().lessThan("1e-8")).toBe(true);
    expect(buyingPower.toFixed(2, Decimal.ROUND_HALF_UP)).toBe("909.09");
  });

  it("timing comparison: with the same positive rate and contribution, beginning of each month produces a final balance at least as large as end of each month", () => {
    const branch: SavingsScenarioBranchInput = { ratePercent: 6, monthlyContribution: 100, monthlyFee: 0 };
    const endResult = calculateSavingsScenarios(buildInput({ startingBalance: 1000, timing: "end" }, branch));
    const beginResult = calculateSavingsScenarios(buildInput({ startingBalance: 1000, timing: "begin" }, branch));
    const endFinal = new CheckDecimal(endResult.scenarios[0].finalBalance);
    const beginFinal = new CheckDecimal(beginResult.scenarios[0].finalBalance);
    expect(beginFinal.gte(endFinal)).toBe(true);
  });

  it("fee cap case: $5 starting, 0% rate, no contribution, $10 monthly fee, one month: final balance is $0.00, actual fee deducted is $5.00 (not $10.00), and the balance never goes negative", () => {
    const result = calculateSavingsScenarios(
      buildInput(
        { startingBalance: 5, months: 1 },
        { ratePercent: 0, monthlyContribution: 0, monthlyFee: 10 },
      ),
    );
    const scenario = result.scenarios[0];
    expect(scenario.finalBalance).toBe("0");
    expect(scenario.totalFeesDeducted).toBe("5");
    for (const row of scenario.schedule) {
      expect(Number(row.endingBalance)).toBeGreaterThanOrEqual(0);
    }
  });

  it("fee cap continues to hold across multiple months once the balance reaches zero", () => {
    const result = calculateSavingsScenarios(
      buildInput(
        { startingBalance: 5, months: 6 },
        { ratePercent: 0, monthlyContribution: 0, monthlyFee: 10 },
      ),
    );
    const scenario = result.scenarios[0];
    expect(scenario.finalBalance).toBe("0");
    expect(scenario.totalFeesDeducted).toBe("5");
    for (const row of scenario.schedule) {
      expect(Number(row.endingBalance)).toBeGreaterThanOrEqual(0);
      expect(Number(row.feeDeducted)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("calculateSavingsScenarios — reconciliation", () => {
  it("startingBalance + totalContributions + totalInterest - totalFeesDeducted equals finalBalance", () => {
    const result = calculateSavingsScenarios(
      buildInput(
        { startingBalance: 2500 },
        { ratePercent: 7.25, monthlyContribution: 150, monthlyFee: 3 },
      ),
    );
    const scenario = result.scenarios[0];
    const reconciled = new CheckDecimal(scenario.startingBalance)
      .plus(scenario.totalContributions)
      .plus(scenario.totalInterest)
      .minus(scenario.totalFeesDeducted);
    const diff = reconciled.minus(scenario.finalBalance).abs();
    // A non-terminating monthly rate (7.25%) can leave a tiny (financially
    // immaterial) precision residue through the multiply/pow chain at 40
    // significant digits, the same class of artifact documented in
    // loanPayment.test.ts; 1e-10 is a comfortable margin above it.
    expect(diff.lessThan("1e-10")).toBe(true);
  });

  it("three independent scenarios each reconcile on their own; scenarios do not affect one another", () => {
    const result = calculateSavingsScenarios({
      startingBalance: 1000,
      months: 120,
      timing: "end",
      inflationRatePercent: 3,
      scenarios: [
        { ratePercent: 4, monthlyContribution: 100, monthlyFee: 0 },
        { ratePercent: 6, monthlyContribution: 125, monthlyFee: 5 },
        { ratePercent: 8, monthlyContribution: 150, monthlyFee: 10 },
      ],
    });
    for (const scenario of result.scenarios) {
      const reconciled = new CheckDecimal(scenario.startingBalance)
        .plus(scenario.totalContributions)
        .plus(scenario.totalInterest)
        .minus(scenario.totalFeesDeducted);
      expect(reconciled.minus(scenario.finalBalance).abs().lessThan("1e-8")).toBe(true);
    }
    // Higher rate and contribution (scenario C) with a positive fee still
    // outpaces the lower-rate, no-fee scenario A over 10 years.
    expect(Number(result.scenarios[2].finalBalance)).toBeGreaterThan(Number(result.scenarios[0].finalBalance));
  });

  it("the schedule has exactly `months` rows for every scenario", () => {
    const result = calculateSavingsScenarios(
      buildInput({ months: 36 }, { ratePercent: 5, monthlyContribution: 50, monthlyFee: 1 }),
    );
    for (const scenario of result.scenarios) {
      expect(scenario.schedule).toHaveLength(36);
    }
  });

  it("no row in any scenario ever has a negative ending balance, including at the documented limits", () => {
    const result = calculateSavingsScenarios({
      startingBalance: 10_000_000,
      months: 600,
      timing: "end",
      inflationRatePercent: 100,
      scenarios: [
        { ratePercent: 100, monthlyContribution: 1_000_000, monthlyFee: 1_000_000 },
        { ratePercent: 0, monthlyContribution: 0, monthlyFee: 1_000_000 },
        { ratePercent: 0, monthlyContribution: 0, monthlyFee: 0 },
      ],
    });
    for (const scenario of result.scenarios) {
      for (const row of scenario.schedule) {
        expect(Number(row.endingBalance)).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("calculateSavingsScenarios — validation", () => {
  it("throws for a non-positive duration", () => {
    expect(() => calculateSavingsScenarios(buildInput({ months: 0 }, ZERO_BRANCH))).toThrow(RangeError);
    expect(() => calculateSavingsScenarios(buildInput({ months: -1 }, ZERO_BRANCH))).toThrow(RangeError);
  });

  it("throws for a negative starting balance", () => {
    expect(() => calculateSavingsScenarios(buildInput({ startingBalance: -1 }, ZERO_BRANCH))).toThrow(RangeError);
  });

  it("throws for a negative inflation rate", () => {
    expect(() => calculateSavingsScenarios(buildInput({ inflationRatePercent: -1 }, ZERO_BRANCH))).toThrow(RangeError);
  });

  it("throws for a negative rate, contribution or fee in any branch", () => {
    expect(() =>
      calculateSavingsScenarios(buildInput({}, { ratePercent: -1, monthlyContribution: 0, monthlyFee: 0 })),
    ).toThrow(RangeError);
    expect(() =>
      calculateSavingsScenarios(buildInput({}, { ratePercent: 0, monthlyContribution: -1, monthlyFee: 0 })),
    ).toThrow(RangeError);
    expect(() =>
      calculateSavingsScenarios(buildInput({}, { ratePercent: 0, monthlyContribution: 0, monthlyFee: -1 })),
    ).toThrow(RangeError);
  });
});
