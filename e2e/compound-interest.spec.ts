import { test, expect, type Page, type Locator } from "@playwright/test";

function resultValue(page: Page, label: string): Locator {
  // Scoped to the headline stats <dl> specifically (not the assumptions
  // summary, which repeats some of the same labels) via :has() + text-is,
  // and .first() picks the one that appears earliest in the DOM — the
  // headline stats render before the assumptions <details>.
  return page.locator(`dl > div:has(dt:text-is("${label}")) dd`).first();
}

async function fillScenario(
  page: Page,
  opts: {
    initialBalance?: string;
    rate?: string;
    months?: string;
    contribution?: string;
    timing?: "end" | "begin";
  },
) {
  if (opts.initialBalance !== undefined) {
    await page.getByLabel(/^Initial balance/).fill(opts.initialBalance);
  }
  if (opts.rate !== undefined) {
    await page.getByLabel(/^Nominal annual interest rate/).fill(opts.rate);
  }
  if (opts.months !== undefined) {
    await page.getByLabel(/^Duration/).fill(opts.months);
  }
  if (opts.contribution !== undefined) {
    await page.getByLabel(/^Monthly contribution/).fill(opts.contribution);
  }
  if (opts.timing === "begin") {
    await page.getByLabel(/^Beginning of month/).check();
  } else if (opts.timing === "end") {
    await page.getByLabel(/^End of month/).check();
  }
}

test.describe("Compound interest calculator — missing/invalid/valid states", () => {
  test("shows a missing-information message before any input is entered", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await expect(page.getByText(/Enter your.*to see your projection/i)).toBeVisible();
    await expect(page.getByText(/Your results will appear here/i)).toBeVisible();
  });

  test("does not show a result while any required field is empty", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, { initialBalance: "1000", rate: "12", months: "12" });
    // monthlyContribution still empty
    await expect(page.getByText(/Your results will appear here/i)).toBeVisible();
    await expect(page.getByRole("status")).toContainText(/monthly contribution/i);
  });

  test("rejects a negative value with a validation message and no result", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "-100",
      rate: "5",
      months: "12",
      contribution: "0",
    });
    await expect(page.getByText(/cannot be negative/i).first()).toBeVisible();
    await expect(page.getByText(/Your results will appear here/i)).toBeVisible();
  });

  test("clearing a previously-valid field hides the result instead of showing stale data", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "12",
      months: "12",
      contribution: "0",
    });
    await expect(resultValue(page, "Final balance")).toContainText("$1,126.83");

    await page.getByLabel(/^Initial balance/).fill("");
    await expect(page.getByText(/Your results will appear here/i)).toBeVisible();
    await expect(page.getByText("$1,126.83")).toHaveCount(0);
  });
});

test.describe("Compound interest calculator — numerical fixtures", () => {
  test("Fixture A: $1,000 @ 12%, 12 months, no contributions => $1,126.83", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "12",
      months: "12",
      contribution: "0",
      timing: "end",
    });
    await expect(resultValue(page, "Final balance")).toContainText("$1,126.83");
    await expect(resultValue(page, "Total interest")).toContainText("$126.83");
    await expect(resultValue(page, "Total contributions")).toContainText("$0.00");
  });

  test("Fixture B: $1,000 @ 12%, 12 months, $100/month end-of-month => $2,395.08", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "12",
      months: "12",
      contribution: "100",
      timing: "end",
    });
    await expect(resultValue(page, "Final balance")).toContainText("$2,395.08");
    await expect(resultValue(page, "Total contributions")).toContainText("$1,200.00");
  });

  test("Fixture C: $1,000 initial, $100/month, 0% interest, 12 months => exactly $2,200.00", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "0",
      months: "12",
      contribution: "100",
      timing: "end",
    });
    await expect(resultValue(page, "Final balance")).toContainText("$2,200.00");
    await expect(resultValue(page, "Total interest")).toContainText("$0.00");
  });

  test("Fixture D: zero duration returns the initial balance untouched", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "12",
      months: "0",
      contribution: "100",
      timing: "end",
    });
    await expect(resultValue(page, "Final balance")).toContainText("$1,000.00");
    await expect(resultValue(page, "Total contributions")).toContainText("$0.00");
    await expect(resultValue(page, "Total interest")).toContainText("$0.00");
    await expect(page.getByText(/No monthly schedule to show/i)).toBeVisible();
  });

  test("beginning-of-month timing produces a higher balance than end-of-month, all else equal", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "12",
      months: "12",
      contribution: "100",
      timing: "end",
    });
    const endBalanceText = await resultValue(page, "Final balance").innerText();

    await page.getByLabel(/^Beginning of month/).check();
    const beginBalanceText = await resultValue(page, "Final balance").innerText();

    const parse = (s: string) => Number(s.replace(/[^0-9.]/g, ""));
    expect(parse(beginBalanceText)).toBeGreaterThan(parse(endBalanceText));
  });
});

