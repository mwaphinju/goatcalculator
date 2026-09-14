import type { Metadata } from "next";
import { LoanPaymentCalculator } from "@/components/loan-payment/LoanPaymentCalculator";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema, calculatorSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "Estimate the monthly principal and interest payment on a loan with a fixed interest rate, with a full amortization schedule.";
const path = "/calculators/loan-payment";

export const metadata: Metadata = {
  title: "Loan Payment Calculator",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Loan Payment Calculator",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "Loan Payment Calculator",
    description,
  },
};

export default function LoanPaymentPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd data={calculatorSchema({ name: "Loan Payment Calculator", description, path })} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
          { name: "Loan payment calculator", path },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Calculators", href: "/calculators" },
          { name: "Loan payment calculator" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Loan payment calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        An educational estimate of the monthly principal and interest
        payment on a loan with a fixed interest rate. This tool does not
        imply loan approval, quote a lender, or recommend a provider.
      </p>

      <div className="mb-12">
        <LoanPaymentCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="mb-3 text-xl font-semibold text-navy">
            The formula
          </h2>
          <p className="mb-3">
            For a loan with a fixed interest rate, given monthly rate{" "}
            <code>i</code> greater than zero:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>M = P &times; i / (1 &minus; (1 + i)^&minus;n)</p>
            <p>For zero interest: M = P / n</p>
          </div>
          <p>
            <code>P</code> is the original loan amount, <code>i</code> is
            the annual note interest rate divided by 100 and divided by 12,{" "}
            <code>n</code> is the number of monthly payments, and{" "}
            <code>M</code> is the theoretical monthly principal and
            interest payment before cent rounding.
          </p>
        </section>

        <section aria-labelledby="rounding-heading">
          <h2 id="rounding-heading" className="mb-3 text-xl font-semibold text-navy">
            Cent rounding policy
          </h2>
          <p className="mb-2">
            Balance, interest, and principal are tracked at high internal
            precision throughout. For each row of the schedule, interest is
            calculated first on the current balance, then the scheduled
            payment is applied, then the remainder is applied to principal.
            The final payment is capped at the exact remaining amount owed,
            so the schedule always reaches exactly $0.00 and never goes
            negative.
          </p>
          <p>
            Lender conventions and payment rounding can differ slightly
            from this illustrative schedule.
          </p>
        </section>

        <section aria-labelledby="terms-heading">
          <h2 id="terms-heading" className="mb-3 text-xl font-semibold text-navy">
            Principal, interest, and note rate versus APR
          </h2>
          <p className="mb-2">
            Each payment is split into principal, which reduces what you
            owe, and interest, the cost of borrowing that month. This is a
            monthly estimate at a fixed interest rate: the rate and payment
            are assumed to stay the same for the whole term.
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
            This estimate does not include taxes, insurance, escrow, fees,
            penalties, or changing rates. Real lender schedules may differ
            due to rounding, payment date, fees, escrow, penalties, and
            changing rates. Results are estimates, not a loan offer or
            approval. See the{" "}
            <a href="/methodology" className="text-teal-dark underline hover:text-teal">
              methodology page
            </a>{" "}
            for the full list of what is and isn&apos;t modeled.
          </p>
        </section>
      </div>

      <div className="max-w-3xl">
        <RelatedLinks
          links={[
            { href: "/calculators/loan-payoff", label: "Loan payoff calculator" },
            { href: "/guides/how-extra-loan-payments-work", label: "Guide: how extra loan payments work" },
          ]}
        />
      </div>
    </div>
  );
}
