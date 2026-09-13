import type { Metadata } from "next";
import { LoanPayoffCalculator } from "@/components/loan-payoff/LoanPayoffCalculator";
import { LOAN_PAYOFF_LIMITS } from "@/lib/finance/limits";

export const metadata: Metadata = {
  title: "Loan Payoff Calculator",
  description:
    "See how extra payments could shorten the payoff time on a loan with a fixed interest rate and reduce interest, compared to a baseline with no extra payments.",
};

export default function LoanPayoffPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Loan payoff calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        An educational comparison of a baseline payoff (your required
        payment only) against a scenario with extra payments. This tool
        does not imply loan approval, quote a lender, or recommend a
        provider.
      </p>

      <div className="mb-12">
        <LoanPayoffCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="method-heading">
          <h2 id="method-heading" className="mb-3 text-xl font-semibold text-navy">
            How this is calculated
          </h2>
          <p className="mb-2">
            Each month, interest is calculated first on the remaining
            balance, then the required payment is applied, then any
            recurring extra payment is applied to principal. A one time
            extra payment is applied, in the selected month only, after
            the required payment and recurring extra. Every payment is
            capped at the amount actually owed, so the balance never goes
            negative; any requested extra beyond what was owed is reported
            as unused and is not counted as paid. Month 1 is defined as
            the first modeled payment month.
          </p>
          <p>
            The baseline scenario uses the required payment alone, with no
            extras, so you can see what the extra payments changed. The
            simulation runs up to a documented maximum of{" "}
            {LOAN_PAYOFF_LIMITS.maxMonths} months (100 years). If a valid
            amortizing loan does not pay off within that horizon, this
            calculator says so rather than inventing a date.
          </p>
        </section>

        <section aria-labelledby="non-amortizing-heading">
          <h2 id="non-amortizing-heading" className="mb-3 text-xl font-semibold text-navy">
            When a payment does not cover interest
          </h2>
          <p>
            If the required and extra monthly payments together do not
            exceed the interest accruing on the balance, the balance does
            not decrease and there is no payoff date to show. In that case
            this calculator states this clearly and shows only the minimum
            payment that would cover the first month&apos;s interest, as an
            educational reference point, not a lender requirement. Interest
            saved and a payoff comparison are not shown when a scenario
            does not amortize.
          </p>
        </section>

        <section aria-labelledby="terms-heading">
          <h2 id="terms-heading" className="mb-3 text-xl font-semibold text-navy">
            Principal, interest, and note rate versus APR
          </h2>
          <p className="mb-2">
            Each payment is split into principal, which reduces what you
            owe, and interest, the cost of borrowing that month. This is a
            monthly estimate at a fixed interest rate: the rate and
            required payment are assumed to stay the same unless you model
            an extra payment.
          </p>
          <p>
            The annual note interest rate you enter is not necessarily the
            same as an APR. An APR can include certain fees on top of the
            note rate; this calculator excludes fees entirely and does not
            calculate or claim an all-in APR.
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="mb-3 text-xl font-semibold text-navy">
            What this calculator does not include
          </h2>
          <p>
            This comparison does not include taxes, insurance, escrow,
            fees, penalties, or changing rates. Real lender schedules may
            differ due to rounding, payment date, fees, escrow, penalties,
            and changing rates. Results are estimates, not a loan offer,
            approval, or a recommendation to refinance. See the{" "}
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
