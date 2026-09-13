import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const DIR = "screenshots";

test.beforeAll(() => {
  mkdirSync(DIR, { recursive: true });
});

test.describe("Screenshots of key UI states", () => {
  test("home page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page.screenshot({ path: `${DIR}/01-home.png`, fullPage: true });
  });

  test("calculators listing", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/calculators");
    await page.screenshot({ path: `${DIR}/02-calculators.png`, fullPage: true });
  });

  test("compound interest — empty/missing-information state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/calculators/compound-interest");
    await page.screenshot({ path: `${DIR}/03-ci-empty-state.png`, fullPage: false });
  });

  test("compound interest — example mode", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto("/calculators/compound-interest");
    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();
    await page.screenshot({ path: `${DIR}/04-ci-example-mode.png`, fullPage: true });
  });

  test("compound interest — user scenario with residue notice", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.goto("/calculators/compound-interest");
    await page.getByText("Not sure what to enter?").first().click();
    await page.getByRole("button", { name: "Try an example" }).first().click();
    await page.getByLabel(/^Nominal annual interest rate/).fill("7");
    await page.screenshot({ path: `${DIR}/05-ci-residue-notice.png`, fullPage: true });
  });

  test("compound interest — valid user scenario with full results", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("12");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("100");
    await page.getByText("Assumptions used").click();
    await page.screenshot({ path: `${DIR}/06-ci-full-result.png`, fullPage: true });
  });

  test("compound interest — validation error state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("-100");
    await page.getByLabel(/^Nominal annual interest rate/).fill("5");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("0");
    await page.screenshot({ path: `${DIR}/07-ci-validation-error.png`, fullPage: false });
  });

  test("methodology page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/methodology");
    await page.screenshot({ path: `${DIR}/08-methodology.png`, fullPage: true });
  });

  test("compound interest — mobile 390px, results below inputs", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("12");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("100");
    await page.screenshot({ path: `${DIR}/09-ci-mobile-390.png`, fullPage: true });
  });

  test("compound interest — 320px small phone, empty state", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/compound-interest");
    await page.screenshot({ path: `${DIR}/10-ci-320.png`, fullPage: true });
  });

  test("compound interest — 320px small phone, results filled in", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("12");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("100");
    await page.screenshot({ path: `${DIR}/11-ci-320-results.png`, fullPage: true });
  });

  test("compound interest — 320px monthly schedule scroll hint", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/compound-interest");
    await page.getByLabel(/^Initial balance/).fill("1000");
    await page.getByLabel(/^Nominal annual interest rate/).fill("12");
    await page.getByLabel(/^Duration/).fill("12");
    await page.getByLabel(/^Monthly contribution/).fill("100");

    const heading = page.getByRole("heading", { name: "Monthly schedule" });
    await heading.scrollIntoViewIfNeeded();
    const headingBox = await heading.boundingBox();
    const scrollRegion = page.getByRole("region", {
      name: "Monthly schedule table, scrollable horizontally on narrow screens",
    });
    const regionBox = await scrollRegion.boundingBox();

    if (headingBox && regionBox) {
      await page.screenshot({
        path: `${DIR}/12-ci-320-schedule-scroll-hint.png`,
        clip: {
          x: 0,
          y: Math.max(headingBox.y - 12, 0),
          width: 320,
          height: Math.min(regionBox.y + regionBox.height - headingBox.y + 24, 700 - (headingBox.y - 12)),
        },
      });
    }
  });

  test("compound interest — initial state showing the blank required rate (Phase 2 retrofit)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/calculators/compound-interest");
    await page.screenshot({ path: `${DIR}/13-ci-retrofit-blank-required-rate.png`, fullPage: false });
  });

  test("savings goal — with a result", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1600 });
    await page.goto("/calculators/savings-goal");
    await page.getByLabel(/^Target balance/).fill("20000");
    await page.getByLabel(/^Duration/).fill("60");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("6");
    await page.getByText("Assumptions used").click();
    await page.screenshot({ path: `${DIR}/14-savings-goal-result.png`, fullPage: true });
  });

  test("savings time — with a reachable target", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1600 });
    await page.goto("/calculators/savings-time");
    await page.getByLabel(/^Target balance/).fill("20000");
    await page.getByLabel(/^Monthly contribution/).fill("300");
    await page.getByRole("textbox", { name: /^Nominal annual rate/ }).fill("6");
    await page.screenshot({ path: `${DIR}/15-savings-time-result.png`, fullPage: true });
  });

  test("savings comparison — at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/savings-comparison");
    await page.getByText("Try an example").first().click();
    await page.screenshot({ path: `${DIR}/16-savings-comparison-320.png`, fullPage: true });
  });

  test("loan payment — with a result", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1800 });
    await page.goto("/calculators/loan-payment");
    await page.getByLabel(/^Loan amount/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Loan term/).fill("12");
    await page.getByText("Assumptions used").click();
    await page.screenshot({ path: `${DIR}/17-loan-payment-result.png`, fullPage: true });
  });

  test("loan payoff — baseline and extra payment comparison", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 2200 });
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("6");
    await page.getByLabel(/^Required monthly payment/).fill("200");
    await page.getByLabel(/^Extra monthly payment/).fill("50");
    await page.screenshot({ path: `${DIR}/18-loan-payoff-comparison.png`, fullPage: true });
  });

  test("loan payoff — non-amortizing result", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("12");
    await page.getByLabel(/^Required monthly payment/).fill("50");
    await page.screenshot({ path: `${DIR}/19-loan-payoff-non-amortizing.png`, fullPage: true });
  });

  test("loan payoff — at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto("/calculators/loan-payoff");
    await page.getByLabel(/^Current loan balance/).fill("10000");
    await page.getByLabel(/^Annual note interest rate/).fill("6");
    await page.getByLabel(/^Required monthly payment/).fill("200");
    await page.getByLabel(/^Extra monthly payment/).fill("50");
    await page.screenshot({ path: `${DIR}/20-loan-payoff-320.png`, fullPage: true });
  });
});
