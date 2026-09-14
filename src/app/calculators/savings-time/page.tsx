import type { Metadata } from "next";
import { SavingsTimeCalculator } from "@/components/savings-time/SavingsTimeCalculator";
import { SAVINGS_TIME_LIMITS } from "@/lib/finance/limits";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema, calculatorSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "Find out how long it would take to reach a savings target, with monthly compounding and an optional monthly contribution.";
const path = "/calculators/savings-time";

export const metadata: Metadata = {
  title: "Savings Time Calculator",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Savings Time Calculator",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "Savings Time Calculator",
    description,
  },
};

export default function SavingsTimePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd data={calculatorSchema({ name: "Savings Time Calculator", description, path })} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
          { name: "Savings time calculator", path },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Calculators", href: "/calculators" },
          { name: "Savings time calculator" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Savings time calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Answers one question: how long will it take to reach my target?
        Enter a target, a monthly contribution, and a rate, and this
        calculator finds the first whole month the target is reached.
      </p>

      <div className="mb-12">
        <SavingsTimeCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="method-heading">
          <h2 id="method-heading" className="mb-3 text-xl font-semibold text-navy">
            How this is calculated
          </h2>
          <p className="mb-3">
            This calculator simulates the same monthly compounding model as
            the compound interest calculator, one month at a time, and
            checks the balance after each month&apos;s growth and
            contribution have both been applied. The first month the
            balance meets or exceeds the target is the answer. If your
            starting balance already meets the target, that is 0 months.
          </p>
          <p>
            The simulation runs up to a documented maximum of{" "}
            {SAVINGS_TIME_LIMITS.maxMonths} months (100 years). If the
            target is not reached within that horizon under the entered
            assumptions, this calculator says so rather than inventing an
            end date.
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
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="mb-3 text-xl font-semibold text-navy">
            What this calculator does not include
          </h2>
          <p>
            This projection does not account for taxes on interest, account
            or fund fees, inflation, or the possibility that your rate or
            contribution changes before you reach your goal. Actual results
            may differ because future rates can change. See the{" "}
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
            { href: "/calculators/savings-goal", label: "Savings goal calculator" },
            { href: "/calculators/savings-comparison", label: "Savings comparison calculator" },
            { href: "/calculators/compound-interest", label: "Compound interest calculator" },
            { href: "/guides/nominal-interest-rate-vs-apy", label: "Guide: nominal interest rate versus APY" },
          ]}
        />
      </div>
    </div>
  );
}
