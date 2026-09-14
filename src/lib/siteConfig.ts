/**
 * Brand and canonical-origin configuration.
 *
 * Deliberately does not hard-code a domain. `NEXT_PUBLIC_SITE_URL` should be
 * set in the deployment environment once a real origin (custom domain or the
 * Render-assigned URL) is known; until then this falls back to a local
 * development URL so metadata and canonical links never claim ownership of a
 * domain this project doesn't control. See `.env.example` and
 * `docs/SEO_LAUNCH_CHECKLIST.md` for what Phase 6 must set before deploying.
 */

interface ResolvedSiteUrl {
  url: string;
  /** True only when `NEXT_PUBLIC_SITE_URL` was explicitly set, whether to a real domain or to a local value. False when it fell back silently. */
  isConfigured: boolean;
}

/**
 * Validates and normalizes `NEXT_PUBLIC_SITE_URL`:
 * - Must be a syntactically absolute URL.
 * - Must use https, except a localhost/127.0.0.1 origin is allowed for
 *   local development and pre-deployment testing (this project's static
 *   build always runs with `NODE_ENV=production`, even when a developer
 *   is only testing locally, so localhost cannot be distinguished from a
 *   real production build by environment alone).
 * - A trailing slash is removed so every caller gets a consistent,
 *   unslashed origin to build paths onto.
 *
 * Throws at build/import time on an invalid value rather than silently
 * falling back, so a typo or an insecure (http) production domain fails
 * the build instead of shipping quietly broken metadata.
 */
function resolveSiteUrl(): ResolvedSiteUrl {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!raw) {
    return { url: "http://localhost:3000", isConfigured: false };
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be an absolute URL, e.g. "https://example.com" (received "${raw}").`,
    );
  }

  const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (parsed.protocol !== "https:" && !isLocalHost) {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must use https in production (received "${raw}"). ` +
        `A localhost URL is allowed for local development.`,
    );
  }

  return { url: raw.replace(/\/+$/, ""), isConfigured: true };
}

const { url: resolvedSiteUrl, isConfigured: isSiteUrlConfigured } = resolveSiteUrl();

export const siteConfig = {
  name: "GOAT Calculator",
  shortName: "GOAT Calculator",
  tagline: "See what your money could do.",
  description:
    "Free, private financial calculators that run entirely in your browser. No login, no bank connection, no data leaves your device.",
  /**
   * Absolute origin, no trailing slash. Falls back to a local development
   * URL when `NEXT_PUBLIC_SITE_URL` is unset; never a fabricated
   * production-looking domain. Used consistently for canonical URLs,
   * sitemap.xml, robots.txt's Sitemap line, Open Graph URLs, and
   * structured data URLs — see `absoluteUrl()` below, the single function
   * every one of those goes through.
   */
  url: resolvedSiteUrl,
  /** True only when `NEXT_PUBLIC_SITE_URL` was explicitly set in the environment. */
  isUrlConfigured: isSiteUrlConfigured,
} as const;

/**
 * Builds an absolute URL from a site-relative path (e.g. "/calculators" or
 * "/"), using `siteConfig.url` as the single source of truth. Every
 * canonical link, sitemap entry, robots.txt Sitemap reference, Open Graph
 * URL, and structured-data URL in the app goes through this function, so
 * they can never drift apart or disagree with each other.
 */
export function absoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // The home page's absolute URL is the bare origin with no trailing
  // slash, matching how Next.js itself resolves a "/" canonical/Open
  // Graph URL against metadataBase (consistent with every other route,
  // none of which has a trailing slash either).
  return normalizedPath === "/" ? siteConfig.url : `${siteConfig.url}${normalizedPath}`;
}
