import { test, expect } from "@playwright/test";

test.describe("Direct navigation to implemented routes", () => {
  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "See what your money could do.",
    );
  });

  test("/calculators loads and only links to implemented tools", async ({ page }) => {
    const response = await page.goto("/calculators");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: "Calculators" })).toBeVisible();
    const links = page.locator("main a[href^='/calculators/']");
    await expect(links).toHaveCount(1);
    await expect(links.first()).toHaveAttribute("href", "/calculators/compound-interest");
  });

  test("/calculators/compound-interest loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/compound-interest");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Compound interest calculator" }),
    ).toBeVisible();
  });

  test("/methodology loads directly", async ({ page }) => {
    const response = await page.goto("/methodology");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: "Methodology" })).toBeVisible();
  });

  test("homepage links directly to the working calculator", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /try the compound interest calculator/i }).click();
    await expect(page).toHaveURL(/\/calculators\/compound-interest/);
  });
});
