import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { calculateLoanPayment } from "../loanPayment";
import type { LoanPaymentInput } from "../types";

/**
 * Expected values below were derived independently of the implementation
 * under test, using a separate plain-double-precision reference formula
 * (Math.pow, not decimal.js), not by calling `calculateLoanPayment`:
 *
 *   M = P * i / (1 - (1+i)^-n)   for i > 0
 *   M = P / n                     for i == 0
 *   i = (annualRatePercent / 100) / 12
 */

const CheckDecimal = Decimal.clone({ precision: 50 });

describe("calculateLoanPayment — required fixtures", () => {
  it("$10,000 loan, 12% annual note rate, 12 months: theoretical payment is approximately $888.4878867834", () => {
    const result = calculateLoanPayment({ loanAmount: 10000, annualRatePercent: 12, months: 12 });
    expect(Math.abs(Number(result.monthlyPayment) - 888.4878867834)).toBeLessThan(1e-8);
  });

  it("$1,200 loan, 0% interest, 12 months: monthly payment is exactly $100", () => {
    const result = calculateLoanPayment({ loanAmount: 1200, annualRatePercent: 0, months: 12 });
    expect(result.monthlyPayment).toBe("100");
    for (const row of result.schedule) {
      expect(row.payment).toBe("100");
      expect(row.interest).toBe("0");
    }
    expect(result.totalPaid).toBe("1200");
    expect(result.totalInterest).toBe("0");
  });
});

describe("calculateLoanPayment — final payment adjustment and reconciliation", () => {
  it("the final scheduled payment exactly clears the loan (ending balance is zero)", () => {
    const result = calculateLoanPayment({ loanAmount: 10000, annualRatePercent: 12, months: 12 });
    const lastRow = result.schedule[result.schedule.length - 1];
    expect(lastRow.endingBalance).toBe("0");
  });

  it("every row's principal plus interest equals that row's payment", () => {
    // Compared with a tiny epsilon rather than exact string equality: a
    // rate like 7.25% produces a non-terminating monthly rate, and
    // reconstructing payment from (payment - interest) + interest can
    // differ from the original by a few times 1e-18 due to decimal.js's
    // finite (40-significant-digit) precision through the pow/multiply
    // chain. That is about sixteen orders of magnitude below a cent, with
    // no financial significance; 1e-10 is a comfortable margin above it.
    const result = calculateLoanPayment({ loanAmount: 10000, annualRatePercent: 7.25, months: 36 });
    for (const row of result.schedule) {
      const sum = new CheckDecimal(row.principal).plus(row.interest);
      const diff = sum.minus(row.payment).abs();
      expect(diff.lessThan("1e-10")).toBe(true);
    }
  });

  it("loanAmount plus totalInterest equals totalPaid", () => {
    const result = calculateLoanPayment({ loanAmount: 10000, annualRatePercent: 12, months: 12 });
    const sum = new CheckDecimal(result.loanAmount).plus(result.totalInterest);
    expect(sum.toString()).toBe(new CheckDecimal(result.totalPaid).toString());
  });

  it("no row ever has a negative ending balance, including at the documented limits", () => {
    const cases: LoanPaymentInput[] = [
      { loanAmount: 10000, annualRatePercent: 12, months: 12 },
      { loanAmount: 10_000_000, annualRatePercent: 100, months: 600 },
      { loanAmount: 1, annualRatePercent: 0, months: 1 },
    ];
    for (const input of cases) {
      const result = calculateLoanPayment(input);
      for (const row of result.schedule) {
        expect(Number(row.endingBalance)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("the schedule has exactly `months` rows", () => {
    const result = calculateLoanPayment({ loanAmount: 5000, annualRatePercent: 5, months: 24 });
    expect(result.schedule).toHaveLength(24);
  });
});

describe("calculateLoanPayment — validation", () => {
  it("throws for a non-positive loan amount", () => {
    expect(() => calculateLoanPayment({ loanAmount: 0, annualRatePercent: 5, months: 12 })).toThrow(RangeError);
    expect(() => calculateLoanPayment({ loanAmount: -1, annualRatePercent: 5, months: 12 })).toThrow(RangeError);
  });

  it("throws for a non-positive term", () => {
    expect(() => calculateLoanPayment({ loanAmount: 1000, annualRatePercent: 5, months: 0 })).toThrow(RangeError);
  });

  it("throws for a negative rate", () => {
    expect(() => calculateLoanPayment({ loanAmount: 1000, annualRatePercent: -1, months: 12 })).toThrow(RangeError);
  });
});
