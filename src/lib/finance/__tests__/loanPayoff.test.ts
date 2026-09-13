import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateLoanPayoff } from "../loanPayoff";
import type { LoanPayoffInput } from "../types";

/**
 * Expected values below were derived independently of the implementation
 * under test, using a separate plain-double-precision month-by-month
 * simulation script, not by calling `calculateLoanPayoff`. See the
 * completion report for the exact script and its console output.
 */

const CheckDecimal = Decimal.clone({ precision: 50 });

const base: LoanPayoffInput = {
  currentBalance: 10000,
  annualRatePercent: 6,
  requiredMonthlyPayment: 200,
  extraMonthlyPayment: 0,
  oneTimeExtraPayment: 0,
  oneTimeExtraMonth: 1,
};

describe("calculateLoanPayoff — required fixtures", () => {
  it("zero extras: the extra-payment scenario exactly matches the baseline", () => {
    const result = calculateLoanPayoff(base);
    expect(result.withExtra).toEqual(result.baseline);
    expect(result.monthsSaved).toBe(0);
    expect(result.interestSaved).toBe("0");
  });

  it("baseline $10,000 @ 6%, $200/month required: pays off in 58 months", () => {
    const result = calculateLoanPayoff(base);
    expect(result.baseline.reason).toBe("amortizing");
    expect(result.baseline.monthsToPayoff).toBe(58);
    expect(Math.abs(Number(result.baseline.totalInterest) - 1536.13566349399)).toBeLessThan(1e-4);
  });

  it("a recurring extra monthly payment reduces payoff duration and total interest", () => {
    const result = calculateLoanPayoff({ ...base, extraMonthlyPayment: 50 });
    expect(result.withExtra.reason).toBe("amortizing");
    expect(result.withExtra.monthsToPayoff).toBe(45);
    expect(Math.abs(Number(result.withExtra.totalInterest) - 1185.1671692126708)).toBeLessThan(1e-4);
    expect(result.monthsSaved).toBe(13);
    expect(Number(result.interestSaved)).toBeGreaterThan(0);
  });

  it("a one-time extra payment applies in the requested month", () => {
    const result = calculateLoanPayoff({ ...base, oneTimeExtraPayment: 1000, oneTimeExtraMonth: 6 });
    expect(result.withExtra.reason).toBe("amortizing");
    expect(result.withExtra.monthsToPayoff).toBe(52);
    expect(Math.abs(Number(result.withExtra.totalInterest) - 1259.4164632235552)).toBeLessThan(1e-4);
    expect(result.withExtra.unusedOneTimeExtra).toBe("0");
    // The month-6 row reflects the extra: its payment is well above the
    // required $200 (required + the full $1,000 one-time extra).
    const monthSixRow = result.withExtra.schedule.find((r) => r.month === 6);
    expect(monthSixRow).toBeDefined();
    expect(Number(monthSixRow?.payment)).toBeGreaterThan(1100);
  });

  it("an oversized one-time extra is capped at the amount owed, and the unused portion is reported", () => {
    const result = calculateLoanPayoff({ ...base, oneTimeExtraPayment: 50000, oneTimeExtraMonth: 1 });
    expect(result.withExtra.reason).toBe("amortizing");
    expect(result.withExtra.monthsToPayoff).toBe(1);
    expect(Math.abs(Number(result.withExtra.totalPaid) - 10050)).toBeLessThan(1e-6);
    expect(Math.abs(Number(result.withExtra.totalInterest) - 50)).toBeLessThan(1e-6);
    // Independently: requested 50000 + 200 required = 50200 against a
    // 10050 amount owed, so 50200 - 10050 = 40150 goes unused.
    expect(Math.abs(Number(result.withExtra.unusedOneTimeExtra) - 40150)).toBeLessThan(1e-6);
  });

  it("required payment below the first month's interest is non-amortizing, with no invented payoff date", () => {
    // $10,000 @ 12% => first month interest = $100; a $50 required payment cannot cover it.
    const result = calculateLoanPayoff({
      currentBalance: 10000,
      annualRatePercent: 12,
      requiredMonthlyPayment: 50,
      extraMonthlyPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraMonth: 1,
    });
    expect(result.baseline.reason).toBe("non-amortizing");
    expect(result.baseline.monthsToPayoff).toBeNull();
    expect(result.baseline.minimumPaymentToCoverInterest).toBe("100");
    expect(result.monthsSaved).toBeNull();
    expect(result.interestSaved).toBeNull();
  });

  it("zero interest payoff: balance divided evenly by the payment, no interest", () => {
    const result = calculateLoanPayoff({
      currentBalance: 1200,
      annualRatePercent: 0,
      requiredMonthlyPayment: 100,
      extraMonthlyPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraMonth: 1,
    });
    expect(result.baseline.reason).toBe("amortizing");
    expect(result.baseline.monthsToPayoff).toBe(12);
    expect(result.baseline.totalInterest).toBe("0");
    expect(result.baseline.totalPaid).toBe("1200");
  });

  it("maximum horizon: a technically-amortizing but very slow scenario reports exceeds-max, not an invented date", () => {
    // $1,000,000 @ 1%, monthly interest ~$833.33; a $840 required payment
    // covers interest by only $6.67/month, so principal reduction is
    // glacial and the loan does not clear within 1,200 months.
    const result = calculateLoanPayoff({
      currentBalance: 1_000_000,
      annualRatePercent: 1,
      requiredMonthlyPayment: 840,
      extraMonthlyPayment: 0,
      oneTimeExtraPayment: 0,
      oneTimeExtraMonth: 1,
    });
    expect(result.baseline.reason).toBe("exceeds-max");
    expect(result.baseline.monthsToPayoff).toBeNull();
    expect(result.baseline.maxMonths).toBe(1200);
  });
});

