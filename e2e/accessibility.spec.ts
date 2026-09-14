import { test, expect } from "@playwright/test";

test.describe("Keyboard accessibility", () => {
  test("the initial balance field can be reached and operated with the keyboard alone", async ({ page }) => {
    await page.goto("/calculators/compound-interest");

    const initialBalance = page.getByLabel(/^Initial balance/);
    await initialBalance.focus();
    await expect(initialBalance).toBeFocused();
    // Starts at its visible zero default; select it all before typing, the
    // way a keyboard-only visitor would clear it (Ctrl+A, then type).
    await page.keyboard.press("ControlOrMeta+a");
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
    const beginRadio = page.getByLabel(/^Beginning of each month/);
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

  test("the monthly schedule's scroll container is keyboard-focusable and scrollable without a pointer", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("12");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("100");

    const scrollRegion = page.getByRole("region", {
      name: "Monthly schedule table, scrollable horizontally on narrow screens",
    });
    await expect(scrollRegion).toHaveAttribute("tabindex", "0");

    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();

    const before = await scrollRegion.evaluate((el) => el.scrollLeft);
    // Headless Chromium's default keyboard-scroll step for a focused
    // scrollable region is small (a few pixels per press), so press
    // several times rather than relying on one or two presses producing a
    // reliably measurable change.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("ArrowRight");
    }
    const after = await scrollRegion.evaluate((el) => el.scrollLeft);
    expect(after).toBeGreaterThan(before);
  });

  test("a required field's state is exposed to assistive technology, not just shown in color", async ({ page }) => {
    await page.goto("/calculators/compound-interest");
    const rateField = page.getByLabel(/^Nominal annual interest rate/);
    await expect(rateField).toHaveAttribute("aria-required", "true");

    await rateField.focus();
    await rateField.blur();
    // Once invalid/empty and touched, aria-invalid and aria-describedby
    // (pointing at the visible error text) are both present so a screen
    // reader announces the problem, not just a red border.
    await expect(rateField).toHaveAttribute("aria-invalid", "true");
    const describedBy = await rateField.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    if (describedBy) {
      await expect(page.locator(`#${describedBy}`)).toContainText("Enter an annual rate.");
    }
  });

  test("loan payment: a required field's state is exposed to assistive technology", async ({ page }) => {
    await page.goto("/calculators/loan-payment");
    const rateField = page.getByLabel(/^Annual note interest rate/);
    await expect(rateField).toHaveAttribute("aria-required", "true");

    await rateField.focus();
    await rateField.blur();
    await expect(rateField).toHaveAttribute("aria-invalid", "true");
    const describedBy = await rateField.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
  });

  test("loan payment: the monthly amortization schedule's scroll container is keyboard-focusable and scrollable", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/loan-payment");
    await page.getByLabel(/^Loan amount/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Loan term/).fill("12");

    const scrollRegion = page.getByRole("region", {
      name: "Monthly amortization schedule table, scrollable horizontally on narrow screens",
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
  });

  test("loan payoff: the comparison table's scroll container is keyboard-focusable and scrollable", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("6");
    await page.getByLabel(/^Required monthly payment/).fill("200");
    await page.getByLabel(/^Extra monthly payment/).fill("50");

    const scrollRegion = page.getByRole("region", {
      name: "Monthly loan payoff comparison table, scrollable horizontally on narrow screens",
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
  });

  test("savings scenarios: the scenario name field, rate field and comparison table scroll region are all reachable with the keyboard alone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/savings-scenarios");

    // Located by its stable placeholder (the default name), not by the
    // group's accessible name, since renaming the scenario changes that
    // name and would otherwise invalidate the locator mid-test.
    const nameField = page.locator('input[placeholder="Scenario A"]');
    await nameField.focus();
    await expect(nameField).toBeFocused();
    await nameField.fill("My plan");
    await expect(nameField).toHaveValue("My plan");
    await expect(page.getByRole("heading", { name: "My plan" }).first()).toBeVisible();

    const scenarioAGroup = nameField.locator("xpath=ancestor::div[@role='group'][1]");
    const rateA = scenarioAGroup.getByLabel(/^Annual interest rate/);
    await rateA.focus();
    await rateA.fill("5");
    await expect(rateA).toHaveValue("5");

    await page.getByRole("group", { name: "Scenario B" }).getByLabel(/^Annual interest rate/).fill("5");
    await page.getByRole("group", { name: "Scenario C" }).getByLabel(/^Annual interest rate/).fill("5");
    await page.getByLabel(/^Duration/).fill("12");

    const scrollRegion = page.getByRole("region", {
      name: "Scenario comparison table, scrollable horizontally on narrow screens",
    });
    await expect(scrollRegion).toHaveAttribute("tabindex", "0");
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();
  });
});
