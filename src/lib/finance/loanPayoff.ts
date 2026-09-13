import Decimal from "decimal.js";
import { monthlyRateFromNominal } from "./rate";
import { LOAN_PAYOFF_LIMITS } from "./limits";
import type {
  LoanPayoffInput,
  LoanPayoffResult,
  LoanPayoffScenarioResult,
  LoanPayoffScheduleRow,
} from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Simulates one payoff scenario (a fixed required monthly payment, plus an
 * optional recurring extra and a one-time lump-sum extra applied in a
 * chosen month) month by month:
 *
 *   1. Calculate that month's interest on the remaining balance.
 *   2. Apply the required payment.
 *   3. Apply the recurring extra payment to principal.
 *   4. In the selected month only, apply the one-time extra payment.
 *   5. Cap the total applied at the amount actually owed (balance +
 *      interest) — the balance never goes negative, and any requested
 *      extra beyond what was owed is reported as unused, never counted
 *      as paid.
 *
 * "Non-amortizing" is determined once, up front, from the fixed recurring
 * payment (required + recurring extra) against the *first* month's
 * interest: with a fixed rate and a fixed recurring payment, if that
 * payment does not exceed the interest on the largest balance the loan
 * will ever have (its starting balance), the balance can only stay flat
 * or grow, and it will never amortize. If it does cover the first month,
 * every subsequent month's interest is smaller still (since a covered
 * payment reduces the balance), so the scenario is guaranteed to keep
 * amortizing — a single up-front check is therefore sufficient; a
 * one-time extra by itself does not change that long-run trajectory.
 */
function simulatePayoffScenario(
  balanceStart: Decimal,
  monthlyRate: Decimal,
  requiredPayment: Decimal,
  extraMonthly: Decimal,
  oneTimeExtra: Decimal,
  oneTimeExtraMonth: number,
  maxMonths: number,
): LoanPayoffScenarioResult {
  const firstMonthInterest = balanceStart.times(monthlyRate);
  const recurringPayment = requiredPayment.plus(extraMonthly);

  if (recurringPayment.lte(firstMonthInterest)) {
    return {
      reason: "non-amortizing",
      monthsToPayoff: null,
      totalPaid: "0",
      totalInterest: "0",
      schedule: [],
      unusedOneTimeExtra: oneTimeExtra.toString(),
      minimumPaymentToCoverInterest: firstMonthInterest.toString(),
      maxMonths,
    };
  }

  let balance = balanceStart;
  const schedule: LoanPayoffScheduleRow[] = [];
  let totalPaid = new D(0);
  let unusedOneTimeExtra = oneTimeExtra;

  for (let m = 1; m <= maxMonths; m++) {
    const startingBalance = balance;
    const interest = startingBalance.times(monthlyRate);
    const amountDue = startingBalance.plus(interest);

    const requestedOneTime = m === oneTimeExtraMonth ? oneTimeExtra : new D(0);
    const requestedTotal = requiredPayment.plus(extraMonthly).plus(requestedOneTime);

    let payment = requestedTotal;
    if (payment.gt(amountDue)) {
      const excess = payment.minus(amountDue);
      payment = amountDue;
      if (m === oneTimeExtraMonth) {
        // The one-time extra is the last dollar applied, so any excess
        // comes from it first (capped at how much was actually requested).
        unusedOneTimeExtra = Decimal.min(excess, requestedOneTime);
      }
    } else if (m === oneTimeExtraMonth) {
      unusedOneTimeExtra = new D(0);
    }

    const principal = payment.minus(interest);
    let endingBalance = startingBalance.minus(principal);
    if (endingBalance.isNegative()) {
      endingBalance = new D(0);
    }

    schedule.push({
      month: m,
      startingBalance: startingBalance.toString(),
      interest: interest.toString(),
      payment: payment.toString(),
      principal: principal.toString(),
      endingBalance: endingBalance.toString(),
    });

    totalPaid = totalPaid.plus(payment);
    balance = endingBalance;

    if (balance.isZero()) {
      const totalInterest = totalPaid.minus(balanceStart);
      return {
        reason: "amortizing",
        monthsToPayoff: m,
        totalPaid: totalPaid.toString(),
        totalInterest: totalInterest.toString(),
        schedule,
        unusedOneTimeExtra: unusedOneTimeExtra.toString(),
        minimumPaymentToCoverInterest: firstMonthInterest.toString(),
        maxMonths,
      };
    }
  }

  return {
    reason: "exceeds-max",
    monthsToPayoff: null,
    totalPaid: totalPaid.toString(),
    totalInterest: totalPaid.minus(balanceStart).toString(),
    schedule,
    unusedOneTimeExtra: oneTimeExtraMonth > maxMonths ? oneTimeExtra.toString() : unusedOneTimeExtra.toString(),
    minimumPaymentToCoverInterest: firstMonthInterest.toString(),
    maxMonths,
  };
}

/**
 * Compares a baseline scenario (the required payment only, no extras)
 * against the visitor's extra-payment scenario, using the same shared
 * per-month simulation for both.
 */
export function calculateLoanPayoff(input: LoanPayoffInput): LoanPayoffResult {
  const {
    annualRatePercent,
    requiredMonthlyPayment,
    extraMonthlyPayment,
    oneTimeExtraPayment,
    oneTimeExtraMonth,
  } = input;

  if (input.currentBalance <= 0) {
    throw new RangeError("currentBalance must be greater than zero");
  }
  if (annualRatePercent < 0) {
    throw new RangeError("annualRatePercent must be non-negative");
  }
  if (requiredMonthlyPayment <= 0) {
    throw new RangeError("requiredMonthlyPayment must be greater than zero");
  }
  if (extraMonthlyPayment < 0 || oneTimeExtraPayment < 0) {
    throw new RangeError("extraMonthlyPayment and oneTimeExtraPayment must be non-negative");
  }
  if (!Number.isInteger(oneTimeExtraMonth) || oneTimeExtraMonth < 1) {
    throw new RangeError("oneTimeExtraMonth must be a positive integer");
  }

  const P = new D(input.currentBalance);
  const monthlyRate = monthlyRateFromNominal(annualRatePercent);
  const maxMonths = LOAN_PAYOFF_LIMITS.maxMonths;

  const baseline = simulatePayoffScenario(
    P,
    monthlyRate,
    new D(requiredMonthlyPayment),
    new D(0),
    new D(0),
    oneTimeExtraMonth,
    maxMonths,
  );

  const withExtra = simulatePayoffScenario(
    P,
    monthlyRate,
    new D(requiredMonthlyPayment),
    new D(extraMonthlyPayment),
    new D(oneTimeExtraPayment),
    oneTimeExtraMonth,
    maxMonths,
  );

  const bothAmortized = baseline.reason === "amortizing" && withExtra.reason === "amortizing";

  return {
    baseline,
    withExtra,
    monthsSaved:
      bothAmortized && baseline.monthsToPayoff !== null && withExtra.monthsToPayoff !== null
        ? baseline.monthsToPayoff - withExtra.monthsToPayoff
        : null,
    interestSaved: bothAmortized
      ? new D(baseline.totalInterest).minus(withExtra.totalInterest).toString()
      : null,
  };
}
