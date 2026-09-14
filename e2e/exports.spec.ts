import { test, expect, type Page } from "@playwright/test";

async function readDownload(page: Page, trigger: () => Promise<void>): Promise<string> {
  const [download] = await Promise.all([page.waitForEvent("download"), trigger()]);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  if (stream) {
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
  }
  return Buffer.concat(chunks).toString("utf-8");
}

test.describe("CSV export", () => {
  test("savings goal CSV includes calculator name, generated date, assumptions and the schedule, and reconciles with the displayed result", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await page.getByLabel(/^Target balance/).fill("10000");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("0");

    const requiredValue = await page
      .locator(`dl > div:has(dt:text-is("Required monthly saving")) dd`)
      .innerText();

    const csv = await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });

    expect(csv).toContain("GOAT Calculator: Savings goal calculator");
    expect(csv).toMatch(/Generated,.+\d{4}/);
    expect(csv).toContain("Rate type");
    expect(csv).toContain("Contribution timing");
    // Quoted per CSV rules because the field itself contains a comma.
    expect(csv).toContain('"Excludes taxes, fees, inflation and variable rates",Yes');
    expect(csv).toContain("Month,Starting balance,Contribution,Interest earned,Ending balance");
    // The CSV's reported required contribution matches what is displayed on screen.
    expect(csv).toContain(`Required monthly contribution,${requiredValue.trim()}`);
  });

  test("savings time CSV includes the schedule and reconciles with the displayed final balance", async ({ page }) => {
    await page.goto("/calculators/savings-time");
    await page.getByLabel(/^Target balance/).fill("1200");
    await page.getByLabel(/^Monthly contribution/).fill("100");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("0");

    const finalBalance = await page
      .locator(`dl > div:has(dt:text-is("Final balance")) dd`)
      .innerText();

    const csv = await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });

    expect(csv).toContain("GOAT Calculator: Savings time calculator");
    expect(csv).toContain("Months to reach target,12");
    // Quoted per CSV rules because "$1,200.00" itself contains a comma.
    expect(csv).toContain(`Final balance,"${finalBalance.trim()}"`);
    expect(csv).toContain("Month,Starting balance,Contribution,Interest earned,Ending balance");
  });

  test("savings comparison CSV includes both scenarios and the monthly comparison rows", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await page.getByText("Try an example").first().click();

    const csv = await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });

    expect(csv).toContain("GOAT Calculator: Savings comparison calculator");
    expect(csv).toContain("Baseline");
    expect(csv).toContain("Alternative");
    expect(csv).toContain("Final balance difference");
    expect(csv).toContain("Month,Baseline balance,Alternative balance,Difference");
  });

  test("loan payment CSV includes assumptions and the amortization schedule, and reconciles with the displayed payment", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await page.getByLabel(/^Loan amount/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Loan term/).fill("12");

    const paymentValue = await page
      .locator(`dl > div:has(dt:text-is("Estimated monthly payment")) dd`)
      .innerText();

    const csv = await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });

    expect(csv).toContain("GOAT Calculator: Loan payment calculator");
    expect(csv).toMatch(/Generated,.+\d{4}/);
    expect(csv).toContain("Payment frequency,Monthly");
    expect(csv).toContain('"Excludes fees, taxes, insurance, escrow and APR",Yes');
    expect(csv).toContain("Month,Starting balance,Payment,Principal,Interest,Ending balance");
    expect(csv).toContain(`Estimated monthly payment,${paymentValue.trim()}`);
  });

  test("loan payoff CSV includes both scenarios and the monthly comparison rows", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("6");
    await page.getByLabel(/^Required monthly payment/).fill("200");
    await page.getByLabel(/^Extra monthly payment/).fill("50");

    const csv = await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });

    expect(csv).toContain("GOAT Calculator: Loan payoff calculator");
    expect(csv).toContain("Baseline result,amortizing");
    expect(csv).toContain("Extra payment result,amortizing");
    expect(csv).toContain("Months saved,13");
    expect(csv).toContain("Month,Baseline balance,Extra payment balance");
  });

  test("savings scenarios CSV includes all three scenarios, assumptions, and the monthly schedule", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();

    const csv = await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });

    expect(csv).toContain("GOAT Calculator: Savings scenario calculator");
    expect(csv).toMatch(/Generated,.+\d{4}/);
    expect(csv).toContain("Scenario A");
    expect(csv).toContain("Scenario B");
    expect(csv).toContain("Scenario C");
    expect(csv).toContain(
      "Scenario,Annual interest rate (%),Monthly contribution,Monthly account fee,Final balance,Estimated buying power in today's money,Total contributions,Total interest earned,Total fees deducted",
    );
    expect(csv).toContain("Scenario labels are for comparison only and are not predictions,Yes");
    expect(csv).toContain(
      "Month,Scenario A balance,Scenario A contribution,Scenario A interest,Scenario A fee,Scenario B balance",
    );
  });

  test("no financial values appear in the page URL after downloading", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await page.getByLabel(/^Target balance/).fill("12345");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("7");
    await readDownload(page, async () => {
      await page.getByRole("button", { name: "Download CSV" }).click();
    });
    // No query string at all, and specifically not the entered target amount.
    expect(page.url()).not.toContain("?");
    expect(page.url()).not.toContain("12345");
  });
});

