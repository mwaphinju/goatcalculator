import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-baseline gap-2 rounded-sm font-semibold text-navy"
        >
          <span className="text-lg tracking-tight">{siteConfig.shortName}</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2 text-sm sm:gap-4">
          <Link
            href="/calculators"
            className="rounded-sm px-1.5 py-1 text-navy-soft hover:text-teal-dark sm:px-2"
          >
            Calculators
          </Link>
          <Link
            href="/guides"
            className="rounded-sm px-1.5 py-1 text-navy-soft hover:text-teal-dark sm:px-2"
          >
            Guides
          </Link>
          <Link
            href="/methodology"
            className="rounded-sm px-1.5 py-1 text-navy-soft hover:text-teal-dark sm:px-2"
          >
            Methodology
          </Link>
        </nav>
      </div>
    </header>
  );
}
