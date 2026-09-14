import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ROUTES } from "../routes";

const APP_DIR = join(__dirname, "..", "..", "app");

/**
 * Walks `src/app` and returns the route path for every `page.tsx` found,
 * independent of `PUBLIC_ROUTES` itself, so this test can catch a route
 * that exists on disk but was never added to the sitemap's route list (an
 * orphan page), or a route listed in the sitemap that no longer exists.
 */
function findPageRoutes(dir: string, prefix = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      routes.push(...findPageRoutes(fullPath, `${prefix}/${entry}`));
    } else if (entry === "page.tsx") {
      routes.push(prefix === "" ? "/" : prefix);
    }
  }
  return routes;
}

describe("PUBLIC_ROUTES matches the actual page.tsx files on disk", () => {
  it("includes every route that has a page.tsx, exactly once, and nothing else", () => {
    const actualRoutes = findPageRoutes(APP_DIR).sort();
    const declaredRoutes = [...PUBLIC_ROUTES].sort();
    expect(declaredRoutes).toEqual(actualRoutes);
  });

  it("has no duplicate entries", () => {
    expect(new Set(PUBLIC_ROUTES).size).toBe(PUBLIC_ROUTES.length);
  });

  it("every route starts with a slash and has no trailing slash (except the root)", () => {
    for (const route of PUBLIC_ROUTES) {
      expect(route.startsWith("/")).toBe(true);
      if (route !== "/") {
        expect(route.endsWith("/")).toBe(false);
      }
    }
  });
});
