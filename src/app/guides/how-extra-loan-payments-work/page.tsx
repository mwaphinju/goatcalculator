import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "Why paying extra toward a loan's principal shortens the payoff time and reduces total interest, with a worked example.";
const path = "/guides/how-extra-loan-payments-work";

export const metadata: Metadata = {
  title: "How Extra Loan Payments Work",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "How Extra Loan Payments Work",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "How Extra Loan Payments Work",
    description,
  },
};

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "How extra loan payments work", path },
];

export default function ExtraLoanPaymentsGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbListSchema(breadcrumbItems)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: "How extra loan payments work" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        How extra loan payments work
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Paying more than the required monthly payment on a loan reduces the
        balance faster, which lowers every future month&apos;s interest
        charge and shortens how long the loan takes to pay off. This guide
        explains why, with a worked example.
      </p>

      <div className="space-y-10 text-navy-soft">
        <section aria-labelledby="why-heading">
          <h2 id="why-heading" className="mb-3 text-xl font-semibold text-navy">
            Why extra payments help
          </h2>
          <p className="mb-3">
            Each month, interest is calculated on whatever balance remains,
            then a payment is applied: first to that month&apos;s interest,
            with the rest reducing the principal you owe. A required payment
            is sized to cover the interest and slowly reduce the balance
            over the full loan term. Any extra amount paid on top goes
            straight to principal, which means the balance is smaller
            starting the very next month, so that month&apos;s interest
            charge is smaller too. Every month after an extra payment
            benefits from that smaller balance, which is why extra payments
            tend to save more in interest than the extra amount itself.
          </p>
          <p>
            The{" "}
            <Link href="/calculators/loan-payoff" className="text-teal-dark underline hover:text-teal">
              loan payoff calculator
            </Link>{" "}
            simulates this month by month and compares a baseline (required
            payment only) against a scenario with your chosen extra
            payments, so you can see the actual months and interest saved
            rather than estimate them.
          </p>
        </section>

        <section aria-labelledby="order-heading">
          <h2 id="order-heading" className="mb-3 text-xl font-semibold text-navy">
            The order payments are applied
          </h2>
          <p>
            Each simulated month: interest is calculated first on the
            remaining balance, then the required payment is applied, then
            any recurring extra payment, then, in a chosen month only, a
            one time extra payment if there is one. Every payment is capped
            at the amount actually owed, so the balance never goes negative,
            and any requested extra beyond what was owed is never counted as
            paid.
          </p>
        </section>

        <section aria-labelledby="worked-example-heading">
          <h2 id="worked-example-heading" className="mb-3 text-xl font-semibold text-navy">
            Worked example
          </h2>
          <p className="mb-3">
            A $15,000 loan balance at a 7% annual note rate, with a $300
            required monthly payment, simulated two ways:
          </p>
          <div className="overflow-x-auto">
            <table className="mb-3 w-full min-w-[420px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-1 pr-4 font-medium text-navy">Scenario</th>
                  <th className="py-1 pr-4 font-medium text-navy">Monthly payment</th>
                  <th className="py-1 pr-4 font-medium text-navy">Payoff time</th>
                  <th className="py-1 font-medium text-navy">Total interest</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-1 pr-4">Baseline</td>
                  <td className="py-1 pr-4">$300</td>
                  <td className="py-1 pr-4">60 months (5 years)</td>
                  <td className="py-1">$2,786.51</td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">With $100 extra</td>
                  <td className="py-1 pr-4">$400</td>
                  <td className="py-1 pr-4">43 months (3 years, 7 months)</td>
                  <td className="py-1">$1,977.16</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Paying $100 extra each month pays the loan off{" "}
            <strong className="text-navy">17 months sooner</strong> and
            saves an estimated{" "}
            <strong className="text-navy">$809.35</strong> in interest,
            considerably more than the $1,700 in extra payments made over
            those 17 fewer months, because each extra dollar stops accruing
            interest as soon as it is paid. You can reproduce this exact
            comparison on the{" "}
            <Link href="/calculators/loan-payoff" className="text-teal-dark underline hover:text-teal">
              loan payoff calculator
            </Link>
            : current balance $15,000, annual note rate 7%, required monthly
            payment $300, extra monthly payment $100.
          </p>
        </section>

        <section aria-labelledby="assumptions-heading">
          <h2 id="assumptions-heading" className="mb-3 text-xl font-semibold text-navy">
            Assumptions and limitations
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>The rate and required payment are assumed constant for the whole loan; real lenders may allow or require different terms.</li>
            <li>This does not include taxes, insurance, escrow, fees, penalties, or changing rates.</li>
            <li>If a required payment does not cover even the first month&apos;s interest, the balance cannot decrease under that payment; the calculator states this rather than inventing a payoff date.</li>
            <li>Real lender schedules may differ due to rounding, payment date, fees, escrow, penalties, and changing rates.</li>
          </ul>
        </section>

        <section aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="mb-3 text-xl font-semibold text-navy">
            Educational disclaimer
          </h2>
          <p>
            This guide is for education only and is not individualized
            financial advice. It does not imply loan approval, quote a
            lender, recommend a provider, or advise whether making extra
            payments is right for your situation. See the{" "}
            <Link href="/methodology" className="text-teal-dark underline hover:text-teal">
              methodology page
            </Link>{" "}
            for the full list of what every calculator on this site does and
            does not model.
          </p>
        </section>
      </div>

      <RelatedLinks
        links={[
          { href: "/calculators/loan-payoff", label: "Loan payoff calculator" },
          { href: "/calculators/loan-payment", label: "Loan payment calculator" },
        ]}
      />
    </div>
  );
}
