import { test, expect, type Page, type Locator } from "@playwright/test";

function statCardValue(page: Page, scenarioName: string, label: string): Locator {
  return page
    .getByRole("group", { name: `${scenarioName} results` })
    .locator(`dl > div:has(dt:text-is("${label}")) dd`)
    .first();
}

async function fillShared(
  page: Page,
  opts: { startingBalance?: string; duration?: string; inflation?: string },
) {
  if (opts.startingBalance !== undefined) {
    await page.getByLabel(/^Starting balance/).fill(opts.startingBalance);
  }
  if (opts.duration !== undefined) {
    await page.getByLabel(/^Duration/).fill(opts.duration);
  }
  if (opts.inflation !== undefined) {
    await page.getByLabel(/^Inflation rate per year/).fill(opts.inflation);
  }
}

async function fillScenario(
  page: Page,
  groupName: string,
  opts: { rate?: string; contribution?: string; fee?: string },
) {
  const group = page.getByRole("group", { name: groupName });
  if (opts.rate !== undefined) {
    await group.getByLabel(/^Annual interest rate/).fill(opts.rate);
  }
  if (opts.contribution !== undefined) {
    await group.getByLabel(/^Monthly contribution/).fill(opts.contribution);
  }
  if (opts.fee !== undefined) {
    await group.getByLabel(/^Monthly account fee/).fill(opts.fee);
  }
}

/** Fills all three scenarios with a valid rate (0%) so a result renders, unless overridden. */
async function fillAllScenarios(page: Page, overrides: Partial<Record<"A" | "B" | "C", { rate?: string; contribution?: string; fee?: string }>> = {}) {
  await fillScenario(page, "Scenario A", { rate: "0", ...overrides.A });
  await fillScenario(page, "Scenario B", { rate: "0", ...overrides.B });
  await fillScenario(page, "Scenario C", { rate: "0", ...overrides.C });
}

test.describe("Savings scenarios — default and required field policy", () => {
  test("starting balance, contribution and fee fields default visibly to 0; duration and every rate start blank and Required", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await expect(page.getByLabel(/^Starting balance/)).toHaveValue("0");
    await expect(page.getByLabel(/^Inflation rate per year/)).toHaveValue("0");
    await expect(page.getByLabel(/^Duration/)).toHaveValue("");
    await expect(page.getByLabel(/^Duration/)).toHaveAttribute("aria-required", "true");

    for (const name of ["Scenario A", "Scenario B", "Scenario C"]) {
      const group = page.getByRole("group", { name });
      await expect(group.getByLabel(/^Annual interest rate/)).toHaveValue("");
      await expect(group.getByLabel(/^Annual interest rate/)).toHaveAttribute("aria-required", "true");
      await expect(group.getByLabel(/^Monthly contribution/)).toHaveValue("0");
      await expect(group.getByLabel(/^Monthly account fee/)).toHaveValue("0");
    }
  });

  test("no required-field messages or result appear before any interaction", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await expect(page.locator('p[role="alert"]')).toHaveCount(0);
    await expect(page.getByText("Scenario comparison table")).toHaveCount(0);
  });

  test("a required field's message appears only after blur, and a blank scenario rate blocks the comparison", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { duration: "12" });
    await fillAllScenarios(page, { A: { rate: undefined } });

    const rateA = page.getByRole("group", { name: "Scenario A" }).getByLabel(/^Annual interest rate/);
    await rateA.focus();
    await rateA.blur();
    await expect(page.getByText("Enter annual interest rate.").first()).toBeVisible();
    await expect(page.getByText("Scenario comparison table")).toHaveCount(0);

    await rateA.fill("0");
    await expect(page.getByText("Scenario comparison table")).toBeVisible();
  });

  test("explicit 0% is a valid rate for every scenario", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { duration: "12" });
    await fillAllScenarios(page);
    await expect(page.getByText("Scenario comparison table")).toBeVisible();
    await expect(statCardValue(page, "Scenario A", "Final balance")).toContainText("$0.00");
  });

  test("a zero or blank duration is rejected, not silently treated as valid", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { duration: "0" });
    await fillAllScenarios(page);
    await expect(page.getByText(/must be greater than 0/i).first()).toBeVisible();
    await expect(page.getByText("Scenario comparison table")).toHaveCount(0);
  });

  test("clearing a defaulted zero field restores it to 0 on blur, rather than staying blank", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    const startingBalance = page.getByLabel(/^Starting balance/);
    await startingBalance.fill("");
    await expect(startingBalance).toHaveValue("");
    await startingBalance.blur();
    await expect(startingBalance).toHaveValue("0");
  });
});

