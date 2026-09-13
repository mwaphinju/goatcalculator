import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateSavingsGoal } from "../savingsGoal";
import type { SavingsGoalInput } from "../types";

// The engine internally uses 40-digit precision. The default global
// Decimal has only 20-digit precision, which would truncate the sum below
// and produce false negatives, so reconciliation checks use a matching
// precision instead of the default import.
const CheckDecimal = Decimal.clone({ precision: 50 });

/**
 * Expected values below were derived independently of the implementation
 * under test, using a separate plain-double-precision reference script
 * (closed-form annuity inverse), not by calling `calculateSavingsGoal`.
 * See the completion report for the exact script.
 */

function closeTo(actual: string | null, expected: number, epsilon = 1e-6) {
  expect(actual).not.toBeNull();
  expect(Math.abs(Number(actual) - expected)).toBeLessThan(epsilon);
}

describe("calculateSavingsGoal — required fixtures", () => {
  it("target already reached (starting balance >= target) requires $0 per month", () => {
    const result = calculateSavingsGoal({
      startingBalance: 1000,
      targetBalance: 1000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 5,
      timing: "end",
    });
    expect(result.reason).toBe("already-met");
    expect(result.requiredMonthlyContribution).toBe("0");
  });

  it("starting balance exceeding target also requires $0 per month", () => {
    const result = calculateSavingsGoal({
      startingBalance: 5000,
      targetBalance: 1000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 5,
      timing: "end",
    });
    expect(result.reason).toBe("already-met");
    expect(result.requiredMonthlyContribution).toBe("0");
  });

  it("interest alone reaches the target: requires $0 per month", () => {
    // Independently verified: 5000 * (1.01)^12 = 5634.13, which already
    // exceeds a 5300 target with zero contributions.
    const result = calculateSavingsGoal({
      startingBalance: 5000,
      targetBalance: 5300,
      months: 12,
      rateMode: "nominal",
      ratePercent: 12,
      timing: "end",
    });
    expect(result.reason).toBe("interest-alone");
    expect(result.requiredMonthlyContribution).toBe("0");
    expect(Number(result.finalBalance)).toBeGreaterThanOrEqual(5300);
  });

  it("normal case, 0% rate: $0 start, $10,000 target, 12 months => $833.33/month", () => {
    const result = calculateSavingsGoal({
      startingBalance: 0,
      targetBalance: 10000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 0,
      timing: "end",
    });
    expect(result.reason).toBe("normal");
    closeTo(result.requiredMonthlyContribution, 833.3333333333334, 1e-6);
  });

  it("normal case, 12% nominal rate, end of each month: $1,000 start, $5,000 target, 12 months", () => {
    const result = calculateSavingsGoal({
      startingBalance: 1000,
      targetBalance: 5000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 12,
      timing: "end",
    });
    expect(result.reason).toBe("normal");
    closeTo(result.requiredMonthlyContribution, 305.39515471336676, 1e-6);
  });

  it("same scenario with beginning of each month requires a smaller contribution", () => {
    const result = calculateSavingsGoal({
      startingBalance: 1000,
      targetBalance: 5000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 12,
      timing: "begin",
    });
    expect(result.reason).toBe("normal");
    closeTo(result.requiredMonthlyContribution, 302.3714403102641, 1e-6);
  });

  it("zero duration while target exceeds starting balance is impossible", () => {
    const result = calculateSavingsGoal({
      startingBalance: 0,
      targetBalance: 1000,
      months: 0,
      rateMode: "nominal",
      ratePercent: 5,
      timing: "end",
    });
    expect(result.reason).toBe("impossible-zero-duration");
    expect(result.requiredMonthlyContribution).toBeNull();
  });

  it("zero duration with target already met at the starting balance is fine (not impossible)", () => {
    const result = calculateSavingsGoal({
      startingBalance: 1000,
      targetBalance: 1000,
      months: 0,
      rateMode: "nominal",
      ratePercent: 5,
      timing: "end",
    });
    expect(result.reason).toBe("already-met");
  });
});

describe("calculateSavingsGoal — APY vs nominal conversion", () => {
  it("APY mode produces a different required contribution than an equal-percent nominal rate", () => {
    const base: Omit<SavingsGoalInput, "rateMode"> = {
      startingBalance: 1000,
      targetBalance: 5000,
      months: 12,
      ratePercent: 12,
      timing: "end",
    };
    const nominal = calculateSavingsGoal({ ...base, rateMode: "nominal" });
    const apy = calculateSavingsGoal({ ...base, rateMode: "apy" });
    expect(nominal.requiredMonthlyContribution).not.toBe(apy.requiredMonthlyContribution);
  });
});

describe("calculateSavingsGoal — validation and identities", () => {
  it("throws for a non-positive target balance", () => {
    expect(() =>
      calculateSavingsGoal({
        startingBalance: 0,
        targetBalance: 0,
        months: 12,
        rateMode: "nominal",
        ratePercent: 5,
        timing: "end",
      }),
    ).toThrow(RangeError);
  });

  it("throws for negative inputs", () => {
    const base: SavingsGoalInput = {
      startingBalance: 0,
      targetBalance: 1000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 5,
      timing: "end",
    };
    expect(() => calculateSavingsGoal({ ...base, startingBalance: -1 })).toThrow(RangeError);
    expect(() => calculateSavingsGoal({ ...base, ratePercent: -1 })).toThrow(RangeError);
  });

  it("never returns Infinity, NaN, or a negative required contribution", () => {
    const cases: SavingsGoalInput[] = [
      { startingBalance: 0, targetBalance: 1, months: 1, rateMode: "nominal", ratePercent: 0, timing: "end" },
      { startingBalance: 0, targetBalance: 100_000_000, months: 600, rateMode: "nominal", ratePercent: 100, timing: "begin" },
      { startingBalance: 9_999_999, targetBalance: 10_000_000, months: 1, rateMode: "apy", ratePercent: 0.01, timing: "end" },
    ];
    for (const input of cases) {
      const result = calculateSavingsGoal(input);
      if (result.requiredMonthlyContribution !== null) {
        const value = Number(result.requiredMonthlyContribution);
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("the confirmation schedule's final balance reaches at least the target for the normal case", () => {
    const result = calculateSavingsGoal({
      startingBalance: 1000,
      targetBalance: 5000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 12,
      timing: "end",
    });
    expect(new Decimal(result.finalBalance).toNumber()).toBeGreaterThanOrEqual(4999.99);
  });

  it("initialBalance + totalContributions + totalInterest reconciles to finalBalance", () => {
    const result = calculateSavingsGoal({
      startingBalance: 1000,
      targetBalance: 5000,
      months: 12,
      rateMode: "nominal",
      ratePercent: 12,
      timing: "end",
    });
    const sum = new CheckDecimal(result.startingBalance)
      .plus(result.totalContributions)
      .plus(result.totalInterest);
    expect(sum.toString()).toBe(new CheckDecimal(result.finalBalance).toString());
  });
});
