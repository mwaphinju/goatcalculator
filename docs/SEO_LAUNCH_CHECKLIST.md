# SEO Launch Checklist

Practical, post-deployment actions for the site owner once Phase 6
(deployment) is live. None of this is automated and none of it is done by
this project on its own; it is a checklist for a person to work through
after the real site is up.

## Before requesting any indexing

1. **Set `NEXT_PUBLIC_SITE_URL`** in the Render environment (or wherever
   the site is deployed) to the final production URL: either the
   Render-assigned URL or the custom domain, whichever is actually live.
   This must be an absolute `https://` URL with no trailing slash. See
   `.env.example`.
2. **Deploy Phase 6** with that environment variable set, so the build
   that goes live has the real domain baked into its canonical URLs,
   sitemap, robots.txt, Open Graph tags, and structured data.
3. **Confirm `robots.txt` and `sitemap.xml` load at the live domain.**
   Visit `https://<your-domain>/robots.txt` and
   `https://<your-domain>/sitemap.xml` directly in a browser and check
   they return the real domain in their content, not `localhost` or the
   `goatcalculator.example` value used for testing.
4. **Inspect the home page and two calculator URLs** directly on the live
   site: view source (or use your browser's page-info panel) and confirm
   the `<title>`, meta description, canonical link, and Open Graph tags
   show the real domain and accurate, current content.

## Google Search Console

5. **Add and verify the site** in
   [Google Search Console](https://search.google.com/search-console),
   using whichever verification method Search Console offers for the
   domain (DNS record, HTML file, or meta tag).
6. **Submit `sitemap.xml`** through Search Console's Sitemaps report,
   using the full URL (e.g. `https://<your-domain>/sitemap.xml`).
7. **Request indexing only after** confirming, on the live site, that the
   canonical URL, robots directives, sitemap, and page content are all
   correct. Do not request indexing before that confirmation.

## Ongoing

8. **Monitor indexing and Search Console performance monthly.** Check the
   Coverage/Pages report for crawl errors, and the Performance report for
   which queries and pages are actually getting impressions and clicks.

## What this checklist is not

- Submitting a sitemap or requesting indexing does not guarantee a page
  will be indexed, or that it will rank for any query. Google (and any
  other search engine) decides independently what to crawl, index, and
  rank.
- This checklist does not cover analytics, advertising, or any paid
  promotion; none of those are part of this project.
