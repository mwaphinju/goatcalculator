import { describe, expect, it } from "vitest";
import { validateMonthsField, validateNumberField } from "../validation";
import { COMPOUND_INTEREST_LIMITS } from "../limits";

describe("validateNumberField", () => {
  it("treats an empty string as empty, not zero", () => {
    expect(validateNumberField("", COMPOUND_INTEREST_LIMITS.initialBalance, "Initial balance")).toEqual({
      status: "empty",
    });
    expect(validateNumberField("   ", COMPOUND_INTEREST_LIMITS.initialBalance, "Initial balance")).toEqual({
      status: "empty",
    });
  });

  it("accepts an explicit zero as valid", () => {
    expect(validateNumberField("0", COMPOUND_INTEREST_LIMITS.initialBalance, "Initial balance")).toEqual({
      status: "valid",
      value: 0,
    });
  });

  it("rejects negative values", () => {
    const result = validateNumberField("-5", COMPOUND_INTEREST_LIMITS.annualRatePercent, "Rate");
    expect(result.status).toBe("invalid");
  });

  it("rejects non-numeric text", () => {
    const result = validateNumberField("abc", COMPOUND_INTEREST_LIMITS.initialBalance, "Initial balance");
    expect(result.status).toBe("invalid");
  });

  it("rejects values above the documented max", () => {
    const result = validateNumberField("99999999999", COMPOUND_INTEREST_LIMITS.initialBalance, "Initial balance");
    expect(result.status).toBe("invalid");
  });

  it("accepts values at the boundary of the range", () => {
    expect(
      validateNumberField(
        String(COMPOUND_INTEREST_LIMITS.annualRatePercent.max),
        COMPOUND_INTEREST_LIMITS.annualRatePercent,
        "Rate",
      ),
    ).toEqual({ status: "valid", value: COMPOUND_INTEREST_LIMITS.annualRatePercent.max });
  });
});

describe("validateMonthsField", () => {
  it("treats empty as empty", () => {
    expect(validateMonthsField("")).toEqual({ status: "empty" });
  });

  it("accepts explicit zero", () => {
    expect(validateMonthsField("0")).toEqual({ status: "valid", value: 0 });
  });

  it("rejects fractional months", () => {
    expect(validateMonthsField("6.5").status).toBe("invalid");
  });

  it("rejects negative months", () => {
    expect(validateMonthsField("-1").status).toBe("invalid");
  });

  it("rejects months above the documented max", () => {
    expect(validateMonthsField(String(COMPOUND_INTEREST_LIMITS.months.max + 1)).status).toBe("invalid");
  });

  it("accepts months at the documented max", () => {
    expect(validateMonthsField(String(COMPOUND_INTEREST_LIMITS.months.max))).toEqual({
      status: "valid",
      value: COMPOUND_INTEREST_LIMITS.months.max,
    });
  });
});
