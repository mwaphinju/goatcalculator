import Decimal from "decimal.js";
import { stepMonth } from "./projection";
import { monthlyRateFromNominal } from "./rate";
import type {
  ContributionTiming,
  SavingsScenarioBranchInput,
  SavingsScenarioResult,
  SavingsScenarioScheduleRow,
  SavingsScenariosInput,
  SavingsScenariosResult,
} from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Runs one scenario branch (a rate, monthly contribution and monthly fee
 * the visitor chose) through the shared per-month step, then applies that
 * month's fee on top:
 *
 *   End of each month:       preFee = starting * (1 + i) + contribution
 *   Beginning of each month: preFee = (starting + contribution) * (1 + i)
 *   endingBalance = max(0, preFee - fee)
 *
 * `stepMonth` already computes exactly the "preFee" balance in both timing
 * modes (growth and contribution applied in the documented order), so the
 * fee is simply subtracted afterward here, capped at whatever balance is
 * actually available: the balance never goes negative, and the fee
 * actually deducted (which can be less than the entered monthly fee) is
 * tracked separately from the fee amount the visitor entered. This does
 * not model account debt or overdraft charges; once the balance reaches
 * zero it can only be rebuilt by that scenario's own growth and
 * contributions.
 */
function runScenarioBranch(
  startingBalance: Decimal,
  months: number,
  timing: ContributionTiming,
  branch: SavingsScenarioBranchInput,
  inflationRatePercent: number,
): SavingsScenarioResult {
  const monthlyRate = monthlyRateFromNominal(branch.ratePercent);
  const contribution = new D(branch.monthlyContribution);
  const fee = new D(branch.monthlyFee);

  let balance = startingBalance;
  let totalContributions = new D(0);
  let totalInterest = new D(0);
  let totalFeesDeducted = new D(0);
  const schedule: SavingsScenarioScheduleRow[] = [];

  for (let m = 1; m <= months; m++) {
    const startingMonthBalance = balance;
    const { endingBalance: preFeeBalance, interest } = stepMonth(
      startingMonthBalance,
      monthlyRate,
      contribution,
      timing,
    );

    const actualFee = Decimal.min(fee, preFeeBalance);
    const endingBalance = preFeeBalance.minus(actualFee);

    totalContributions = totalContributions.plus(contribution);
    totalInterest = totalInterest.plus(interest);
    totalFeesDeducted = totalFeesDeducted.plus(actualFee);

    schedule.push({
      month: m,
      startingBalance: startingMonthBalance.toString(),
      contribution: contribution.toString(),
      interest: interest.toString(),
      feeDeducted: actualFee.toString(),
      endingBalance: endingBalance.toString(),
    });

    balance = endingBalance;
  }

  const finalBalance = balance;
  const buyingPowerToday = inflationRatePercent === 0
    ? finalBalance
    : finalBalance.div(
        new D(1).plus(new D(inflationRatePercent).div(100)).pow(new D(months).div(12)),
      );

  return {
    startingBalance: startingBalance.toString(),
    finalBalance: finalBalance.toString(),
    totalContributions: totalContributions.toString(),
    totalInterest: totalInterest.toString(),
    totalFeesDeducted: totalFeesDeducted.toString(),
    buyingPowerToday: buyingPowerToday.toString(),
    schedule,
  };
}

/**
 * Runs the visitor's three chosen scenario branches through the shared
 * plan (starting balance, duration, timing) independently, and estimates
 * each one's buying power in today's money using the shared inflation
 * assumption. Deliberately does not judge one scenario as "best": these
 * are assumptions the visitor chose, not a forecast.
 */
export function calculateSavingsScenarios(input: SavingsScenariosInput): SavingsScenariosResult {
  const { startingBalance, months, timing, inflationRatePercent, scenarios } = input;

  if (!Number.isInteger(months) || months <= 0) {
    throw new RangeError("months must be a positive integer");
  }
  if (startingBalance < 0) {
    throw new RangeError("startingBalance must be non-negative");
  }
  if (inflationRatePercent < 0) {
    throw new RangeError("inflationRatePercent must be non-negative");
  }
  for (const branch of scenarios) {
    if (branch.ratePercent < 0 || branch.monthlyContribution < 0 || branch.monthlyFee < 0) {
      throw new RangeError("ratePercent, monthlyContribution and monthlyFee must be non-negative");
    }
  }

  const P = new D(startingBalance);
  const results = scenarios.map((branch) =>
    runScenarioBranch(P, months, timing, branch, inflationRatePercent),
  ) as SavingsScenariosResult["scenarios"];

  return { scenarios: results };
}
