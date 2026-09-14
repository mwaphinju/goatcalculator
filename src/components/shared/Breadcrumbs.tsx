import Link from "next/link";

export interface BreadcrumbCrumb {
  name: string;
  /** Omit on the final (current page) crumb, which renders as plain text. */
  href?: string;
}

/**
 * Visible breadcrumb trail. Pass the exact same names and order to
 * `breadcrumbListSchema` (`src/lib/structuredData.ts`) so the structured
 * data always matches what is actually shown here.
 */
export function Breadcrumbs({ items }: { items: BreadcrumbCrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-navy-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link href={item.href} className="rounded-sm underline hover:text-teal-dark">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-navy">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
