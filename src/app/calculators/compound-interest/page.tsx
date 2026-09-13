import type { Metadata } from "next";
import { CompoundInterestCalculator } from "@/components/compound-interest/CompoundInterestCalculator";

export const metadata: Metadata = {
  title: "Compound Interest Calculator",
  description:
    "Project a savings balance with monthly compounding, optional monthly contributions, and a full month-by-month schedule.",
};

export default function CompoundInterestPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Compound interest calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Estimate how a savings balance grows with monthly compounding and
        optional monthly contributions. This calculator only supports
        monthly compounding — that is the one model described below, not a
        default among several.
      </p>

      <div className="mb-12">
        <CompoundInterestCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="mb-3 text-xl font-semibold text-navy">
            The formula
          </h2>
          <p className="mb-3">
            Every month, the balance grows by one-twelfth of the nominal
            annual rate, and the monthly contribution is added either before
            or after that growth, depending on the timing you choose. Let{" "}
            <code>B</code> be the balance before a given month&apos;s step,{" "}
            <code>C</code> the monthly contribution, and <code>i</code> the
            nominal annual rate (as a decimal) divided by 12:
          </p>
          <div className="mb-3 space-y-2 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>End-of-month contributions: B_next = B × (1 + i) + C</p>
            <p>Beginning-of-month contributions: B_next = (B + C) × (1 + i)</p>
          </div>
          <p>
            This step repeats once for every month in the duration you enter.
            Only monthly compounding is supported in this version — there is
            no control for annual, daily or continuous compounding, and the
            calculator does not guess which one you meant.
          </p>
        </section>

        <section aria-labelledby="timing-heading">
          <h2 id="timing-heading" className="mb-3 text-xl font-semibold text-navy">
            Timing assumptions
          </h2>
          <p>
            &ldquo;End of month&rdquo; means that month&apos;s interest is
            calculated on the balance you already had, and the contribution
            is added afterward — so a contribution made in the final month
            does not itself earn any interest in this projection.
            &ldquo;Beginning of month&rdquo; means the contribution is added
            first, so it earns that month&apos;s interest along with the rest
            of the balance. Beginning-of-month contributions therefore always
            produce a final balance at least as large as the same scenario
            with end-of-month contributions.
          </p>
        </section>

        <section aria-labelledby="worked-example-heading">
          <h2 id="worked-example-heading" className="mb-3 text-xl font-semibold text-navy">
            Worked example
          </h2>
          <p className="mb-3">
            Starting balance $1,000, nominal annual rate 12% (so{" "}
            <code>i = 0.12 / 12 = 0.01</code> per month), a $100 contribution
            added at the end of each month, over 12 months:
          </p>
          <div className="overflow-x-auto">
            <table className="mb-3 w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1 pr-4 font-medium text-navy">Month</th>
                  <th className="py-1 pr-4 font-medium text-navy">Starting balance</th>
                  <th className="py-1 pr-4 font-medium text-navy">After growth (×1.01)</th>
                  <th className="py-1 font-medium text-navy">Ending balance (+$100)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-1 pr-4">1</td>
                  <td className="py-1 pr-4">$1,000.00</td>
                  <td className="py-1 pr-4">$1,010.00</td>
                  <td className="py-1">$1,110.00</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-1 pr-4">2</td>
                  <td className="py-1 pr-4">$1,110.00</td>
                  <td className="py-1 pr-4">$1,121.10</td>
                  <td className="py-1">$1,221.10</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4" colSpan={4}>
                    …continuing the same two steps for months 3 through 12…
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            After all 12 months, this scenario reaches a final balance of
            approximately <strong className="text-navy">$2,395.08</strong> (exactly{" "}
            $2,395.075331451667 before rounding to the cent) — made up of the
            original $1,000, $1,200 in contributions, and about $195.08 in
            interest. You can reproduce this exact scenario in the calculator
            above using the &ldquo;Try an example&rdquo; link under the
            interest rate field, then setting the contribution to $100/month
            end-of-month and the duration to 12 months.
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="mb-3 text-xl font-semibold text-navy">
            What this calculator does not include
          </h2>
          <p>
            This projection does not account for taxes on interest, account
            or fund fees, or inflation eroding the purchasing power of the
            result. It also assumes the interest rate and contribution stay
            exactly the same for the entire duration, which real accounts
            rarely do. Modeling taxes, fees, inflation, and variable rates
            are planned for a later, separately reviewed phase of this
            project — not included in what you see here. See the{" "}
            <a href="/methodology" className="text-teal-dark underline hover:text-teal">
              methodology page
            </a>{" "}
            for the full list of what is and isn&apos;t modeled.
          </p>
        </section>
      </div>
    </div>
  );
}