test.describe("Savings scenarios — required fixtures", () => {
  test("zero rate, zero fee: $0 starting, $100/month, 12 months: final balance and buying power are exactly $1,200.00", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "0", duration: "12", inflation: "0" });
    await fillAllScenarios(page, { A: { rate: "0", contribution: "100", fee: "0" } });
    await expect(statCardValue(page, "Scenario A", "Final balance")).toContainText("$1,200.00");
    await expect(statCardValue(page, "Scenario A", "Estimated buying power today")).toContainText("$1,200.00");
  });

  test("fee case: $1,000 starting, 0% rate, no contribution, $10 monthly fee, 12 months: final balance is exactly $880.00, total fees deducted are exactly $120.00", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "12" });
    await fillAllScenarios(page, { A: { rate: "0", contribution: "0", fee: "10" } });
    await expect(statCardValue(page, "Scenario A", "Final balance")).toContainText("$880.00");
    await expect(statCardValue(page, "Scenario A", "Total fees deducted")).toContainText("$120.00");
  });

  test("inflation case: a $1,000 final balance after 12 months with 10% annual inflation shows a buying power of $909.09", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "12", inflation: "10" });
    await fillAllScenarios(page, { A: { rate: "0", contribution: "0", fee: "0" } });
    await expect(statCardValue(page, "Scenario A", "Final balance")).toContainText("$1,000.00");
    await expect(statCardValue(page, "Scenario A", "Estimated buying power today")).toContainText("$909.09");
  });

  test("timing comparison: switching from end to beginning of each month never decreases the final balance for a positive rate and contribution", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "24" });
    await fillAllScenarios(page, { A: { rate: "6", contribution: "100", fee: "0" } });
    const endBalanceText = await statCardValue(page, "Scenario A", "Final balance").innerText();
    const endBalance = Number(endBalanceText.replace(/[^0-9.]/g, ""));

    await page.getByLabel(/^Beginning of each month/).check();
    const beginBalanceText = await statCardValue(page, "Scenario A", "Final balance").innerText();
    const beginBalance = Number(beginBalanceText.replace(/[^0-9.]/g, ""));

    expect(beginBalance).toBeGreaterThanOrEqual(endBalance);
  });

  test("fee cap case: $5 starting, 0% rate, no contribution, $10 monthly fee, one month: final balance is $0.00, and only $5.00 of fee is reported as deducted", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "5", duration: "1" });
    await fillAllScenarios(page, { A: { rate: "0", contribution: "0", fee: "10" } });
    await expect(statCardValue(page, "Scenario A", "Final balance")).toContainText("$0.00");
    await expect(statCardValue(page, "Scenario A", "Total fees deducted")).toContainText("$5.00");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/-\$/);
  });
});

test.describe("Savings scenarios — three independent scenarios", () => {
  test("three scenarios with different assumptions produce three different, independently correct results", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "120", inflation: "3" });
    await fillAllScenarios(page, {
      A: { rate: "4", contribution: "100", fee: "0" },
      B: { rate: "6", contribution: "125", fee: "5" },
      C: { rate: "8", contribution: "150", fee: "10" },
    });
    const a = Number((await statCardValue(page, "Scenario A", "Final balance").innerText()).replace(/[^0-9.]/g, ""));
    const b = Number((await statCardValue(page, "Scenario B", "Final balance").innerText()).replace(/[^0-9.]/g, ""));
    const c = Number((await statCardValue(page, "Scenario C", "Final balance").innerText()).replace(/[^0-9.]/g, ""));
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);

    await expect(statCardValue(page, "Scenario B", "Total fees deducted")).toContainText("$600.00");
    await expect(statCardValue(page, "Scenario C", "Total fees deducted")).toContainText("$1,200.00");
  });

  test("renaming a scenario updates its heading and result labels without changing the calculation", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "12" });
    await fillAllScenarios(page, { A: { rate: "5", contribution: "50", fee: "0" } });
    const before = await statCardValue(page, "Scenario A", "Final balance").innerText();

    const nameField = page.getByRole("group", { name: "Scenario A" }).getByLabel("Scenario name");
    await nameField.fill("My retirement plan");

    await expect(page.getByRole("heading", { name: "My retirement plan" }).first()).toBeVisible();
    const after = await statCardValue(page, "My retirement plan", "Final balance").innerText();
    expect(after).toBe(before);
    await expect(page.getByText(/for comparison only/i).first()).toBeVisible();
  });
});

