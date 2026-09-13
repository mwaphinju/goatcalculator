import { test, expect, type Page } from "@playwright/test";

async function fillScenario(
  page: Page,
  legend: "Baseline scenario" | "Alternative scenario",
  opts: { startingBalance?: string; contribution?: string; duration?: string; rate?: string },
) {
  const group = page.getByRole("group", { name: legend });
  if (opts.startingBalance !== undefined) {
    await group.getByLabel(/^Starting balance/).fill(opts.startingBalance);
  }
  if (opts.contribution !== undefined) {
    await group.getByLabel(/^Monthly contribution/).fill(opts.contribution);
  }
  if (opts.duration !== undefined) {
    await group.getByLabel(/^Duration/).fill(opts.duration);
  }
  if (opts.rate !== undefined) {
    await group.getByRole("textbox", { name: /^Nominal annual rate/ }).fill(opts.rate);
  }
}

test.describe("Savings comparison calculator — default and required field policy", () => {
  test("starting balance and monthly contribution default to zero for both scenarios; duration and rate start blank and Required", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    for (const legend of ["Baseline scenario", "Alternative scenario"] as const) {
      const group = page.getByRole("group", { name: legend });
      await expect(group.getByLabel(/^Starting balance/)).toHaveValue("0");
      await expect(group.getByLabel(/^Monthly contribution/)).toHaveValue("0");
      const duration = group.getByLabel(/^Duration/);
      const rate = group.getByRole("textbox", { name: /^Nominal annual rate/ });
      await expect(duration).toHaveValue("");
      await expect(rate).toHaveValue("");
      await expect(duration).toHaveAttribute("aria-required", "true");
      await expect(rate).toHaveAttribute("aria-required", "true");
    }
  });

  test("no comparison is calculated until both scenarios have a duration and a rate", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await expect(page.getByText(/Enter a duration and an annual rate or APY for both scenarios/i)).toBeVisible();

    await fillScenario(page, "Baseline scenario", { duration: "12", rate: "5" });
    await expect(page.getByText(/Enter a duration and an annual rate or APY for both scenarios/i)).toBeVisible();

    await fillScenario(page, "Alternative scenario", { duration: "12", rate: "5" });
    await expect(page.getByText("Final balance difference")).toBeVisible();
  });
});

test.describe("Savings comparison calculator — required fixtures", () => {
  test("identical scenarios produce zero differences", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await fillScenario(page, "Baseline scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "12" });
    await fillScenario(page, "Alternative scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "12" });

    const diffs = page.locator("dl > div", { has: page.locator("dt", { hasText: "difference" }) }).locator("dd");
    const count = await diffs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(diffs.nth(i)).toContainText("$0.00");
    }
  });

  test("a higher alternative contribution increases the final balance in the expected direction", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await fillScenario(page, "Baseline scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "12" });
    await fillScenario(page, "Alternative scenario", { startingBalance: "1000", contribution: "200", duration: "12", rate: "12" });

    const finalBalanceDiff = page
      .locator("dl > div", { has: page.locator("dt", { hasText: "Final balance difference" }) })
      .locator("dd");
    const text = await finalBalanceDiff.innerText();
    expect(text).not.toContain("-");
    expect(Number(text.replace(/[^0-9.-]/g, ""))).toBeGreaterThan(0);
  });

  test("a higher alternative rate increases the final balance in the expected direction", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await fillScenario(page, "Baseline scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "6" });
    await fillScenario(page, "Alternative scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "18" });

    const finalBalanceDiff = page
      .locator("dl > div", { has: page.locator("dt", { hasText: "Final balance difference" }) })
      .locator("dd");
    const text = await finalBalanceDiff.innerText();
    expect(Number(text.replace(/[^0-9.-]/g, ""))).toBeGreaterThan(0);
  });

  test("does not say one scenario is better", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await fillScenario(page, "Baseline scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "6" });
    await fillScenario(page, "Alternative scenario", { startingBalance: "1000", contribution: "200", duration: "12", rate: "6" });

    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    expect(bodyText).not.toMatch(/recommended scenario|you should choose|is the winner/);
    expect(bodyText).toContain("does not say one scenario is better");
  });
});

test.describe("Savings comparison calculator — schedule reconciliation", () => {
  test("baseline and alternative schedules reconcile to their own reported final balances", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await fillScenario(page, "Baseline scenario", { startingBalance: "1000", contribution: "100", duration: "12", rate: "12" });
    await fillScenario(page, "Alternative scenario", { startingBalance: "1000", contribution: "150", duration: "12", rate: "12" });

    // The innermost (most specific) matching div is the one that appears
    // last in document order, since every ancestor div also "has" the h3.
    const baselinePanel = page
      .locator("div", { has: page.locator("h3", { hasText: "Baseline" }) })
      .last();
    const baselineFinal = await baselinePanel
      .locator("dl > div", { has: page.locator("dt", { hasText: "Final balance" }) })
      .locator("dd")
      .innerText();

    const table = page.locator("table", {
      has: page.locator("caption", { hasText: "Monthly comparison schedule" }),
    });
    const lastRow = table.locator("tbody tr").last();
    const lastRowBaseline = await lastRow.locator("td").nth(0).innerText();
    expect(lastRowBaseline.trim()).toBe(baselineFinal.trim());
  });
});

test.describe("Savings comparison calculator — example mode and wording", () => {
  test("a single Try an example loads both scenarios and labels them illustrative", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await page.getByText("Try an example").first().click();
    await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    await expect(page.getByText("Final balance difference")).toBeVisible();

    await fillScenario(page, "Alternative scenario", { contribution: "999" });
    await expect(page.getByText("Illustrative example. Edit these assumptions.")).toHaveCount(0);
  });

  test("public wording rules hold: no em dash, en dash, or the old timing phrasing", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[–—]/);
    expect(bodyText).not.toContain("End of month");
    expect(bodyText).not.toContain("Beginning of month");
  });
});
