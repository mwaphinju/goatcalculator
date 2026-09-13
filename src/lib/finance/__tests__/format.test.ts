import { describe, expect, it } from "vitest";
import { formatDuration, formatMoney, roundForDisplay } from "../format";

describe("roundForDisplay", () => {
  it("rounds half up to the nearest cent", () => {
    expect(roundForDisplay("1.005")).toBe("1.01");
    expect(roundForDisplay("1.004")).toBe("1.00");
    expect(roundForDisplay("2200")).toBe("2200.00");
  });
});

describe("formatMoney", () => {
  it("adds a leading $ and thousands separators", () => {
    expect(formatMoney("2395.0753314516669273")).toBe("$2,395.08");
    expect(formatMoney("2200")).toBe("$2,200.00");
    expect(formatMoney("0")).toBe("$0.00");
  });

  it("formats large values correctly", () => {
    expect(formatMoney("10000000")).toBe("$10,000,000.00");
  });
});

describe("formatDuration", () => {
  it("formats zero months", () => {
    expect(formatDuration(0)).toBe("0 months");
  });

  it("formats whole years", () => {
    expect(formatDuration(24)).toBe("2 years");
  });

  it("formats years and months", () => {
    expect(formatDuration(14)).toBe("1 year, 2 months");
  });

  it("formats months under a year", () => {
    expect(formatDuration(7)).toBe("7 months");
  });
});
