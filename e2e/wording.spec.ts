import { test, expect } from "@playwright/test";

const ALL_PUBLIC_ROUTES = [
  "/",
  "/calculators",
  "/calculators/compound-interest",
  "/calculators/savings-goal",
  "/calculators/savings-time",
  "/calculators/savings-comparison",
  "/calculators/loan-payment",
  "/calculators/loan-payoff",
  "/calculators/savings-scenarios",
  "/methodology",
  "/guides",
  "/guides/compound-interest-explained",
  "/guides/how-to-calculate-a-savings-goal",
  "/guides/how-extra-loan-payments-work",
  "/guides/nominal-interest-rate-vs-apy",
  "/guides/inflation-and-buying-power",
];

const FORBIDDEN_HYPHENATED_TERMS = [
  "end-of-month",
  "beginning-of-month",
  "month-by-month",
  "round-half-up",
  "arbitrary-precision",
  "one-time",
  "fixed-rate",
];

// Specific enough to catch an actual promotional claim without matching the
// site's own honest disclaimers, which legitimately contain phrases like
// "not current, typical, recommended, or guaranteed" and "not a guarantee
// of any future return".
const FORBIDDEN_CLAIMS = [
  "is guaranteed",
  "guaranteed return",
  "guaranteed rate",
  "this is the current rate",
  "the typical rate is",
  "we recommend a rate of",
  "testimonial",
  "5-star",
  "trusted by",
  "as seen on",
  "pre-approved",
  "preapproved",
  "guaranteed approval",
  "refinance today",
  "apply now",
  "best scenario",
  "is recommended",
  "we recommend",
  "this will happen",
  "the likely outcome",
  "a safe return",
  "a conservative forecast",
  "an optimistic forecast",
];

for (const route of ALL_PUBLIC_ROUTES) {
  test.describe(`Public wording compliance: ${route}`, () => {
    test("no em dash or en dash anywhere on the page", async ({ page }) => {
      await page.goto(route);
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(/[–—]/);
    });

    test("no forbidden hyphenated terms in visible text", async ({ page }) => {
      await page.goto(route);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      for (const term of FORBIDDEN_HYPHENATED_TERMS) {
        expect(bodyText).not.toContain(term);
      }
    });

    test("uses the corrected timing wording, not the old phrasing", async ({ page }) => {
      await page.goto(route);
      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toContain("End of month");
      expect(bodyText).not.toContain("Beginning of month");
    });

    test("no invented testimonials, guarantees, or current/typical/recommended rate claims", async ({ page }) => {
      await page.goto(route);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      for (const claim of FORBIDDEN_CLAIMS) {
        expect(bodyText).not.toContain(claim);
      }
    });
  });
}

test.describe("Example mode label wording across every calculator that offers one", () => {
  const calculatorsWithExample = [
    "/calculators/compound-interest",
    "/calculators/savings-goal",
    "/calculators/savings-time",
    "/calculators/savings-comparison",
    "/calculators/loan-payment",
    "/calculators/loan-payoff",
    "/calculators/savings-scenarios",
  ];

  for (const route of calculatorsWithExample) {
    test(`${route} uses the exact required example label`, async ({ page }) => {
      await page.goto(route);
      // On most of these calculators, "Try an example" lives inside a
      // closed "Not sure what to enter?" details panel next to the rate
      // field; on the comparison page there is also a standalone, always
      // visible "Try an example" link rendered before that panel in the
      // DOM, so opening the details first (harmless either way) and then
      // clicking the first visible "Try an example" works for all four.
      const helpToggle = page.getByText("Not sure what to enter?").first();
      if (await helpToggle.isVisible()) {
        await helpToggle.click();
      }
      await page.getByText("Try an example").first().click();
      await expect(page.getByText("Illustrative example. Edit these assumptions.").first()).toBeVisible();
    });
  }
});

test.describe("No mortgage, auto loan, credit card, lender approval or refinancing advice anywhere", () => {
  for (const route of ALL_PUBLIC_ROUTES) {
    test(`${route} does not mention out-of-scope loan products or lender approval`, async ({ page }) => {
      await page.goto(route);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      for (const forbidden of [
        "mortgage",
        "auto loan",
        "car loan",
        "credit card",
        "pre-approved",
        "preapproved",
        "guaranteed approval",
        "provider recommendation",
      ]) {
        expect(bodyText).not.toContain(forbidden);
      }
    });
  }

  for (const route of ["/calculators/loan-payment", "/calculators/loan-payoff"]) {
    test(`${route} does not claim or calculate an all-in APR`, async ({ page }) => {
      await page.goto(route);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      expect(bodyText).not.toMatch(/\bapr of \d/);
      expect(bodyText).not.toMatch(/\byour apr is\b/);
    });

    test(`${route} does not recommend refinancing or claim it is suitable`, async ({ page }) => {
      await page.goto(route);
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      expect(bodyText).not.toMatch(/refinanc\w* is (a good|suitable|recommended)/);
    });
  }
});