test.describe("Compound interest calculator — example mode", () => {
  test("labels illustrative values and transitions explicitly when edited", async ({ page }) => {
    await page.goto("/calculators/compound-interest");

    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();

    await expect(page.getByText("Illustrative example — edit these assumptions.").first()).toBeVisible();
    await expect(page.getByLabel(/^Initial balance/)).toHaveValue("1000");
    await expect(page.getByLabel(/^Nominal annual interest rate/)).toHaveValue("6");
    await expect(resultValue(page, "Final balance")).not.toHaveText("");

    // Edit one field — the example label must disappear immediately, and a
    // residue notice must explain which fields still hold example values.
    await page.getByLabel(/^Nominal annual interest rate/).fill("7");
    await expect(page.getByText("Illustrative example — edit these assumptions.")).toHaveCount(0);
    await expect(page.getByText(/still show example values/i)).toBeVisible();
    await expect(page.getByText(/still show example values/i)).toContainText("Initial balance");
    await expect(page.getByText(/still show example values/i)).toContainText("Monthly contribution");
    await expect(page.getByText(/still show example values/i)).not.toContainText("Nominal annual interest rate");

    // Editing the remaining fields clears the residue notice entirely.
    await page.getByLabel(/^Initial balance/).fill("2000");
    await page.getByLabel(/^Duration/).fill("24");
    await page.getByLabel(/^Monthly contribution/).fill("50");
    await expect(page.getByText(/still show example values/i)).toHaveCount(0);
  });

  test("example rate is never described as current, typical, recommended or guaranteed", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    const bodyText = await page.locator("body").innerText();
    for (const claim of ["current rate", "typical rate", "recommended rate", "guaranteed"]) {
      expect(bodyText.toLowerCase()).not.toContain(claim);
    }
  });
});

test.describe("Compound interest calculator — assumptions summary sync", () => {
  test("assumptions summary reflects the exact inputs used for the current result", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "2500",
      rate: "4.5",
      months: "36",
      contribution: "75",
      timing: "begin",
    });

    await page.getByText("Assumptions used").click();
    const summary = page.locator("details", { has: page.getByText("Assumptions used") });
    await expect(summary).toContainText("$2,500.00");
    await expect(summary).toContainText("4.50%");
    await expect(summary).toContainText("36 months");
    await expect(summary).toContainText("$75.00");
    await expect(summary).toContainText("Beginning of month");
    await expect(summary).toContainText("Monthly");
  });
});

test.describe("Compound interest calculator — chart and table consistency", () => {
  test("chart caption and schedule table agree on the final balance", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await fillScenario(page, {
      initialBalance: "1000",
      rate: "12",
      months: "12",
      contribution: "100",
      timing: "end",
    });

    await expect(page.locator("figcaption")).toContainText("$2,395.08");

    // Scoped to the month-by-month schedule table specifically — the page
    // also has a small static worked-example table further down.
    const scheduleTable = page.locator("table", {
      has: page.locator("caption", { hasText: "Month-by-month balance schedule" }),
    });
    const lastRow = scheduleTable.locator("tbody tr").last();
    await expect(lastRow).toContainText("12");
    await expect(lastRow.locator("td").last()).toContainText("$2,395.08");
  });
});
