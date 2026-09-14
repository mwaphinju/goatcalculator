import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-navy-soft sm:px-6">
        <p className="mb-2">
          {siteConfig.name} calculations run entirely in your browser. Nothing you
          enter is sent anywhere or stored automatically.
        </p>
        <p className="mb-4">
          Results are estimates for education and planning purposes only, not
          financial, tax or investment advice, and not a guarantee of future
          performance.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/" className="rounded-sm hover:text-teal-dark">
            Home
          </Link>
          <Link href="/calculators" className="rounded-sm hover:text-teal-dark">
            Calculators
          </Link>
          <Link href="/guides" className="rounded-sm hover:text-teal-dark">
            Guides
          </Link>
          <Link href="/methodology" className="rounded-sm hover:text-teal-dark">
            Methodology
          </Link>
        </nav>
      </div>
    </footer>
  );
}
