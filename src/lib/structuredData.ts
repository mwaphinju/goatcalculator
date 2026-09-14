import { absoluteUrl, siteConfig } from "./siteConfig";

export interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/calculators". */
  path: string;
}

/**
 * BreadcrumbList structured data. Callers must pass the exact same items
 * (same names, same order) as the visible `<Breadcrumbs>` component on the
 * page, so the structured data always matches what a visitor actually
 * sees, never an invented or divergent path.
 */
export function breadcrumbListSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
  };
}

/**
 * WebApplication structured data for one calculator page. `name` and
 * `description` should match the page's own visible title and metadata
 * description exactly, never a rewritten or embellished version.
 */
export function calculatorSchema({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url: absoluteUrl(path),
    applicationCategory: "FinanceApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "Requires JavaScript.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
