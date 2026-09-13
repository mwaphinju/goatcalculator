import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateCompoundInterest } from "../compoundInterest";
import type { CompoundInterestInput } from "../types";

// The engine internally uses 40-digit precision (see compoundInterest.ts).
// The default global Decimal has only 20-digit precision, which would
// truncate the sum below and produce false negatives — so the invariant
// check below uses a matching precision instead of the default import.
const CheckDecimal = Decimal.clone({ precision: 50 });

/**
 * Expected values below were derived independently of the implementation
 * under test, using a separate plain-double-precision reference formula
 * (see docs/PROJECT_STATE.md for the derivation script). They are not
 * produced by calling `calculateCompoundInterest`.
 *
 * End-of-month step:      B_next = B * (1 + i) + C
 * Beginning-of-month step: B_next = (B + C) * (1 + i)
 * i = (annualRatePercent / 100) / 12
 */

function closeTo(actual: string, expected: number, epsilon = 1e-6) {
  expect(Math.abs(Number(actual) - expected)).toBeLessThan(epsilon);
}

describe("calculateCompoundInterest — required fixtures", () => {
  it("A: $1,000 @ 12% nominal, 12 months, no contributions, end-of-month", () => {
    const input: CompoundInterestInput = {
      initialBalance: 1000,
      annualRatePercent: 12,
      months: 12,
      monthlyContribution: 0,
      timing: "end",
    };
    const result = calculateCompoundInterest(input);
    closeTo(result.finalBalance, 1126.82503013197, 1e-8);
  });

  it("B: $1,000 @ 12% nominal, 12 months, $100/month end-of-month contributions", () => {
    const input: CompoundInterestInput = {
      initialBalance: 1000,
      annualRatePercent: 12,
      months: 12,
      monthlyContribution: 100,
      timing: "end",
    };
    const result = calculateCompoundInterest(input);
    closeTo(result.finalBalance, 2395.07533145167, 1e-8);
  });

  it("C: $1,000 initial, $100/month, 0% interest, 12 months => exactly $2,200", () => {
    const input: CompoundInterestInput = {
      initialBalance: 1000,
      annualRatePercent: 0,
      months: 12,
      monthlyContribution: 100,
      timing: "end",
    };
    const result = calculateCompoundInterest(input);
    expect(result.finalBalance).toBe("2200");
    expect(result.totalContributions).toBe("1200");
    expect(result.totalInterest).toBe("0");
  });

  it("D: zero duration returns the initial balance with zero contributions and zero interest", () => {
    const input: CompoundInterestInput = {
      initialBalance: 1000,
      annualRatePercent: 12,
      months: 0,
      monthlyContribution: 100,
      timing: "end",
    };
    const result = calculateCompoundInterest(input);
    expect(result.finalBalance).toBe("1000");
    expect(result.totalContributions).toBe("0");
    expect(result.totalInterest).toBe("0");
    expect(result.schedule).toHaveLength(0);
  });
});

