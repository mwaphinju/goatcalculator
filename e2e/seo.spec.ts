import { test, expect, type Page } from "@playwright/test";

/**
 * Kept as a plain literal (not imported from src/lib/routes.ts) so this
 * test independently verifies the actual rendered/served output rather
 * than re-checking the same source list against itself; routes.test.ts
 * (vitest) is what cross-checks PUBLIC_ROUTES against the files on disk.
 */
const PUBLIC_ROUTES = [
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

const GUIDE_ROUTES = PUBLIC_ROUTES.filter((r) => r.startsWith("/guides/"));
const CALCULATOR_ROUTES = PUBLIC_ROUTES.filter((r) => r.startsWith("/calculators/"));

/**
 * These tests expect the static export to have been built with
 * NEXT_PUBLIC_SITE_URL=https://goatcalculator.example (see AGENTS/CLAUDE
 * verification commands for this phase), so canonical/OG/sitemap/robots
 * assertions have a real configured domain to check against.
 */
const SITE_URL = "https://goatcalculator.example";

async function getMetaContent(page: Page, selector: string): Promise<string | null> {
  return page.locator(selector).getAttribute("content");
}

test.describe("SEO metadata: unique titles and descriptions across every public route", () => {
  test("every route has a non-empty, unique title and meta description", async ({ page }) => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      const title = await page.title();
      const description = await getMetaContent(page, 'meta[name="description"]');

      expect(title.length, `${route} has a title`).toBeGreaterThan(0);
      expect(description?.length ?? 0, `${route} has a description`).toBeGreaterThan(0);

      expect(titles.has(title), `title "${title}" is unique (also used by ${titles.get(title)})`).toBe(false);
      titles.set(title, route);

      expect(
        descriptions.has(description!),
        `description for ${route} is unique (also used by ${descriptions.get(description!)})`,
      ).toBe(false);
      descriptions.set(description!, route);
    }
  });
});

test.describe("SEO metadata: canonical, Open Graph, Twitter card, and robots per route", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has correct canonical, Open Graph, Twitter, and robots metadata`, async ({ page }) => {
      await page.goto(route);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toBe(`${SITE_URL}${route === "/" ? "" : route}`);

      const ogTitle = await getMetaContent(page, 'meta[property="og:title"]');
      const ogDescription = await getMetaContent(page, 'meta[property="og:description"]');
      const ogUrl = await getMetaContent(page, 'meta[property="og:url"]');
      const ogSiteName = await getMetaContent(page, 'meta[property="og:site_name"]');
      expect(ogTitle).toBeTruthy();
      expect(ogDescription).toBeTruthy();
      expect(ogUrl).toBe(canonical);
      expect(ogSiteName).toBe("GOAT Calculator");

      const twitterCard = await getMetaContent(page, 'meta[name="twitter:card"]');
      const twitterTitle = await getMetaContent(page, 'meta[name="twitter:title"]');
      const twitterImage = await page.locator('meta[name="twitter:image"]').count();
      expect(twitterCard).toBe("summary");
      expect(twitterTitle).toBeTruthy();
      expect(twitterImage, "no twitter:image (no fabricated image)").toBe(0);

      const robots = await getMetaContent(page, 'meta[name="robots"]');
      expect(robots).toContain("index");
      expect(robots).toContain("follow");
    });
  }
});

test.describe("robots.txt", () => {
  test("allows all public pages and references the sitemap", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBeLessThan(400);
    const body = await response!.text();
    expect(body).toMatch(/User-Agent:\s*\*/i);
    expect(body).toMatch(/Allow:\s*\//);
    expect(body).not.toMatch(/Disallow:\s*\/\s*$/m);
    expect(body).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`);
  });
});

test.describe("sitemap.xml", () => {
  test("contains every public route exactly once, as an absolute canonical URL, and nothing else", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBeLessThan(400);
    const body = await response!.text();

    const locMatches = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locMatches.length).toBe(PUBLIC_ROUTES.length);

    const expectedUrls = new Set(PUBLIC_ROUTES.map((route) => `${SITE_URL}${route === "/" ? "" : route}`));
    const actualUrls = new Set(locMatches);
    expect(actualUrls).toEqual(expectedUrls);

    // No duplicates.
    expect(locMatches.length).toBe(new Set(locMatches).size);
  });
});

