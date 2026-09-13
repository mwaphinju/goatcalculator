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

  test("compound interest — 320px small phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/calculators/compound-interest");
    await page.screenshot({ path: `${DIR}/10-ci-320.png`, fullPage: true });
  });
});
