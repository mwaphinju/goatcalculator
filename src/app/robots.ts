import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/siteConfig";

export const dynamic = "force-static";

/**
 * Statically generated at build time (this project is a full static
 * export). Every public page is allowed; nothing in this phase needs
 * `noindex`, so robots.txt is never used to try to hide a page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