test.describe("Print-friendly view", () => {
  test("savings goal: header, footer and action buttons are hidden when printing, and assumptions are forced open", async ({ page }) => {
    await page.goto("/calculators/savings-goal");
    await page.getByLabel(/^Target balance/).fill("10000");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("5");

    // Confirm the assumptions <details> starts closed on screen.
    const detailsWithSchedule = page.locator("details", { has: page.getByText("Contribution timing") });
    await expect(detailsWithSchedule).not.toHaveJSProperty("open", true);

    await page.emulateMedia({ media: "print" });

    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.locator("footer").first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Print this result" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Download CSV" })).toBeHidden();

    // `emulateMedia` only changes CSS media resolution, it doesn't fire the
    // real beforeprint/afterprint events a visitor's print action would,
    // so dispatch beforeprint the way window.print() or Ctrl+P would, and
    // confirm the app's print handler opens the assumptions panel that was
    // never clicked open on screen. "Contribution timing" is a dt unique
    // to that panel (the radio legend nearby uses different wording).
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(detailsWithSchedule).toHaveJSProperty("open", true);
    await expect(page.getByText("Contribution timing")).toBeVisible();

    // And afterprint restores it to how the visitor had left it.
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(detailsWithSchedule).toHaveJSProperty("open", false);
  });

  test("savings comparison: print view hides chrome but keeps the comparison content", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");
    await page.getByText("Try an example").first().click();

    await page.emulateMedia({ media: "print" });

    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Print this result" })).toBeHidden();
    await expect(page.getByText("Final balance difference")).toBeVisible();
  });

  test("loan payment: print view hides chrome, forces assumptions open, and keeps the schedule", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    await page.getByLabel(/^Loan amount/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Loan term/).fill("12");

    const detailsWithAssumptions = page.locator("details", { has: page.getByText("Payment frequency") });
    await expect(detailsWithAssumptions).not.toHaveJSProperty("open", true);

    await page.emulateMedia({ media: "print" });
    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Print this result" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Download CSV" })).toBeHidden();

    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(detailsWithAssumptions).toHaveJSProperty("open", true);
    await expect(page.getByText("Payment frequency", { exact: true })).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(detailsWithAssumptions).toHaveJSProperty("open", false);
  });

  test("loan payoff: print view hides chrome but keeps the comparison content", async ({ page }) => {
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("6");
    await page.getByLabel(/^Required monthly payment/).fill("200");
    await page.getByLabel(/^Extra monthly payment/).fill("50");

    await page.emulateMedia({ media: "print" });

    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Print this result" })).toBeHidden();
    await expect(page.getByText("Months saved")).toBeVisible();
  });

  test("savings scenarios: print view hides chrome, forces assumptions open, and keeps the comparison", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();

    const detailsWithAssumptions = page.locator("details", { has: page.getByText("Contribution timing") });
    await expect(detailsWithAssumptions).not.toHaveJSProperty("open", true);

    await page.emulateMedia({ media: "print" });
    await expect(page.locator("header").first()).toBeHidden();
    await expect(page.getByRole("button", { name: "Print this result" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Download CSV" })).toBeHidden();

    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(detailsWithAssumptions).toHaveJSProperty("open", true);
    await expect(page.locator("dt", { hasText: "Contribution timing" })).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await expect(detailsWithAssumptions).toHaveJSProperty("open", false);
  });
});
