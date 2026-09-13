import Decimal from "decimal.js";
import type { RateMode } from "./types";

const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

/**
 * Converts a nominal annual rate (expressed as a percent) into the monthly
 * rate used by the projection model: i = (rate / 100) / 12. This nominal
 * rate has not yet had monthly compounding applied to it, which is exactly
 * what dividing by 12 and compounding monthly does.
 */
export function monthlyRateFromNominal(annualRatePercent: number): Decimal {
  return new D(annualRatePercent).div(100).div(12);
}

/**
 * Converts an APY (annual percentage yield, expressed as a percent) into
 * the equivalent monthly rate: i = (1 + apy / 100) ^ (1/12) - 1.
 *
 * An APY is already an effective annual rate that accounts for whatever
 * compounding already happened to produce it, so this finds the single
 * monthly rate that, compounded 12 times, reproduces that same APY exactly.
 * It does not compound the APY again on top of itself.
 */
export function monthlyRateFromAPY(apyPercent: number): Decimal {
  const onePlusApy = new D(1).plus(new D(apyPercent).div(100));
  return onePlusApy.pow(new D(1).div(12)).minus(1);
}

/** Resolves a monthly rate from either a nominal annual rate or an APY. */
export function resolveMonthlyRate(rateMode: RateMode, ratePercent: number): Decimal {
  return rateMode === "apy" ? monthlyRateFromAPY(ratePercent) : monthlyRateFromNominal(ratePercent);
}
