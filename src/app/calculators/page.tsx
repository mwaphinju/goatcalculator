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
        planned. This page only links to the ones that are finished and
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
              monthly contributions, and a monthly schedule.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/calculators/savings-goal"
            className="block rounded-lg border border-border bg-surface p-5 hover:border-teal"
          >
            <h2 className="mb-1 font-semibold text-navy">
              Savings goal calculator
            </h2>
            <p className="text-sm text-navy-soft">
              Find out how much you would need to save each month to reach
              a target balance.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/calculators/savings-time"
            className="block rounded-lg border border-border bg-surface p-5 hover:border-teal"
          >
            <h2 className="mb-1 font-semibold text-navy">
              Savings time calculator
            </h2>
            <p className="text-sm text-navy-soft">
              Find out how long it would take to reach a savings target at
              a given contribution and rate.
            </p>
          </Link>
        </li>
        <li>
          <Link
            href="/calculators/savings-comparison"
            className="block rounded-lg border border-border bg-surface p-5 hover:border-teal"
          >
            <h2 className="mb-1 font-semibold text-navy">
              Savings comparison calculator
            </h2>
            <p className="text-sm text-navy-soft">
              Compare a baseline and an alternative scenario side by side to
              see what a higher contribution or a different rate changes.
            </p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