test.describe("Savings scenarios — example mode and wording", () => {
  test("Try an example loads a labeled illustrative scenario for all three branches", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();
    await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    await expect(page.getByText("Scenario comparison table")).toBeVisible();

    await page.getByLabel(/^Starting balance/).fill("5000");
    await expect(page.getByText("Illustrative example. Edit these assumptions.")).toHaveCount(0);
    await expect(page.getByText(/still show example values/i)).toBeVisible();
  });

  test("public wording rules hold: no em dash, en dash, or forecast/guarantee language", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[–—]/);
    const lower = bodyText.toLowerCase();
    for (const forbidden of [
      "best scenario",
      "is recommended",
      "we recommend",
      "is guaranteed",
      "this will happen",
      "the likely outcome",
      "a safe return",
      "a conservative forecast",
      "an optimistic forecast",
    ]) {
      expect(lower).not.toContain(forbidden);
    }
    expect(lower).toMatch(/not (a )?predictions?/);
  });
});

test.describe("Savings scenarios — chart, table and accessibility", () => {
  test("the chart's text alternative describes each scenario's final balance and is not empty", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "12" });
    await fillAllScenarios(page, { A: { rate: "5" }, B: { rate: "5" }, C: { rate: "5" } });
    const figcaption = page.locator("figure figcaption");
    await expect(figcaption).toContainText("Scenario A");
    await expect(figcaption).toContainText("Scenario B");
    await expect(figcaption).toContainText("Scenario C");
  });

  test("the monthly schedule's scroll container is keyboard-focusable and scrollable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "24" });
    await fillAllScenarios(page, { A: { rate: "5" }, B: { rate: "6" }, C: { rate: "7" } });

    const scrollRegion = page.getByRole("region", {
      name: "Monthly schedule table, scrollable horizontally on narrow screens",
    });
    await expect(scrollRegion).toHaveAttribute("tabindex", "0");
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();

    const before = await scrollRegion.evaluate((el) => el.scrollLeft);
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("ArrowRight");
    }
    const after = await scrollRegion.evaluate((el) => el.scrollLeft);
    expect(after).toBeGreaterThan(before);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });

  test("the assumptions details panel can be opened with the keyboard", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await fillShared(page, { startingBalance: "1000", duration: "12" });
    await fillAllScenarios(page, { A: { rate: "5" }, B: { rate: "5" }, C: { rate: "5" } });

    const details = page.locator("details", { has: page.getByText("Assumptions used") });
    const summary = page.getByText("Assumptions used");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(details).toHaveJSProperty("open", true);
    await expect(page.locator("dt", { hasText: "Contribution timing" })).toBeVisible();
  });

  test("a required field's state is exposed to assistive technology, not just shown in color", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    const rateA = page.getByRole("group", { name: "Scenario A" }).getByLabel(/^Annual interest rate/);
    await expect(rateA).toHaveAttribute("aria-required", "true");
    await rateA.focus();
    await rateA.blur();
    await expect(rateA).toHaveAttribute("aria-invalid", "true");
    const describedBy = await rateA.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
  });
});

test.describe("Savings scenarios — responsive layout", () => {
  const widths = [320, 390, 768, 1440];
  for (const width of widths) {
    test(`no horizontal overflow at ${width}px with a full result shown`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/calculators/savings-scenarios");
      await page.getByText("Not sure what to enter?").click();
      await page.getByRole("button", { name: "Try an example" }).click();
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasOverflow).toBe(false);
    });
  }

  test("stat card currency values stay on one line at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();

    const finalBalanceValue = statCardValue(page, "Scenario C", "Final balance");
    const isSingleLine = await finalBalanceValue.evaluate((el) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      return el.clientHeight <= lineHeight * 1.5;
    });
    expect(isSingleLine).toBe(true);
  });
});

test.describe("Savings scenarios — direct navigation", () => {
  test("the route loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/savings-scenarios");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: "Savings scenario calculator" })).toBeVisible();
  });
});