describe("calculateLoanPayoff — reconciliation and validation", () => {
  it("totalPaid equals currentBalance plus totalInterest for an amortizing scenario", () => {
    const result = calculateLoanPayoff(base);
    const sum = new CheckDecimal(10000).plus(result.baseline.totalInterest);
    expect(sum.toString()).toBe(new CheckDecimal(result.baseline.totalPaid).toString());
  });

  it("every schedule row's principal plus interest equals that row's payment", () => {
    // See the equivalent loanPayment.test.ts check for why this uses a
    // tiny epsilon (1e-10) rather than exact string equality.
    const result = calculateLoanPayoff({ ...base, extraMonthlyPayment: 50 });
    for (const row of result.withExtra.schedule) {
      const sum = new CheckDecimal(row.principal).plus(row.interest);
      const diff = sum.minus(row.payment).abs();
      expect(diff.lessThan("1e-10")).toBe(true);
    }
  });

  it("no schedule row ever has a negative ending balance", () => {
    const result = calculateLoanPayoff({ ...base, oneTimeExtraPayment: 50000, oneTimeExtraMonth: 1 });
    for (const row of result.withExtra.schedule) {
      expect(Number(row.endingBalance)).toBeGreaterThanOrEqual(0);
    }
  });

  it("throws for a non-positive current balance or required payment", () => {
    expect(() => calculateLoanPayoff({ ...base, currentBalance: 0 })).toThrow(RangeError);
    expect(() => calculateLoanPayoff({ ...base, requiredMonthlyPayment: 0 })).toThrow(RangeError);
  });

  it("throws for negative extras or a negative rate", () => {
    expect(() => calculateLoanPayoff({ ...base, extraMonthlyPayment: -1 })).toThrow(RangeError);
    expect(() => calculateLoanPayoff({ ...base, oneTimeExtraPayment: -1 })).toThrow(RangeError);
    expect(() => calculateLoanPayoff({ ...base, annualRatePercent: -1 })).toThrow(RangeError);
  });
});
