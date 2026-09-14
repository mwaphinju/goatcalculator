/**
 * The single list of every public, indexable route on the site. Feeds
 * `sitemap.ts` directly, and is cross-checked in tests against the actual
 * `page.tsx` files on disk, so a new route added later either gets added
 * here (and shows up correctly in the sitemap) or fails that test rather
 * than silently becoming an orphan page missing from the sitemap.
 */
export const PUBLIC_ROUTES = [
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
] as const;

export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
