import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Calculators",
  description: "Free financial calculators that run entirely in your browser.",
};

export default function CalculatorsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Calculators
      </h1>
      <p className="mb-8 max-w-xl text-navy-soft">
        Each calculator runs locally in your browser. More calculators are
        planned — this page only links to the ones that are finished and
        working today.
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        <li>
          <Link
            href="/calculators/compound-interest"
            className="block rounded-lg border border-border bg-surface p-5 hover:border-teal"
          >
            <h2 className="mb-1 font-semibold text-navy">
              Compound interest calculator
            </h2>
            <p className="text-sm text-navy-soft">
              Project a savings balance with monthly compounding, optional
              monthly contributions, and a month-by-month schedule.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
