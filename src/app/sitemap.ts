import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteConfig";
import { PUBLIC_ROUTES } from "@/lib/routes";

export const dynamic = "force-static";

/**
 * Statically generated at build time. Every entry comes from
 * `PUBLIC_ROUTES` (`src/lib/routes.ts`), the single list also
 * cross-checked in tests against the actual page files on disk, so this
 * always includes every public route exactly once and never an API route,
 * test route, or temporary path (none of which exist in this project).
 * `lastModified` is intentionally omitted: this project does not track a
 * real per-page last-modified date, and inventing one would be a
 * fabricated claim.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: absoluteUrl(route),
  }));
}
