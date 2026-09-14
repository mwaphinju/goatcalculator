import { test, expect } from "@playwright/test";

const IMPLEMENTED_CALCULATOR_ROUTES = [
  "/calculators/compound-interest",
  "/calculators/savings-goal",
  "/calculators/savings-time",
  "/calculators/savings-comparison",
  "/calculators/loan-payment",
  "/calculators/loan-payoff",
  "/calculators/savings-scenarios",
];

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
    await expect(links).toHaveCount(IMPLEMENTED_CALCULATOR_ROUTES.length);
    const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
    expect(new Set(hrefs)).toEqual(new Set(IMPLEMENTED_CALCULATOR_ROUTES));
  });

  test("/calculators/compound-interest loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/compound-interest");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Compound interest calculator" }),
    ).toBeVisible();
  });

  test("/calculators/savings-goal loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/savings-goal");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Savings goal calculator" }),
    ).toBeVisible();
  });

  test("/calculators/savings-time loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/savings-time");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Savings time calculator" }),
    ).toBeVisible();
  });

  test("/calculators/savings-comparison loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/savings-comparison");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Savings comparison calculator" }),
    ).toBeVisible();
  });

  test("/calculators/loan-payment loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/loan-payment");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Loan payment calculator" }),
    ).toBeVisible();
  });

  test("/calculators/loan-payoff loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/loan-payoff");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Loan payoff calculator" }),
    ).toBeVisible();
  });

  test("/calculators/savings-scenarios loads directly", async ({ page }) => {
    const response = await page.goto("/calculators/savings-scenarios");
    expect(response?.status()).toBeLessThan(400);
    await expect(
      page.getByRole("heading", { level: 1, name: "Savings scenario calculator" }),
    ).toBeVisible();
  });

  test("/methodology loads directly", async ({ page }) => {
    const response = await page.goto("/methodology");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1, name: "Methodology" })).toBeVisible();
  });

  test("homepage links directly to the working compound interest calculator", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /try the compound interest calculator/i }).click();
    await expect(page).toHaveURL(/\/calculators\/compound-interest/);
  });

  test("homepage links to all seven calculators", async ({ page }) => {
    await page.goto("/");
    for (const route of IMPLEMENTED_CALCULATOR_ROUTES) {
      await expect(page.locator(`a[href='${route}']`).first()).toBeVisible();
    }
  });

  test("no route links to a mortgage, auto loan, credit card or lender referral", async ({ page }) => {
    await page.goto("/calculators");
    const bodyText = (await page.locator("body").innerText()).toLowerCase();
    for (const forbidden of ["mortgage", "auto loan", "car loan", "credit card", "refinance today"]) {
      expect(bodyText).not.toContain(forbidden);
    }
  });
});
