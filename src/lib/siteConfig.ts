/**
 * Brand and canonical-origin configuration.
 *
 * Deliberately does not hard-code a domain. `NEXT_PUBLIC_SITE_URL` should be
 * set in the deployment environment once a real origin (custom domain or the
 * Render-assigned URL) is known; until then this falls back to a local
 * development URL so metadata and canonical links never claim ownership of a
 * domain this project doesn't control.
 */
export const siteConfig = {
  name: "GOAT Calculator",
  shortName: "GOAT Calculator",
  tagline: "See what your money could do.",
  description:
    "Free, private financial calculators that run entirely in your browser. No login, no bank connection, no data leaves your device.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const;
