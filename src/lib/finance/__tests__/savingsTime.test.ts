import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateSavingsTime } from "../savingsTime";
import { SAVINGS_TIME_LIMITS } from "../limits";
import type { SavingsTimeInput } from "../types";

// See savingsGoal.test.ts for why reconciliation checks need this instead
// of the default 20-digit-precision Decimal import.
const CheckDecimal = Decimal.clone({ precision: 50 });

/**
 * Expected values below were derived independently of the implementation
 * under test, using a separate plain-double-precision month-by-month
 * simulation script, not by calling `calculateSavingsTime`. See the
 * completion report for the exact script.
 */

describe("calculateSavingsTime — required fixtures", () => {
  it("target already reached at the starting balance: 0 months", () => {
    const result = calculateSavingsTime({
      startingBalance: 1000,
      targetBalance: 500,
      monthlyContribution: 100,
      rateMode: "nominal",
      ratePercent: 12,
      timing: "end",
    });
    expect(result.reason).toBe("already-reached");
    expect(result.monthsToReach).toBe(0);
  });

  it("zero interest, positive monthly contribution: $0 start, $100/month, 0% rate, $1,200 target => 12 months", () => {
    const result = calculateSavingsTime({
      startingBalance: 0,
      targetBalance: 1200,
      monthlyContribution: 100,
      rateMode: "nominal",
      ratePercent: 0,
      timing: "end",
    });
    expect(result.reason).toBe("reached");
    expect(result.monthsToReach).toBe(12);
    expect(result.finalBalance).toBe("1200");
  });

  it("not reachable: no contribution and an explicit 0% rate never move the balance", () => {
    const result = calculateSavingsTime({
      startingBalance: 100,
      targetBalance: 200,
      monthlyContribution: 0,
      rateMode: "nominal",
      ratePercent: 0,
      timing: "end",
    });
    expect(result.reason).toBe("not-reached");
    expect(result.monthsToReach).toBeNull();
  });

  it("known timing difference: beginning of each month reaches the target one month before end of each month", () => {
    // $0 start, $100/month, 12% nominal, $1,050 target. Independently
    // simulated: end-of-month balance passes $1,050 at month 11
    // ($1,046.22 at month 10, $1,380.93 at month 11 - crosses at 11);
    // beginning-of-month passes it at month 10 ($1,056.68).
    const base: Omit<SavingsTimeInput, "timing"> = {
      startingBalance: 0,
      targetBalance: 1050,
      monthlyContribution: 100,
      rateMode: "nominal",
      ratePercent: 12,
    };
    const end = calculateSavingsTime({ ...base, timing: "end" });
    const begin = calculateSavingsTime({ ...base, timing: "begin" });
    expect(begin.monthsToReach).toBe(10);
    expect(end.monthsToReach).toBe(11);
    expect(begin.monthsToReach).toBeLessThan(end.monthsToReach as number);
  });

  it("maximum horizon case: a target that cannot be reached within the documented maximum reports exceeds-max, not an invented date", () => {
    const result = calculateSavingsTime({
      startingBalance: 0,
      targetBalance: 100_000_000,
      monthlyContribution: 1,
      rateMode: "nominal",
      ratePercent: 0,
      timing: "end",
    });
    expect(result.reason).toBe("exceeds-max");
    expect(result.monthsToReach).toBeNull();
    expect(result.maxMonths).toBe(SAVINGS_TIME_LIMITS.maxMonths);
    expect(result.schedule).toHaveLength(SAVINGS_TIME_LIMITS.maxMonths);
  });
});

describe("calculateSavingsTime — validation and identities", () => {
  it("throws for a non-positive target balance", () => {
    expect(() =>
      calculateSavingsTime({
        startingBalance: 0,
        targetBalance: 0,
        monthlyContribution: 100,
        rateMode: "nominal",
        ratePercent: 5,
        timing: "end",
      }),
    ).toThrow(RangeError);
  });

  it("throws for negative inputs", () => {
    const base: SavingsTimeInput = {
      startingBalance: 0,
      targetBalance: 1000,
      monthlyContribution: 100,
      rateMode: "nominal",
      ratePercent: 5,
      timing: "end",
    };
    expect(() => calculateSavingsTime({ ...base, monthlyContribution: -1 })).toThrow(RangeError);
    expect(() => calculateSavingsTime({ ...base, ratePercent: -1 })).toThrow(RangeError);
  });

  it("reconciles startingBalance + totalContributions + totalInterest to finalBalance when reached", () => {
    const result = calculateSavingsTime({
      startingBalance: 500,
      targetBalance: 5000,
      monthlyContribution: 200,
      rateMode: "nominal",
      ratePercent: 8,
      timing: "end",
    });
    const sum = new CheckDecimal(result.startingBalance)
      .plus(result.totalContributions)
      .plus(result.totalInterest);
    expect(sum.toString()).toBe(new CheckDecimal(result.finalBalance).toString());
  });
});
