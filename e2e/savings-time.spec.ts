import { test, expect, type Page, type Locator } from "@playwright/test";

function resultValue(page: Page, label: string): Locator {
  return page.locator(`dl > div:has(dt:text-is("${label}")) dd`).first();
}

async function fillRequired(
  page: Page,
  opts: { targetBalance?: string; contribution?: string; rate?: string; startingBalance?: string },
) {
  if (opts.startingBalance !== undefined) {
    await page.getByLabel(/^Starting balance/).fill(opts.startingBalance);
  }
  if (opts.targetBalance !== undefined) {
    await page.getByLabel(/^Target balance/).fill(opts.targetBalance);
  }
  if (opts.contribution !== undefined) {
    await page.getByLabel(/^Monthly contribution/).fill(opts.contribution);
  }
  if (opts.rate !== undefined) {
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill(opts.rate);
  }
}

test.describe("Savings time calculator — default and required field policy", () => {
  test("starting balance and monthly contribution default to zero; target and rate start blank and Required", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await expect(page.getByLabel(/^Starting balance/)).toHaveValue("0");
    await expect(page.getByLabel(/^Monthly contribution/)).toHaveValue("0");

    const target = page.getByLabel(/^Target balance/);
    const rate = page.getByRole("textbox", { name: /^Nominal annual rate/ });
    await expect(target).toHaveValue("");
    await expect(rate).toHaveValue("");
    await expect(target).toHaveAttribute("aria-required", "true");
    await expect(rate).toHaveAttribute("aria-required", "true");
  });

  test("starting month and year are optional and empty by default", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await expect(page.getByLabel("Month", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Year", { exact: true })).toHaveValue("");
  });

  test("no result appears until target and rate are both filled", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await expect(resultValue(page, "Time to reach target")).toHaveCount(0);
    // A reachable scenario: $1,000 start growing toward a nearby target, so
    // this checks "a result now appears," not a specific reachability case.
    await fillRequired(page, { startingBalance: "1000", targetBalance: "1100" });
    await expect(resultValue(page, "Time to reach target")).toHaveCount(0);
    await fillRequired(page, { rate: "5" });
    await expect(resultValue(page, "Time to reach target")).toBeVisible();
  });
});

test.describe("Savings time calculator — required fixtures", () => {
  test("target already reached shows 0 months", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "1000", targetBalance: "500", contribution: "100", rate: "12" });
    await expect(page.getByText(/already reached/i).first()).toBeVisible();
    await expect(page.getByText(/That is 0 months\./)).toBeVisible();
  });

  test("zero interest with a positive contribution: $0 start, $100/month, 0% rate, $1,200 target => 12 months", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "0", targetBalance: "1200", contribution: "100", rate: "0" });
    await expect(resultValue(page, "Time to reach target")).toContainText("1 year");
    await expect(resultValue(page, "Final balance")).toContainText("$1,200.00");
  });

  test("not reachable with zero contribution and an explicit 0% rate", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "100", targetBalance: "200", contribution: "0", rate: "0" });
    await expect(page.getByText(/never changes, so your target is not reached/i)).toBeVisible();
    await expect(resultValue(page, "Time to reach target")).toHaveCount(0);
  });

  test("known timing difference: beginning of each month reaches a target before end of each month", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "0", targetBalance: "1050", contribution: "100", rate: "12" });
    await page.getByLabel(/^End of each month/).check();
    const endResult = await resultValue(page, "Time to reach target").innerText();

    await page.getByLabel(/^Beginning of each month/).check();
    const beginResult = await resultValue(page, "Time to reach target").innerText();

    expect(beginResult).not.toBe(endResult);
    // Independently verified: begin reaches month 10, end reaches month 11.
    expect(endResult).toContain("11 month");
    expect(beginResult).toContain("10 month");
  });

  test("maximum horizon case explains rather than inventing an end date", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "0", targetBalance: "100000000", contribution: "1", rate: "0" });
    await expect(page.getByText(/not reached within the documented maximum of 1200 months/i)).toBeVisible();
    await expect(resultValue(page, "Time to reach target")).toHaveCount(0);
  });
});

test.describe("Savings time calculator — optional calendar date", () => {
  test("shows duration only when the starting month and year are not entered", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "0", targetBalance: "1200", contribution: "100", rate: "0" });
    await expect(page.getByText(/Estimated date reached/i)).toHaveCount(0);
  });

  test("shows an estimated calendar date once both month and year are entered", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "0", targetBalance: "1200", contribution: "100", rate: "0" });
    await page.getByLabel("Month", { exact: true }).selectOption({ label: "January" });
    await page.getByLabel("Year", { exact: true }).fill("2026");
    await expect(page.getByText(/Estimated date reached/i)).toBeVisible();
    // 12 months from January 2026 is January 2027.
    await expect(page.getByText("January 2027")).toBeVisible();
  });
});

test.describe("Savings time calculator — example mode and wording", () => {
  test("Try an example loads a labeled illustrative scenario", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();
    await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    await expect(resultValue(page, "Time to reach target")).toBeVisible();
  });

  test("public wording rules hold: no em dash, en dash, or the old timing phrasing", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[–—]/);
    expect(bodyText).not.toContain("End of month");
    expect(bodyText).not.toContain("Beginning of month");
  });
});

test.describe("Savings time calculator — result consistency", () => {
  test("the schedule's last row matches the reported final balance", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await fillRequired(page, { startingBalance: "0", targetBalance: "1200", contribution: "100", rate: "0" });
    const statValue = await resultValue(page, "Final balance").innerText();
    const scheduleTable = page.locator("table", {
      has: page.locator("caption", { hasText: "Monthly savings time schedule" }),
    });
    const lastRow = scheduleTable.locator("tbody tr").last();
    await expect(lastRow.locator("td").last()).toHaveText(statValue.trim());
  });
});
