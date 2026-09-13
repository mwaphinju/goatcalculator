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
});
