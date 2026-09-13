import { test, expect, type Page, type Locator } from "@playwright/test";

function resultValue(page: Page, label: string): Locator {
  return page.locator(`dl > div:has(dt:text-is("${label}")) dd`).first();
}

async function fillRequired(
  page: Page,
  opts: { targetBalance?: string; duration?: string; rate?: string; startingBalance?: string },
) {
  if (opts.startingBalance !== undefined) {
    await page.getByLabel(/^Starting balance/).fill(opts.startingBalance);
  }
  if (opts.targetBalance !== undefined) {
    await page.getByLabel(/^Target balance/).fill(opts.targetBalance);
  }
  if (opts.duration !== undefined) {
    await page.getByLabel(/^Duration/).fill(opts.duration);
  }
  if (opts.rate !== undefined) {
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill(opts.rate);
  }
}

test.describe("Savings goal calculator — default and required field policy", () => {
  test("starting balance visibly defaults to zero; target, duration and rate start blank and Required", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await expect(page.getByLabel(/^Starting balance/)).toHaveValue("0");

    const target = page.getByLabel(/^Target balance/);
    const duration = page.getByLabel(/^Duration/);
    const rate = page.getByRole("textbox", { name: /^Nominal annual rate/ });
    await expect(target).toHaveValue("");
    await expect(duration).toHaveValue("");
    await expect(rate).toHaveValue("");
    await expect(target).toHaveAttribute("aria-required", "true");
    await expect(duration).toHaveAttribute("aria-required", "true");
    await expect(rate).toHaveAttribute("aria-required", "true");
  });

  test("rate type defaults to nominal annual rate (explicit choice)", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await expect(page.getByRole("radio", { name: /^Nominal annual rate, compounded monthly/ })).toBeChecked();
  });

  test("no result and no required-field messages appear before any interaction", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await expect(page.getByText("Enter a target balance.")).toHaveCount(0);
    await expect(page.getByText("Enter a duration.")).toHaveCount(0);
    await expect(page.getByText("Enter an annual rate or APY.")).toHaveCount(0);
    await expect(resultValue(page, "Required monthly saving")).toHaveCount(0);
  });

  test("required messages appear after blur, and calculation stays blocked until all three are filled", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await page.getByLabel(/^Target balance/).focus();
    await page.getByLabel(/^Target balance/).blur();
    await expect(page.getByText("Enter a target balance.")).toBeVisible();

    await fillRequired(page, { targetBalance: "10000" });
    await expect(resultValue(page, "Required monthly saving")).toHaveCount(0);

    await fillRequired(page, { duration: "12" });
    await expect(resultValue(page, "Required monthly saving")).toHaveCount(0);

    await fillRequired(page, { rate: "0" });
    await expect(resultValue(page, "Required monthly saving")).toBeVisible();
  });
});

test.describe("Savings goal calculator — required fixtures", () => {
  test("target already reached requires $0 per month", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await fillRequired(page, { startingBalance: "5000", targetBalance: "1000", duration: "12", rate: "5" });
    await expect(resultValue(page, "Required monthly saving")).toContainText("$0.00");
    await expect(page.getByText(/already meets or exceeds your target/i)).toBeVisible();
  });

  test("interest alone reaching the target requires $0 per month", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    // Independently verified in the completion report: 5000 * 1.01^12 = 5634.13 >= 5300.
    await fillRequired(page, { startingBalance: "5000", targetBalance: "5300", duration: "12", rate: "12" });
    await expect(resultValue(page, "Required monthly saving")).toContainText("$0.00");
    await expect(page.getByText(/Interest alone is projected to reach your target/i)).toBeVisible();
  });

  test("normal case: $0 start, $10,000 target, 12 months, 0% rate => $833.33/month", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await fillRequired(page, { startingBalance: "0", targetBalance: "10000", duration: "12", rate: "0" });
    await expect(resultValue(page, "Required monthly saving")).toContainText("$833.33");
  });

  test("zero duration with a target above the starting balance is explained as impossible, not a misleading number", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await fillRequired(page, { startingBalance: "0", targetBalance: "1000", duration: "0", rate: "5" });
    await expect(page.getByText(/no monthly period in which to reach a target/i)).toBeVisible();
    await expect(resultValue(page, "Required monthly saving")).toHaveCount(0);
  });

  test("nominal vs APY produce different required contributions for the same percentage", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await fillRequired(page, { startingBalance: "1000", targetBalance: "5000", duration: "12", rate: "12" });
    const nominalValue = await resultValue(page, "Required monthly saving").innerText();

    await page.getByRole("radio", { name: /^APY/ }).check();
    const apyValue = await resultValue(page, "Required monthly saving").innerText();

    expect(nominalValue).not.toBe(apyValue);
  });

  test("never shows Infinity, NaN, or a negative required contribution, even at the documented limits", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await fillRequired(page, { startingBalance: "0", targetBalance: "100000000", duration: "600", rate: "100" });
    const text = await resultValue(page, "Required monthly saving").innerText();
    expect(text.toLowerCase()).not.toContain("infinity");
    expect(text.toLowerCase()).not.toContain("nan");
    expect(text).not.toContain("-$");
  });
});

test.describe("Savings goal calculator — example mode and wording", () => {
  test("Try an example loads a labeled illustrative scenario, and editing exits example mode", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();

    await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    await expect(resultValue(page, "Required monthly saving")).toBeVisible();

    await page.getByLabel(/^Target balance/).fill("30000");
    await expect(page.getByText("Illustrative example. Edit these assumptions.")).toHaveCount(0);
    await expect(page.getByText(/still show example values/i)).toBeVisible();
  });

  test("public wording rules hold: no em dash, en dash, or the old timing phrasing", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[–—]/);
    expect(bodyText).not.toContain("End of month");
    expect(bodyText).not.toContain("Beginning of month");
  });
});

test.describe("Savings goal calculator — result consistency", () => {
  test("the confirmation schedule's final balance matches the projected final balance stat", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await fillRequired(page, { startingBalance: "1000", targetBalance: "5000", duration: "12", rate: "12" });

    const statValue = await resultValue(page, "Projected final balance").innerText();
    const scheduleTable = page.locator("table", {
      has: page.locator("caption", { hasText: "Monthly savings goal schedule" }),
    });
    const lastRow = scheduleTable.locator("tbody tr").last();
    await expect(lastRow.locator("td").last()).toHaveText(statValue.trim());
  });
});
