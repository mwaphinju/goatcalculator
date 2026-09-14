import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "How to work out the monthly contribution needed to reach a savings target, with the formula and a worked example.";
const path = "/guides/how-to-calculate-a-savings-goal";

export const metadata: Metadata = {
  title: "How to Calculate a Savings Goal",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "How to Calculate a Savings Goal",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "How to Calculate a Savings Goal",
    description,
  },
};

const breadcrumbItems = [
  { name: "Home", path: "/" },
  { name: "Guides", path: "/guides" },
  { name: "How to calculate a savings goal", path },
];

export default function SavingsGoalGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLd data={breadcrumbListSchema(breadcrumbItems)} />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Guides", href: "/guides" },
          { name: "How to calculate a savings goal" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        How to calculate a savings goal
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Working out the monthly contribution needed to reach a target
        balance means separating what your starting balance will grow into
        on its own from what your future contributions still need to make
        up. This guide walks through that split and a worked example.
      </p>

      <div className="space-y-10 text-navy-soft">
        <section aria-labelledby="idea-heading">
          <h2 id="idea-heading" className="mb-3 text-xl font-semibold text-navy">
            The idea behind the calculation
          </h2>
          <p className="mb-3">
            A target balance at the end of a fixed number of months comes
            from two sources: your starting balance growing with interest on
            its own, and your monthly contributions, each of which also
            earns interest for whatever time remains after it is added. The
            first part is fixed once you know your starting balance, rate,
            and duration. The second part is what you are actually solving
            for: how large does each identical monthly contribution need to
            be so both parts together reach the target?
          </p>
          <p>
            This can be solved directly with a formula instead of guessing
            contribution amounts and checking the result, which is what the{" "}
            <Link href="/calculators/savings-goal" className="text-teal-dark underline hover:text-teal">
              savings goal calculator
            </Link>{" "}
            does.
          </p>
        </section>

        <section aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="mb-3 text-xl font-semibold text-navy">
            The formula
          </h2>
          <p className="mb-3">
            Let <code>P</code> be the starting balance, <code>T</code> the
            target balance, <code>i</code> the monthly rate, and{" "}
            <code>n</code> the number of months. First find how much the
            starting balance alone grows to:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>growth = (1 + i)^n</p>
            <p>balanceFromStartAlone = P &times; growth</p>
          </div>
          <p className="mb-3">
            The remaining gap, <code>T &minus; balanceFromStartAlone</code>,
            has to come from contributions. Each contribution earns interest
            for a different number of remaining months, and summing that
            series gives an &ldquo;annuity factor&rdquo; that converts a
            required total into a required monthly amount:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>annuityFactor = (growth &minus; 1) / i</p>
            <p>requiredMonthlyContribution = (T &minus; balanceFromStartAlone) / annuityFactor</p>
          </div>
          <p>
            If the starting balance alone already meets or exceeds the
            target, the required contribution is $0, not a negative number.
          </p>
        </section>

        <section aria-labelledby="worked-example-heading">
          <h2 id="worked-example-heading" className="mb-3 text-xl font-semibold text-navy">
            Worked example
          </h2>
          <p className="mb-3">
            Starting balance $2,000, target $20,000, 5 years (60 months), 4%
            nominal annual rate (monthly rate <code>i = 0.04 / 12</code>),
            contribution added at the end of each month:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>growth = (1 + 0.04/12)^60 &asymp; 1.22100</p>
            <p>balanceFromStartAlone = 2,000 &times; 1.22100 &asymp; $2,441.99</p>
            <p>annuityFactor = (1.22100 &minus; 1) / (0.04/12) &asymp; 66.2394</p>
            <p>requiredMonthlyContribution = (20,000 &minus; 2,441.99) / 66.2394</p>
          </div>
          <p className="mb-3">
            That works out to a required monthly contribution of{" "}
            <strong className="text-navy">$264.83</strong>. Running that
            contribution forward for 60 months at the same rate lands back
            on a final balance of $20,000.00, confirming the formula. You
            can reproduce this exact scenario on the{" "}
            <Link href="/calculators/savings-goal" className="text-teal-dark underline hover:text-teal">
              savings goal calculator
            </Link>
            : starting balance $2,000, target $20,000, nominal annual rate
            4%, duration 60 months.
          </p>
        </section>

        <section aria-labelledby="assumptions-heading">
          <h2 id="assumptions-heading" className="mb-3 text-xl font-semibold text-navy">
            Assumptions and limitations
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>The rate is assumed constant for the whole period; real rates can change.</li>
            <li>Every monthly contribution is assumed to be the same fixed amount.</li>
            <li>This does not include taxes on interest earned, account or fund fees, or inflation reducing the target&apos;s future purchasing power.</li>
            <li>If the duration is 0 months and the target is above the starting balance, there is no monthly period available and no contribution amount can solve it; the calculator explains this rather than showing a misleading number.</li>
          </ul>
        </section>

        <section aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="mb-3 text-xl font-semibold text-navy">
            Educational disclaimer
          </h2>
          <p>
            This guide is for education only and is not individualized
            financial, tax, or investment advice. It does not recommend any
            specific target, rate, or account. See the{" "}
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
          { href: "/calculators/savings-goal", label: "Savings goal calculator" },
          { href: "/calculators/savings-time", label: "Savings time calculator" },
          { href: "/guides/compound-interest-explained", label: "Guide: compound interest explained" },
        ]}
      />
    </div>
  );
}
