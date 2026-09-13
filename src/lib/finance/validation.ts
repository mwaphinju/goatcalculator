import { COMPOUND_INTEREST_LIMITS } from "./limits";

export type FieldValidation =
  | { status: "empty" }
  | { status: "invalid"; message: string }
  | { status: "valid"; value: number };

/**
 * Validates one raw text-input value against a [min, max] range.
 *
 * Deliberately treats an empty string as its own `"empty"` state rather than
 * coercing it to zero — an unanswered question is not the same as an
 * explicit zero, and the caller must not silently substitute a guessed
 * value.
 */
export function validateNumberField(
  raw: string,
  limits: { min: number; max: number },
  label: string,
): FieldValidation {
  if (raw.trim() === "") {
    return { status: "empty" };
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return { status: "invalid", message: `${label} must be a number.` };
  }
  if (value < limits.min) {
    return {
      status: "invalid",
      message: `${label} cannot be negative.`,
    };
  }
  if (value > limits.max) {
    return {
      status: "invalid",
      message: `${label} must be ${limits.max.toLocaleString("en-US")} or less.`,
    };
  }

  return { status: "valid", value };
}

/**
 * Validates a whole-number months field. Rejects fractional months since the
 * model only supports whole monthly compounding steps.
 */
export function validateMonthsField(
  raw: string,
  label = "Duration",
  maxMonths: number = COMPOUND_INTEREST_LIMITS.months.max,
): FieldValidation {
  if (raw.trim() === "") {
    return { status: "empty" };
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return { status: "invalid", message: `${label} must be a whole number of months.` };
  }
  if (!Number.isInteger(value)) {
    return { status: "invalid", message: `${label} must be a whole number of months (no fractions).` };
  }
  if (value < COMPOUND_INTEREST_LIMITS.months.min) {
    return { status: "invalid", message: `${label} cannot be negative.` };
  }
  if (value > maxMonths) {
    return {
      status: "invalid",
      message: `${label} must be ${maxMonths} months or fewer.`,
    };
  }

  return { status: "valid", value };
}

/**
 * Validates an amount field that (unlike an ordinary defaulted zero
 * amount) must be strictly greater than zero: e.g. a savings target, a
 * loan amount, a current loan balance, or a required monthly payment. $0
 * is not a meaningful value for any of these and is rejected rather than
 * silently treated as some other case.
 */
export function validatePositiveAmountField(
  raw: string,
  limits: { min: number; max: number },
  label: string,
): FieldValidation {
  if (raw.trim() === "") {
    return { status: "empty" };
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return { status: "invalid", message: `${label} must be a number.` };
  }
  if (value <= 0) {
    return { status: "invalid", message: `${label} must be greater than 0.` };
  }
  if (value > limits.max) {
    return {
      status: "invalid",
      message: `${label} must be ${limits.max.toLocaleString("en-US")} or less.`,
    };
  }

  return { status: "valid", value };
}

/** @deprecated Use `validatePositiveAmountField` — kept as an alias so existing savings-goal/time callers are unaffected. */
export function validateTargetBalanceField(
  raw: string,
  limits: { min: number; max: number },
  label = "Target balance",
): FieldValidation {
  return validatePositiveAmountField(raw, limits, label);
}

/**
 * Validates a whole-number months field that must be strictly greater than
 * zero, such as a loan term: a 0-month term is not a meaningful loan and is
 * rejected rather than silently treated as "already paid off."
 */
export function validatePositiveMonthsField(
  raw: string,
  label: string,
  maxMonths: number,
): FieldValidation {
  if (raw.trim() === "") {
    return { status: "empty" };
  }

  const value = Number(raw);

  if (!Number.isFinite(value)) {
    return { status: "invalid", message: `${label} must be a whole number of months.` };
  }
  if (!Number.isInteger(value)) {
    return { status: "invalid", message: `${label} must be a whole number of months (no fractions).` };
  }
  if (value <= 0) {
    return { status: "invalid", message: `${label} must be greater than 0.` };
  }
  if (value > maxMonths) {
    return {
      status: "invalid",
      message: `${label} must be ${maxMonths} months or fewer.`,
    };
  }

  return { status: "valid", value };
}
