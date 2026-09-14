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

    test("a normal currency result stays on one line, not wrapped mid-amount", async ({ page }) => {
      // This is the exact scenario ($18,207.33 final balance) the reviewer
      // flagged as wrapping across lines inside its stat card.
      await page.goto("/calculators/compound-interest");
      await page.getByLabel(/^Initial balance/).fill("1000");
      await page.getByLabel(/^Nominal annual interest rate/).fill("6");
      await page.getByLabel(/^Duration/).fill("120");
      await page.getByLabel(/^Monthly contribution/).fill("100");

      const finalBalanceValue = page
        .locator("dl > div", { has: page.locator("dt", { hasText: "Final balance" }) })
        .locator("dd");
      await expect(finalBalanceValue).toContainText("$18,207.33");

      const isSingleLine = await finalBalanceValue.evaluate((el) => {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        return el.clientHeight <= lineHeight * 1.5;
      });
      expect(isSingleLine).toBe(true);

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

test.describe("Monthly schedule scroll hint appears only when the table doesn't fit", () => {
  async function fillTwelveMonthScenario(page: import("@playwright/test").Page) {
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("12");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("100");
  }

  // At 320/390px the results column is the full (narrow) viewport width, so
  // the table doesn't fit. At 1440px the page switches to its two-column
  // inputs/results layout, and the results column is capped by the page's
  // own max-width container (well under the table's minimum width) no
  // matter how wide the browser window is — so the table genuinely doesn't
  // fit there either, and the hint is correct to appear.
  for (const width of [320, 390, 1440]) {
    test(`hint is visible at ${width}px, where the table doesn't fit its column`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await fillTwelveMonthScenario(page);
      await expect(page.getByText("Scroll to view all columns.")).toBeVisible();

      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasOverflow).toBe(false);
    });
  }

  // At 768px the page is still in its single-column (stacked) layout, so
  // the results section gets the full page width, comfortably wider than
  // the table's minimum width — no scrolling needed, so no hint.
  test("hint is not shown at 768px, where the table fits without scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await fillTwelveMonthScenario(page);
    await expect(page.getByText("Scroll to view all columns.")).toHaveCount(0);
  });

  test("financial values in the schedule are not truncated at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await fillTwelveMonthScenario(page);
    const scrollRegion = page.getByRole("region", {
      name: "Monthly schedule table, scrollable horizontally on narrow screens",
    });
    const lastRow = scrollRegion.locator("tbody tr").last();
    await expect(lastRow.locator("td").last()).toHaveText("$2,395.08");
  });
});

test.describe("New Phase 2 calculators: usability at all required widths", () => {
  const routes = [
    { path: "/calculators/savings-goal", label: "savings goal" },
    { path: "/calculators/savings-time", label: "savings time" },
    { path: "/calculators/savings-comparison", label: "savings comparison" },
  ];
  const widths = [320, 390, 768, 1440];

  for (const route of routes) {
    for (const width of widths) {
      test(`${route.label} page has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route.path);
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(hasOverflow).toBe(false);
      });
    }
  }

  test("savings comparison scenarios stack to one column on mobile and sit side by side on desktop", async ({ page }) => {
    await page.goto("/calculators/savings-comparison");

    await page.setViewportSize({ width: 390, height: 900 });
    const baselineMobile = await page.getByRole("group", { name: "Baseline scenario" }).boundingBox();
    const alternativeMobile = await page.getByRole("group", { name: "Alternative scenario" }).boundingBox();
    expect(baselineMobile && alternativeMobile).toBeTruthy();
    if (baselineMobile && alternativeMobile) {
      expect(alternativeMobile.y).toBeGreaterThan(baselineMobile.y);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    const baselineDesktop = await page.getByRole("group", { name: "Baseline scenario" }).boundingBox();
    const alternativeDesktop = await page.getByRole("group", { name: "Alternative scenario" }).boundingBox();
    expect(baselineDesktop && alternativeDesktop).toBeTruthy();
    if (baselineDesktop && alternativeDesktop) {
      expect(Math.abs(baselineDesktop.y - alternativeDesktop.y)).toBeLessThan(20);
      expect(alternativeDesktop.x).toBeGreaterThan(baselineDesktop.x + baselineDesktop.width / 2);
    }
  });

  test("savings comparison table scroll hint appears only when it doesn't fit, and no page overflow results", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/savings-comparison");
    await page.getByText("Try an example").first().click();
    await expect(page.getByText("Scroll to view all columns.")).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });

  test("savings goal result amounts stay readable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/savings-goal");
    await page.getByLabel(/^Target balance/).fill("20000");
    await page.getByLabel(/^Duration/).fill("60");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("6");

    const requiredValue = page
      .locator("dl > div", { has: page.locator("dt", { hasText: "Required monthly saving" }) })
      .locator("dd");
    await expect(requiredValue).toContainText("$286.66");
    const isSingleLine = await requiredValue.evaluate((el) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      return el.clientHeight <= lineHeight * 1.5;
    });
    expect(isSingleLine).toBe(true);
  });
});

test.describe("Phase 3 loan calculators: usability at all required widths", () => {
  const routes = [
    { path: "/calculators/loan-payment", label: "loan payment" },
    { path: "/calculators/loan-payoff", label: "loan payoff" },
  ];
  const widths = [320, 390, 768, 1440];

  for (const route of routes) {
    for (const width of widths) {
      test(`${route.label} page has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route.path);
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(hasOverflow).toBe(false);
      });
    }
  }

  test("loan payment result amounts stay readable and on one line at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/loan-payment");
    await page.getByLabel(/^Loan amount/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Loan term/).fill("12");

    const paymentValue = page
      .locator("dl > div", { has: page.locator("dt", { hasText: "Estimated monthly payment" }) })
      .locator("dd");
    await expect(paymentValue).toContainText("$888.49");
    const isSingleLine = await paymentValue.evaluate((el) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      return el.clientHeight <= lineHeight * 1.5;
    });
    expect(isSingleLine).toBe(true);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });

  test("loan payoff comparison stays readable and overflow free at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("6");
    await page.getByLabel(/^Required monthly payment/).fill("200");
    await page.getByLabel(/^Extra monthly payment/).fill("50");

    const savedValue = page
      .locator("dl > div", { has: page.locator("dt", { hasText: "Estimated interest saved" }) })
      .locator("dd");
    await expect(savedValue).toBeVisible();
    const isSingleLine = await savedValue.evaluate((el) => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      return el.clientHeight <= lineHeight * 1.5;
    });
    expect(isSingleLine).toBe(true);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });

  test("loan schedule scroll hint appears only when the table doesn't fit, and no page overflow results", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/loan-payment");
    await page.getByLabel(/^Loan amount/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Loan term/).fill("12");
    await expect(page.getByText("Scroll to view all columns.")).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });
});

