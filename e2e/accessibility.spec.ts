import { test, expect } from "@playwright/test";

test.describe("Keyboard accessibility", () => {
  test("the initial balance field can be reached and operated with the keyboard alone", async ({ page }) => {
    await page.goto("/calculators/compound-interest");

    const initialBalance = page.getByLabel(/^Initial balance/);
    await initialBalance.focus();
    await expect(initialBalance).toBeFocused();
    await page.keyboard.type("1500");
    await expect(initialBalance).toHaveValue("1500");
  });

  test("focused controls show a visible focus outline", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    const initialBalance = page.getByLabel(/^Initial balance/);
    await initialBalance.focus();
    const outline = await initialBalance.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("the skip link is the first focusable element and jumps to main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByText("Skip to main content");
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main-content/);
  });

  test("timing radio buttons are operable with the keyboard", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    const beginRadio = page.getByLabel(/^Beginning of month/);
    await beginRadio.focus();
    await page.keyboard.press("Space");
    await expect(beginRadio).toBeChecked();
  });

  test("the assumptions summary <details> can be opened with the keyboard", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("5");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("0");

    const summary = page.getByText("Assumptions used");
    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Compounding frequency")).toBeVisible();
  });
});
