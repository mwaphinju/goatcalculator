import { describe, expect, it } from "vitest";
import { monthlyRateFromAPY, monthlyRateFromNominal, resolveMonthlyRate } from "../rate";

/**
 * Expected values derived independently via a separate plain
 * double-precision script (Math.pow), not by calling the implementation
 * under test:
 *   nominal 12% -> monthly 0.01
 *   APY 12% -> monthly 0.009488792934583046
 *   APY 6%  -> monthly 0.004867550565343048
 */

describe("monthlyRateFromNominal", () => {
  it("divides by 12 months and by 100 to convert percent to a decimal", () => {
    expect(monthlyRateFromNominal(12).toNumber()).toBeCloseTo(0.01, 12);
    expect(monthlyRateFromNominal(0).toNumber()).toBe(0);
  });
});

describe("monthlyRateFromAPY", () => {
  it("matches the independently computed effective monthly rate for 12% APY", () => {
    expect(monthlyRateFromAPY(12).toNumber()).toBeCloseTo(0.009488792934583046, 12);
  });

  it("matches the independently computed effective monthly rate for 6% APY", () => {
    expect(monthlyRateFromAPY(6).toNumber()).toBeCloseTo(0.004867550565343048, 12);
  });

  it("does not double compound: compounding the monthly rate 12 times reproduces the APY exactly", () => {
    const apyPercent = 8.5;
    const monthly = monthlyRateFromAPY(apyPercent);
    const reproducedApy = monthly.plus(1).pow(12).minus(1).times(100);
    expect(reproducedApy.toNumber()).toBeCloseTo(apyPercent, 10);
  });

  it("APY of 0% gives a monthly rate of 0", () => {
    expect(monthlyRateFromAPY(0).toNumber()).toBe(0);
  });
});

describe("resolveMonthlyRate", () => {
  it("routes to the nominal conversion for rateMode 'nominal'", () => {
    expect(resolveMonthlyRate("nominal", 12).toNumber()).toBeCloseTo(0.01, 12);
  });

  it("routes to the APY conversion for rateMode 'apy'", () => {
    expect(resolveMonthlyRate("apy", 12).toNumber()).toBeCloseTo(0.009488792934583046, 12);
  });

  it("a nominal rate and an equal-percent APY produce different monthly rates (no accidental aliasing)", () => {
    const nominal = resolveMonthlyRate("nominal", 12);
    const apy = resolveMonthlyRate("apy", 12);
    expect(nominal.toNumber()).not.toBeCloseTo(apy.toNumber(), 6);
  });
});
