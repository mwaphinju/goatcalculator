import { test, expect, type Page, type Locator } from "@playwright/test";

function resultValue(page: Page, label: string): Locator {
  return page.locator(`dl > div:has(dt:text-is("${label}")) dd`).first();
}

async function fillRequired(
  page: Page,
  opts: {
    balance?: string;
    rate?: string;
    requiredPayment?: string;
    extraMonthly?: string;
    oneTimeExtra?: string;
    oneTimeExtraMonth?: string;
  },
) {
  if (opts.balance !== undefined) {
    await page.getByLabel(/^Current loan balance/).fill(opts.balance);
  }
  if (opts.rate !== undefined) {
    await page.getByLabel(/^Annual note interest rate/).fill(opts.rate);
  }
  if (opts.requiredPayment !== undefined) {
    await page.getByLabel(/^Required monthly payment/).fill(opts.requiredPayment);
  }
  if (opts.extraMonthly !== undefined) {
    await page.getByLabel(/^Extra monthly payment/).fill(opts.extraMonthly);
  }
  if (opts.oneTimeExtra !== undefined) {
    await page.getByLabel(/^One time extra payment/).fill(opts.oneTimeExtra);
  }
  if (opts.oneTimeExtraMonth !== undefined) {
    await page.getByLabel(/^Month for one time extra payment/).fill(opts.oneTimeExtraMonth);
  }
}

test.describe("Loan payoff calculator — default and required field policy", () => {
  test("balance, rate and required payment start blank and Required; extras default to visible zero", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    const balance = page.getByLabel(/^Current loan balance/);
    const rate = page.getByLabel(/^Annual note interest rate/);
    const requiredPayment = page.getByLabel(/^Required monthly payment/);
    await expect(balance).toHaveValue("");
    await expect(rate).toHaveValue("");
    await expect(requiredPayment).toHaveValue("");
    await expect(balance).toHaveAttribute("aria-required", "true");
    await expect(rate).toHaveAttribute("aria-required", "true");
    await expect(requiredPayment).toHaveAttribute("aria-required", "true");

    await expect(page.getByLabel(/^Extra monthly payment/)).toHaveValue("0");
    await expect(page.getByLabel(/^One time extra payment/)).toHaveValue("0");
  });

  test("month for one time extra payment visibly defaults to 1", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await expect(page.getByLabel(/^Month for one time extra payment/)).toHaveValue("1");
  });

  test("clearing a default zero extra field restores it to 0 on blur, rather than staying blank", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    const extra = page.getByLabel(/^Extra monthly payment/);
    await extra.fill("");
    await expect(extra).toHaveValue("");
    await extra.blur();
    await expect(extra).toHaveValue("0");
  });

  test("no result appears until balance, rate and required payment are all filled", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await expect(page.getByText("Baseline payoff duration")).toHaveCount(0);
    await fillRequired(page, { balance: "10000", rate: "6" });
    await expect(page.getByText("Baseline payoff duration")).toHaveCount(0);
    await fillRequired(page, { requiredPayment: "200" });
    await expect(page.getByText("Baseline payoff duration")).toBeVisible();
  });

  test("a zero or blank required payment is rejected, not silently treated as valid", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "10000", rate: "6", requiredPayment: "0" });
    await expect(page.getByText(/must be greater than 0/i).first()).toBeVisible();
  });
});

