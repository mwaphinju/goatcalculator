import Link from "next/link";

export interface RelatedLink {
  href: string;
  label: string;
}

/**
 * A small "Continue planning" section of contextual internal links. Only
 * pass links that genuinely make sense from this page; this is
 * deliberately not a catch-all site-map block.
 */
export function RelatedLinks({
  links,
  heading = "Continue planning",
}: {
  links: RelatedLink[];
  heading?: string;
}) {
  if (links.length === 0) return null;

  return (
    <nav aria-label={heading} className="mt-10 border-t border-border pt-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-navy-soft">{heading}</h2>
      <ul className="flex flex-wrap gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-block rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy hover:border-teal"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
