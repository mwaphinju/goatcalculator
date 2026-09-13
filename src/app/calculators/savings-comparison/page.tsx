import type { Metadata } from "next";
import { SavingsComparisonCalculator } from "@/components/savings-comparison/SavingsComparisonCalculator";

export const metadata: Metadata = {
  title: "Savings Comparison Calculator",
  description:
    "Compare two savings scenarios side by side to see what changes if you save more, save longer, or use a different rate.",
};

export default function SavingsComparisonPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Savings comparison calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Answers one question: what changes if I save more or use a
        different rate? Edit a baseline and an alternative scenario side by
        side and see the difference in projected outcomes.
      </p>

      <div className="mb-12">
        <SavingsComparisonCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="method-heading">
          <h2 id="method-heading" className="mb-3 text-xl font-semibold text-navy">
            How this is calculated
          </h2>
          <p>
            Both scenarios use the same monthly compounding model as the
            compound interest calculator, run independently with their own
            starting balance, monthly contribution, rate, duration and
            contribution timing. The results are simply the difference
            between the two scenarios&apos; outcomes. This calculator does
            not judge which scenario is better. That depends on
            assumptions it has no way to know, such as whether a higher
            contribution is realistic for you.
          </p>
        </section>

        <section aria-labelledby="rate-heading">
          <h2 id="rate-heading" className="mb-3 text-xl font-semibold text-navy">
            Nominal annual rate versus APY
          </h2>
          <p>
            A nominal annual rate has not yet had monthly compounding
            applied to it, so this calculator divides it by 12 to get a
            monthly rate. An APY (annual percentage yield) is already an
            effective annual rate, so it converts directly to the
            equivalent monthly rate without compounding it again on top.
            Each scenario can use a different rate type if you like.
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="mb-3 text-xl font-semibold text-navy">
            What this calculator does not include
          </h2>
          <p>
            This comparison does not account for taxes on interest, account
            or fund fees, inflation, or the possibility that rates change.
            Actual results may differ because future rates can change. See
            the{" "}
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
