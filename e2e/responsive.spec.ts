import { test, expect } from "@playwright/test";

const viewports = [
  { name: "320px (small phone)", width: 320, height: 700 },
  { name: "390px (phone)", width: 390, height: 844 },
  { name: "768px (tablet)", width: 768, height: 1024 },
  { name: "1440px (desktop)", width: 1440, height: 900 },
];

for (const vp of viewports) {
  test.describe(`Usability at ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("compound-interest page has no horizontal overflow", async ({ page }) => {
      await page.goto("/calculators/compound-interest");
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasOverflow).toBe(false);
    });

    test("inputs and results are both reachable after filling the form", async ({ page }) => {
      await page.goto("/calculators/compound-interest");
      await page.getByLabel(/^Initial balance/).fill("1000");
      await page.getByLabel(/^Nominal annual interest rate/).fill("12");
      await page.getByLabel(/^Duration/).fill("12");
      await page.getByLabel(/^Monthly contribution/).fill("0");
      await expect(page.getByText("Final balance", { exact: true })).toBeVisible();

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasOverflow).toBe(false);
    });
  });
}

test.describe("Extreme values at the documented limits", () => {
  test("very large results do not cause horizontal page overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("10000000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("100");
    await page.getByLabel(/^Duration/).fill("600");
    await page.getByLabel(/^Monthly contribution/).fill("1000000");
    await expect(page.getByText("Final balance", { exact: true })).toBeVisible();

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });
});

test.describe("Results position relative to inputs", () => {
  test("on desktop, results sit beside inputs (side by side)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/calculators/compound-interest");
    const inputsBox = await page.getByRole("heading", { name: "Your scenario" }).boundingBox();
    const resultsBox = await page.getByRole("heading", { name: "Projection" }).boundingBox();
    expect(inputsBox && resultsBox).toBeTruthy();
    if (inputsBox && resultsBox) {
      // Side-by-side means roughly the same vertical position, different horizontal position.
      expect(Math.abs(inputsBox.y - resultsBox.y)).toBeLessThan(20);
      expect(resultsBox.x).toBeGreaterThan(inputsBox.x + inputsBox.width / 2);
    }
  });

  test("on mobile, results appear below inputs in document order", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculators/compound-interest");
    const inputsBox = await page.getByRole("heading", { name: "Your scenario" }).boundingBox();
    const resultsBox = await page.getByRole("heading", { name: "Projection" }).boundingBox();
    expect(inputsBox && resultsBox).toBeTruthy();
    if (inputsBox && resultsBox) {
      expect(resultsBox.y).toBeGreaterThan(inputsBox.y);
    }
  });
});