describe("calculateCompoundInterest — independently derived beginning-of-month and edge-case fixtures", () => {
  it("$1,000 @ 12% nominal, 12 months, $100/month beginning-of-month contributions", () => {
    const input: CompoundInterestInput = {
      initialBalance: 1000,
      annualRatePercent: 12,
      months: 12,
      monthlyContribution: 100,
      timing: "begin",
    };
    const result = calculateCompoundInterest(input);
    closeTo(result.finalBalance, 2407.7578344648637, 1e-6);
  });

  it("$1,000 @ 6% nominal, 6 months, $50/month beginning-of-month contributions", () => {
    const input: CompoundInterestInput = {
      initialBalance: 1000,
      annualRatePercent: 6,
      months: 6,
      monthlyContribution: 50,
      timing: "begin",
    };
    const result = calculateCompoundInterest(input);
    closeTo(result.finalBalance, 1335.6714788011095, 1e-6);
  });

  it("$500 @ 5% nominal, 24 months, $25/month end-of-month contributions", () => {
    const input: CompoundInterestInput = {
      initialBalance: 500,
      annualRatePercent: 5,
      months: 24,
      monthlyContribution: 25,
      timing: "end",
    };
    const result = calculateCompoundInterest(input);
    closeTo(result.finalBalance, 1182.1186811291268, 1e-6);
  });

  it("$0 initial @ 10% nominal, 3 months, $200/month beginning-of-month contributions", () => {
    const input: CompoundInterestInput = {
      initialBalance: 0,
      annualRatePercent: 10,
      months: 3,
      monthlyContribution: 200,
      timing: "begin",
    };
    const result = calculateCompoundInterest(input);
    closeTo(result.finalBalance, 610.0556712962963, 1e-6);
  });

  it("beginning-of-month produces at least as much interest as end-of-month, all else equal", () => {
    const base = {
      initialBalance: 1000,
      annualRatePercent: 12,
      months: 12,
      monthlyContribution: 100,
    };
    const end = calculateCompoundInterest({ ...base, timing: "end" });
    const begin = calculateCompoundInterest({ ...base, timing: "begin" });
    expect(Number(begin.finalBalance)).toBeGreaterThan(Number(end.finalBalance));
  });

  it("zero balance, zero rate, zero contribution stays at zero for any duration", () => {
    const result = calculateCompoundInterest({
      initialBalance: 0,
      annualRatePercent: 0,
      months: 24,
      monthlyContribution: 0,
      timing: "end",
    });
    expect(result.finalBalance).toBe("0");
    expect(result.totalInterest).toBe("0");
    expect(result.totalContributions).toBe("0");
  });

  it("zero rate with contributions: balance grows linearly by exactly the contribution amount", () => {
    const result = calculateCompoundInterest({
      initialBalance: 250,
      annualRatePercent: 0,
      months: 5,
      monthlyContribution: 40,
      timing: "begin",
    });
    expect(result.finalBalance).toBe("450");
    expect(result.totalContributions).toBe("200");
    expect(result.totalInterest).toBe("0");
  });
});

describe("calculateCompoundInterest — internal consistency invariant", () => {
  const cases: CompoundInterestInput[] = [
    { initialBalance: 1000, annualRatePercent: 12, months: 12, monthlyContribution: 100, timing: "end" },
    { initialBalance: 1000, annualRatePercent: 12, months: 12, monthlyContribution: 100, timing: "begin" },
    { initialBalance: 0, annualRatePercent: 7.25, months: 360, monthlyContribution: 250, timing: "end" },
    { initialBalance: 10_000_000, annualRatePercent: 100, months: 600, monthlyContribution: 1_000_000, timing: "begin" },
    { initialBalance: 0, annualRatePercent: 0, months: 0, monthlyContribution: 0, timing: "end" },
  ];

  it.each(cases)(
    "initialBalance + totalContributions + totalInterest === finalBalance (%j)",
    (input) => {
      const result = calculateCompoundInterest(input);
      const sum = new CheckDecimal(result.initialBalance)
        .plus(result.totalContributions)
        .plus(result.totalInterest);
      expect(sum.toString()).toBe(new CheckDecimal(result.finalBalance).toString());
    },
  );

  it("throws on negative months", () => {
    expect(() =>
      calculateCompoundInterest({
        initialBalance: 0,
        annualRatePercent: 0,
        months: -1,
        monthlyContribution: 0,
        timing: "end",
      }),
    ).toThrow(RangeError);
  });

  it("throws on negative initialBalance, monthlyContribution or annualRatePercent", () => {
    const base: CompoundInterestInput = {
      initialBalance: 0,
      annualRatePercent: 0,
      months: 1,
      monthlyContribution: 0,
      timing: "end",
    };
    expect(() => calculateCompoundInterest({ ...base, initialBalance: -1 })).toThrow(RangeError);
    expect(() => calculateCompoundInterest({ ...base, monthlyContribution: -1 })).toThrow(RangeError);
    expect(() => calculateCompoundInterest({ ...base, annualRatePercent: -1 })).toThrow(RangeError);
  });

  it("stays finite and does not throw at the documented upper limits", () => {
    const result = calculateCompoundInterest({
      initialBalance: 10_000_000,
      annualRatePercent: 100,
      months: 600,
      monthlyContribution: 1_000_000,
      timing: "begin",
    });
    expect(Number.isFinite(Number(result.finalBalance))).toBe(true);
    expect(result.schedule).toHaveLength(600);
  });
});
