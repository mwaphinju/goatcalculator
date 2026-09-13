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
export function validateMonthsField(raw: string, label = "Duration"): FieldValidation {
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
  if (value > COMPOUND_INTEREST_LIMITS.months.max) {
    return {
      status: "invalid",
      message: `${label} must be ${COMPOUND_INTEREST_LIMITS.months.max} months or fewer.`,
    };
  }

  return { status: "valid", value };
}
