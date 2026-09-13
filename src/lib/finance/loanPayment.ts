import Decimal from "decimal.js";
import { monthlyRateFromNominal } from "./rate";
import type { LoanPaymentInput, LoanPaymentResult, LoanScheduleRow } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Fixed-rate monthly loan payment ("M") and its amortization schedule.
 *
 * For monthly rate i > 0:  M = P * i / (1 - (1 + i)^-n)
 * For i == 0:               M = P / n
 *
 * Cent rounding policy for the illustrative schedule: internal balance,
 * interest and principal are tracked at full Decimal precision throughout
 * (never rounded mid-calculation). The payment actually applied each month
 * is M rounded to the nearest cent, matching what a real lender would
 * actually charge, except the final month, whose payment is capped at the
 * exact remaining amount owed (balance + that month's interest) so the
 * schedule always reaches precisely zero and never goes negative — cent
 * rounding drift across the term is absorbed into that last payment
 * rather than left over or invented as an extra row. Real lender
 * schedules can still differ slightly due to their own rounding and
 * payment-date conventions; this is documented on the calculator page.
 */
export function calculateLoanPayment(input: LoanPaymentInput): LoanPaymentResult {
  const { annualRatePercent, months } = input;

  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError("months must be a positive integer");
  }
  if (input.loanAmount <= 0 || annualRatePercent < 0) {
    throw new RangeError("loanAmount must be greater than zero and annualRatePercent must be non-negative");
  }

  const P = new D(input.loanAmount);
  const i = monthlyRateFromNominal(annualRatePercent);
  const n = months;

  const theoreticalPayment = i.isZero()
    ? P.div(n)
    : P.times(i).div(new D(1).minus(i.plus(1).pow(-n)));

  const roundedPayment = new D(theoreticalPayment.toFixed(2, Decimal.ROUND_HALF_UP));

  let balance = P;
  const schedule: LoanScheduleRow[] = [];
  let totalPaid = new D(0);

  for (let m = 1; m <= n; m++) {
    const startingBalance = balance;
    const interest = startingBalance.times(i);
    const amountDue = startingBalance.plus(interest);

    // Final month always clears the loan exactly; earlier months use the
    // rounded payment, capped defensively in case rounding drift would
    // otherwise overshoot the amount actually owed.
    const payment = m === n ? amountDue : Decimal.min(roundedPayment, amountDue);

    const principal = payment.minus(interest);
    let endingBalance = startingBalance.minus(principal);
    if (endingBalance.isNegative()) {
      endingBalance = new D(0);
    }

    schedule.push({
      month: m,
      startingBalance: startingBalance.toString(),
      payment: payment.toString(),
      principal: principal.toString(),
      interest: interest.toString(),
      endingBalance: endingBalance.toString(),
    });

    totalPaid = totalPaid.plus(payment);
    balance = endingBalance;
  }

  const totalInterest = totalPaid.minus(P);

  return {
    loanAmount: P.toString(),
    monthlyPayment: theoreticalPayment.toString(),
    totalPaid: totalPaid.toString(),
    totalInterest: totalInterest.toString(),
    schedule,
  };
}