test.describe("Phase 4 savings scenario calculator: usability at all required widths", () => {
  const widths = [320, 390, 768, 1440];

  for (const width of widths) {
    test(`savings scenarios page has no horizontal overflow at ${width}px with a full result shown`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/calculators/savings-scenarios");
      await page.getByText("Not sure what to enter?").click();
      await page.getByRole("button", { name: "Try an example" }).click();
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(hasOverflow).toBe(false);
    });
  }

  test("three scenario input groups stack to one column on mobile and sit side by side on desktop", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");

    await page.setViewportSize({ width: 390, height: 900 });
    const aMobile = await page.getByRole("group", { name: "Scenario A" }).boundingBox();
    const bMobile = await page.getByRole("group", { name: "Scenario B" }).boundingBox();
    expect(aMobile && bMobile).toBeTruthy();
    if (aMobile && bMobile) {
      expect(bMobile.y).toBeGreaterThan(aMobile.y);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    const aDesktop = await page.getByRole("group", { name: "Scenario A" }).boundingBox();
    const bDesktop = await page.getByRole("group", { name: "Scenario B" }).boundingBox();
    expect(aDesktop && bDesktop).toBeTruthy();
    if (aDesktop && bDesktop) {
      expect(Math.abs(aDesktop.y - bDesktop.y)).toBeLessThan(20);
      expect(bDesktop.x).toBeGreaterThan(aDesktop.x + aDesktop.width / 2);
    }
  });

  test("savings scenarios monthly schedule scroll hint appears only when it doesn't fit, and no page overflow results", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();
    await expect(page.getByText("Scroll to view all columns.").first()).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });

  test("three scenarios remain distinguishable without color alone (each chart line has its own dash pattern)", async ({ page }) => {
    await page.goto("/calculators/savings-scenarios");
    await page.getByText("Not sure what to enter?").click();
    await page.getByRole("button", { name: "Try an example" }).click();
    const paths = page.locator("figure svg path");
    await expect(paths).toHaveCount(3);
    const dasharrays = await paths.evaluateAll((els) => els.map((el) => el.getAttribute("stroke-dasharray")));
    expect(new Set(dasharrays).size).toBe(3);
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

test.describe("Phase 5 guide pages: usability at all required widths", () => {
  const guideRoutes = [
    "/guides",
    "/guides/compound-interest-explained",
    "/guides/how-to-calculate-a-savings-goal",
    "/guides/how-extra-loan-payments-work",
    "/guides/nominal-interest-rate-vs-apy",
    "/guides/inflation-and-buying-power",
  ];
  const widths = [320, 390, 768, 1440];

  for (const route of guideRoutes) {
    for (const width of widths) {
      test(`${route} has no horizontal overflow at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        const hasOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(hasOverflow).toBe(false);
      });
    }
  }

  test("a guide's worked-example table does not cause page overflow at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/guides/how-extra-loan-payments-work");
    await expect(page.getByRole("heading", { name: "Worked example" })).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });
});
