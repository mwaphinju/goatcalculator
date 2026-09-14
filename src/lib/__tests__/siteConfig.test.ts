import { afterEach, describe, expect, it, vi } from "vitest";

const ENV_KEY = "NEXT_PUBLIC_SITE_URL";
const originalValue = process.env[ENV_KEY];

async function loadWithEnv(value: string | undefined) {
  vi.resetModules();
  if (value === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = value;
  }
  return import("../siteConfig");
}

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = originalValue;
  }
  vi.resetModules();
});

describe("siteConfig: NEXT_PUBLIC_SITE_URL resolution", () => {
  it("falls back to a local development URL when unset, and is not marked configured", async () => {
    const { siteConfig } = await loadWithEnv(undefined);
    expect(siteConfig.url).toBe("http://localhost:3000");
    expect(siteConfig.isUrlConfigured).toBe(false);
  });

  it("accepts a valid https URL and marks it configured", async () => {
    const { siteConfig } = await loadWithEnv("https://goatcalculator.example");
    expect(siteConfig.url).toBe("https://goatcalculator.example");
    expect(siteConfig.isUrlConfigured).toBe(true);
  });

  it("strips a trailing slash", async () => {
    const { siteConfig } = await loadWithEnv("https://goatcalculator.example/");
    expect(siteConfig.url).toBe("https://goatcalculator.example");
  });

  it("accepts an http localhost URL for local development", async () => {
    const { siteConfig } = await loadWithEnv("http://localhost:4000");
    expect(siteConfig.url).toBe("http://localhost:4000");
    expect(siteConfig.isUrlConfigured).toBe(true);
  });

  it("rejects a non-localhost http URL", async () => {
    await expect(loadWithEnv("http://goatcalculator.example")).rejects.toThrow(/https/i);
  });

  it("rejects a value that is not an absolute URL", async () => {
    await expect(loadWithEnv("not-a-url")).rejects.toThrow(/absolute URL/i);
  });

  it("rejects a bare domain without a scheme", async () => {
    await expect(loadWithEnv("goatcalculator.example")).rejects.toThrow();
  });
});

describe("absoluteUrl", () => {
  it("builds an absolute URL from a site-relative path, using siteConfig.url consistently", async () => {
    const { absoluteUrl } = await loadWithEnv("https://goatcalculator.example");
    // No trailing slash for the root, matching how Next.js itself resolves
    // a "/" canonical/Open Graph URL, and matching every other route.
    expect(absoluteUrl("/")).toBe("https://goatcalculator.example");
    expect(absoluteUrl("/calculators/compound-interest")).toBe(
      "https://goatcalculator.example/calculators/compound-interest",
    );
  });

  it("adds a leading slash if the caller omits one", async () => {
    const { absoluteUrl } = await loadWithEnv("https://goatcalculator.example");
    expect(absoluteUrl("methodology")).toBe("https://goatcalculator.example/methodology");
  });
});
