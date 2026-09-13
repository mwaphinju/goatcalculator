import { test, expect, type Page, type Locator } from "@playwright/test";

function resultValue(page: Page, label: string): Locator {
  return page.locator(`dl > div:has(dt:text-is("${label}")) dd`).first();
}

async function fillRequired(page: Page, opts: { loanAmount?: string; rate?: string; term?: string }) {
  if (opts.loanAmount !== undefined) {
    await page.getByLabel(/^Loan amount/).fill(opts.loanAmount);
  }
  if (opts.rate !== undefined) {
    await page.getByLabel(/^Annual note interest rate/).fill(opts.rate);
  }
  if (opts.term !== undefined) {
    await page.getByLabel(/^Loan term/).fill(opts.term);
  }
}

test.describe("Loan payment calculator — default and required field policy", () => {
  test("loan amount, rate and term all start blank and Required", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    const loanAmount = page.getByLabel(/^Loan amount/);
    const rate = page.getByLabel(/^Annual note interest rate/);
    const term = page.getByLabel(/^Loan term/);
    await expect(loanAmount).toHaveValue("");
    await expect(rate).toHaveValue("");
    await expect(term).toHaveValue("");
    await expect(loanAmount).toHaveAttribute("aria-required", "true");
    await expect(rate).toHaveAttribute("aria-required", "true");
    await expect(term).toHaveAttribute("aria-required", "true");
  });

  test("no required-field messages or result appear before any interaction", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await expect(page.getByText("Enter loan amount.")).toHaveCount(0);
    await expect(resultValue(page, "Estimated monthly payment")).toHaveCount(0);
  });

  test("a required field's message appears only after blur, and a blank rate blocks calculation", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "10000", term: "12" });
    await expect(resultValue(page, "Estimated monthly payment")).toHaveCount(0);

    const rate = page.getByLabel(/^Annual note interest rate/);
    await rate.focus();
    await rate.blur();
    await expect(page.getByText("Enter annual note interest rate.")).toBeVisible();

    await fillRequired(page, { rate: "12" });
    await expect(resultValue(page, "Estimated monthly payment")).toBeVisible();
  });

  test("explicit 0% is a valid rate", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "1200", rate: "0", term: "12" });
    await expect(resultValue(page, "Estimated monthly payment")).toContainText("$100.00");
    await expect(resultValue(page, "Estimated total interest")).toContainText("$0.00");
  });

  test("a zero or blank loan amount is rejected, not silently treated as a valid input", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "0", rate: "5", term: "12" });
    await expect(page.getByText(/must be greater than 0/i).first()).toBeVisible();
    await expect(resultValue(page, "Estimated monthly payment")).toHaveCount(0);
  });
});

test.describe("Loan payment calculator — required fixtures", () => {
  test("$10,000 loan, 12% annual note rate, 12 months: monthly payment rounds to $888.49", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "10000", rate: "12", term: "12" });
    await expect(resultValue(page, "Estimated monthly payment")).toContainText("$888.49");
  });

  test("$1,200 loan, 0% interest, 12 months: monthly payment is exactly $100", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "1200", rate: "0", term: "12" });
    await expect(resultValue(page, "Estimated monthly payment")).toContainText("$100.00");
    const table = page.locator("table", { has: page.locator("caption", { hasText: "Monthly amortization schedule" }) });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(12);
    // Column order is Month, Starting balance, Payment, Principal,
    // Interest, Ending balance, so the Payment cell is td index 1.
    for (let i = 0; i < 12; i++) {
      await expect(rows.nth(i).locator("td").nth(1)).toHaveText("$100.00");
    }
  });
});

test.describe("Loan payment calculator — schedule reconciliation", () => {
  test("the final scheduled payment clears the loan exactly (no negative balance)", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "10000", rate: "12", term: "12" });
    const table = page.locator("table", { has: page.locator("caption", { hasText: "Monthly amortization schedule" }) });
    const lastRow = table.locator("tbody tr").last();
    await expect(lastRow.locator("td").last()).toHaveText("$0.00");
  });

  test("total amount paid equals loan amount plus estimated total interest", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "10000", rate: "12", term: "12" });
    const totalPaid = await resultValue(page, "Total amount paid").innerText();
    const loanAmount = await resultValue(page, "Loan amount").innerText();
    const totalInterest = await resultValue(page, "Estimated total interest").innerText();
    const parse = (s: string) => Number(s.replace(/[^0-9.-]/g, ""));
    expect(Math.abs(parse(totalPaid) - (parse(loanAmount) + parse(totalInterest)))).toBeLessThan(0.01);
  });
});

test.describe("Loan payment calculator — example mode and wording", () => {
  test("Try an example loads a labeled illustrative scenario", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();
    await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    await expect(resultValue(page, "Estimated monthly payment")).toBeVisible();

    await page.getByLabel(/^Loan amount/).fill("20000");
    await expect(page.getByText("Illustrative example. Edit these assumptions.")).toHaveCount(0);
    await expect(page.getByText(/still show example values/i)).toBeVisible();
  });

  test("public wording rules hold: no em dash, en dash, old timing phrasing, or lender claims", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[–—]/);
    expect(bodyText).not.toContain("End of month");
    expect(bodyText.toLowerCase()).not.toContain("pre-approved");
    expect(bodyText.toLowerCase()).not.toContain("guaranteed approval");
    expect(bodyText.toLowerCase()).not.toContain("refinance today");
  });

  test("states this is an estimate and lender figures may differ", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "10000", rate: "12", term: "12" });
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).toContain("estimate");
    expect(bodyText.toLowerCase()).toContain("real lender schedules may differ");
  });

  test("does not claim or calculate an APR", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await fillRequired(page, { loanAmount: "10000", rate: "12", term: "12" });
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/APR of \d/);
    expect(bodyText.toLowerCase()).toContain("does not calculate or claim an all-in apr");
  });
});