test.describe("Loan payoff calculator — required fixtures", () => {
  test("zero extras: the extra-payment scenario exactly matches the baseline", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "10000", rate: "6", requiredPayment: "200" });
    const baselineDuration = await resultValue(page, "Baseline payoff duration").innerText();
    const extraDuration = await resultValue(page, "Extra payment payoff duration").innerText();
    expect(baselineDuration).toBe(extraDuration);
    await expect(resultValue(page, "Months saved")).toContainText("0");
  });

  test("baseline $10,000 @ 6%, $200/month: pays off in 4 years, 10 months (58 months)", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "10000", rate: "6", requiredPayment: "200" });
    await expect(resultValue(page, "Baseline payoff duration")).toContainText("4 years, 10 months");
  });

  test("a recurring extra monthly payment reduces payoff duration and interest", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "10000", rate: "6", requiredPayment: "200", extraMonthly: "50" });
    await expect(resultValue(page, "Extra payment payoff duration")).toContainText("3 years, 9 months");
    await expect(resultValue(page, "Months saved")).toContainText("13");
    const interestSaved = await resultValue(page, "Estimated interest saved").innerText();
    expect(Number(interestSaved.replace(/[^0-9.]/g, ""))).toBeGreaterThan(0);
  });

  test("a one time extra payment applies in the requested month", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, {
      balance: "10000",
      rate: "6",
      requiredPayment: "200",
      oneTimeExtra: "1000",
      oneTimeExtraMonth: "6",
    });
    await expect(resultValue(page, "Extra payment payoff duration")).toContainText("4 years, 4 months");
    await expect(page.locator(".border-amber.bg-amber-soft", { hasText: "was not applied" })).toHaveCount(0);
  });

  test("an oversized one time extra is capped, and the unused portion is shown", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, {
      balance: "10000",
      rate: "6",
      requiredPayment: "200",
      oneTimeExtra: "50000",
      oneTimeExtraMonth: "1",
    });
    await expect(resultValue(page, "Extra payment payoff duration")).toContainText("1 month");
    const unusedWarning = page.locator(".border-amber.bg-amber-soft", { hasText: "was not applied" });
    await expect(unusedWarning).toContainText("$40,150.00");
    await expect(unusedWarning).toContainText(/not counted as paid/i);
  });

  test("a required payment below monthly interest produces a non-amortizing result, with no invented payoff date", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "10000", rate: "12", requiredPayment: "50" });
    await expect(page.getByText(/does not decrease under this payment/i).first()).toBeVisible();
    await expect(page.getByText(/minimum payment needed to cover just the first month's interest is \$100\.00/i).first()).toBeVisible();
    await expect(page.getByText("Baseline payoff duration")).toHaveCount(0);
    await expect(resultValue(page, "Estimated interest saved")).toHaveCount(0);
  });

  test("zero interest payoff behaves correctly", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "1200", rate: "0", requiredPayment: "100" });
    await expect(resultValue(page, "Baseline payoff duration")).toContainText("1 year");
    await expect(resultValue(page, "Baseline total interest")).toContainText("$0.00");
  });

  test("maximum horizon behavior: an extremely slow scenario reports the documented maximum, not an invented date", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "1000000", rate: "1", requiredPayment: "840" });
    await expect(page.getByText(/not paid off within the documented maximum of 1200 months/i).first()).toBeVisible();
  });
});

test.describe("Loan payoff calculator — reconciliation", () => {
  test("total paid equals total interest plus the current balance for an amortizing baseline", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await fillRequired(page, { balance: "10000", rate: "6", requiredPayment: "200" });
    const totalPaid = await resultValue(page, "Baseline total paid").innerText();
    const totalInterest = await resultValue(page, "Baseline total interest").innerText();
    const parse = (s: string) => Number(s.replace(/[^0-9.-]/g, ""));
    expect(Math.abs(parse(totalPaid) - (10000 + parse(totalInterest)))).toBeLessThan(0.01);
  });
});

test.describe("Loan payoff calculator — example mode and wording", () => {
  test("Try an example loads a labeled illustrative scenario", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();
    await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    await expect(page.getByText("Baseline payoff duration")).toBeVisible();

    await page.getByLabel(/^Current loan balance/).fill("20000");
    await expect(page.getByText("Illustrative example. Edit these assumptions.")).toHaveCount(0);
    await expect(page.getByText(/still show example values/i)).toBeVisible();
  });

  test("public wording rules hold: no em dash, en dash, old timing phrasing, or lender claims", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/[–—]/);
    expect(bodyText).not.toContain("End of month");
    expect(bodyText.toLowerCase()).not.toContain("pre-approved");
    expect(bodyText.toLowerCase()).not.toContain("guaranteed approval");
    expect(bodyText.toLowerCase()).not.toContain("refinance today");
    expect(bodyText.toLowerCase()).not.toContain("is suitable for you to refinance");
  });

  test("does not recommend refinancing or claim it is suitable", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toMatch(/refinanc\w* is (a good|suitable|recommended)/);
  });
});