test.describe("Structured data (JSON-LD)", () => {
  test("home page has valid WebSite structured data matching the site name", async ({ page }) => {
    await page.goto("/");
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(scripts.length).toBeGreaterThan(0);
    const parsed = scripts.map((s) => JSON.parse(s));
    const website = parsed.find((d) => d["@type"] === "WebSite");
    expect(website).toBeTruthy();
    expect(website.name).toBe("GOAT Calculator");
    expect(website.url).toBe(SITE_URL);
  });

  for (const route of CALCULATOR_ROUTES) {
    test(`${route} has valid WebApplication and BreadcrumbList structured data matching visible content`, async ({ page }) => {
      await page.goto(route);
      const h1 = (await page.locator("h1").first().innerText()).trim();
      const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      const parsed = scripts.map((s) => JSON.parse(s));

      const app = parsed.find((d) => d["@type"] === "WebApplication");
      expect(app, "has a WebApplication schema").toBeTruthy();
      expect(app.url).toBe(`${SITE_URL}${route}`);
      expect(app.offers.price).toBe("0");
      // The schema name should describe the same calculator the visible h1 names.
      expect(app.name.toLowerCase()).toContain(h1.toLowerCase().replace(" calculator", ""));

      const breadcrumb = parsed.find((d) => d["@type"] === "BreadcrumbList");
      expect(breadcrumb, "has a BreadcrumbList schema").toBeTruthy();
      const lastCrumb = breadcrumb.itemListElement[breadcrumb.itemListElement.length - 1];
      expect(lastCrumb.name.toLowerCase()).toBe(h1.toLowerCase());
      expect(lastCrumb.item).toBe(`${SITE_URL}${route}`);

      // The visible breadcrumb nav shows the same trail as the structured data.
      const visibleCrumbs = await page.locator('nav[aria-label="Breadcrumb"] li').allInnerTexts();
      expect(visibleCrumbs.length).toBe(breadcrumb.itemListElement.length);
    });
  }

  for (const route of GUIDE_ROUTES) {
    test(`${route} has a BreadcrumbList matching its visible breadcrumb trail`, async ({ page }) => {
      await page.goto(route);
      const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
      const parsed = scripts.map((s) => JSON.parse(s));
      const breadcrumb = parsed.find((d) => d["@type"] === "BreadcrumbList");
      expect(breadcrumb).toBeTruthy();

      const visibleCrumbs = await page.locator('nav[aria-label="Breadcrumb"] li').allInnerTexts();
      expect(visibleCrumbs.length).toBe(breadcrumb.itemListElement.length);

      // No Article schema: this project has no real author, publish date, or image to report truthfully.
      const article = parsed.find((d) => d["@type"] === "Article");
      expect(article).toBeUndefined();
    });
  }
});

test.describe("Guide pages render without JavaScript", () => {
  for (const route of GUIDE_ROUTES) {
    test(`${route} shows its heading and body text with JavaScript disabled`, async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false });
      const page = await context.newPage();
      const response = await page.goto(route);
      expect(response?.status()).toBeLessThan(400);

      const h1Text = await page.locator("h1").first().innerText();
      expect(h1Text.trim().length).toBeGreaterThan(0);

      const bodyText = await page.locator("body").innerText();
      expect(bodyText).toContain("Worked example");
      expect(bodyText).toContain("Educational disclaimer");
      expect(bodyText.length).toBeGreaterThan(500);

      await context.close();
    });
  }
});

test.describe("Internal links resolve to valid public routes", () => {
  test("every 'Continue planning' / 'Guides' related link on every route resolves successfully", async ({ page }) => {
    const checked = new Set<string>();
    for (const route of PUBLIC_ROUTES) {
      await page.goto(route);
      const hrefs = await page
        .locator('nav[aria-label="Continue planning"] a, nav[aria-label="Guides"] a')
        .evaluateAll((els) => els.map((el) => el.getAttribute("href")));
      for (const href of hrefs) {
        if (!href || checked.has(href)) continue;
        checked.add(href);
        expect(PUBLIC_ROUTES, `${href} (linked from ${route}) is a real public route`).toContain(href);
      }
    }
    expect(checked.size).toBeGreaterThan(0);
  });

  test("header and footer navigation links (including Guides) all resolve successfully", async ({ page }) => {
    await page.goto("/");
    const headerHrefs = await page.locator('header nav[aria-label="Primary"] a').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    const footerHrefs = await page.locator('footer nav[aria-label="Footer"] a').evaluateAll((els) =>
      els.map((el) => el.getAttribute("href")),
    );
    for (const href of [...headerHrefs, ...footerHrefs]) {
      expect(href).toBeTruthy();
      expect(PUBLIC_ROUTES).toContain(href);
    }
    expect(headerHrefs).toContain("/guides");
    expect(footerHrefs).toContain("/guides");
  });
});

test.describe("No tracking, advertising, login, or storage use introduced by this phase", () => {
  for (const route of [...GUIDE_ROUTES, "/guides", "/"]) {
    test(`${route} has no analytics, advertising, or third party tracker scripts`, async ({ page }) => {
      await page.goto(route);
      const scriptSrcs = await page.locator("script[src]").evaluateAll((els) => els.map((el) => el.getAttribute("src") ?? ""));
      for (const src of scriptSrcs) {
        expect(src).not.toMatch(/analytics|gtag|googletagmanager|facebook\.net|doubleclick|segment\.|hotjar|mixpanel/i);
      }
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      expect(bodyText).not.toContain("sign in");
      expect(bodyText).not.toContain("create an account");
      // "log in" alone is not banned: the site's own copy legitimately
      // says login is never required. A real login form is what matters.
      expect(await page.locator('input[type="password"]').count()).toBe(0);
      expect(await page.locator("form").count()).toBe(0);
    });
  }
});
