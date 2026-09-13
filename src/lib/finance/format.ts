import Decimal from "decimal.js";

/**
 * Display rounding policy: round half-up to the nearest cent.
 *
 * This is applied only when formatting a value for on-screen display or a
 * schedule table cell. It never feeds back into the calculation itself —
 * `calculateCompoundInterest` always operates on, and returns, full-precision
 * decimal strings. Because each displayed figure (initial balance, total
 * contributions, total interest, final balance) is rounded independently,
 * the displayed figures can differ from one another by up to $0.01 compared
 * to summing the unrounded values; the underlying identity
 * (initial + contributions + interest = final) holds exactly before rounding.
 */
const DISPLAY_ROUNDING = Decimal.ROUND_HALF_UP;

export function roundForDisplay(value: string | Decimal): string {
  const d = new Decimal(value);
  return d.toFixed(2, DISPLAY_ROUNDING);
}

/**
 * Formats a decimal amount with a leading "$" and thousands separators.
 *
 * This is deliberately currency-agnostic: the calculator does not assume
 * USD, GBP, CAD or AUD. The "$" is a stand-in unit symbol — the underlying
 * arithmetic is identical regardless of which currency the visitor has in
 * mind, so no locale-specific currency formatting (e.g. Intl's "currency"
 * style, which would hard-code a currency code) is applied.
 */
export function formatMoney(value: string | Decimal): string {
  const rounded = roundForDisplay(value);
  const negative = rounded.startsWith("-");
  const abs = negative ? rounded.slice(1) : rounded;
  const [intPart, decPart] = abs.split(".");
  const grouped = new Intl.NumberFormat("en-US").format(BigInt(intPart));
  return `${negative ? "-" : ""}$${grouped}.${decPart}`;
}

export function formatPercent(percent: number, fractionDigits = 2): string {
  return `${percent.toFixed(fractionDigits)}%`;
}

/** Converts whole months into a "X years, Y months" style label. */
export function formatDuration(months: number): string {
  if (months === 0) return "0 months";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (remMonths > 0) parts.push(`${remMonths} ${remMonths === 1 ? "month" : "months"}`);
  return parts.join(", ");
}
