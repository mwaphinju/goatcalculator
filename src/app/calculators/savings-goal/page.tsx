import type { Metadata } from "next";
import { SavingsGoalCalculator } from "@/components/savings-goal/SavingsGoalCalculator";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { RelatedLinks } from "@/components/shared/RelatedLinks";
import { JsonLd } from "@/components/shared/JsonLd";
import { breadcrumbListSchema, calculatorSchema } from "@/lib/structuredData";
import { absoluteUrl } from "@/lib/siteConfig";

const description =
  "Find out how much you would need to save each month to reach a target balance, with monthly compounding.";
const path = "/calculators/savings-goal";

export const metadata: Metadata = {
  title: "Savings Goal Calculator",
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    siteName: "GOAT Calculator",
    title: "Savings Goal Calculator",
    description,
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary",
    title: "Savings Goal Calculator",
    description,
  },
};

export default function SavingsGoalPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd data={calculatorSchema({ name: "Savings Goal Calculator", description, path })} />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", path: "/" },
          { name: "Calculators", path: "/calculators" },
          { name: "Savings goal calculator", path },
        ])}
      />
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Calculators", href: "/calculators" },
          { name: "Savings goal calculator" },
        ]}
      />
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Savings goal calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Answers one question: how much do I need to save each month to
        reach a target balance? Enter a target, a duration, and a rate, and
        this calculator solves for the monthly amount.
      </p>

      <div className="mb-12">
        <SavingsGoalCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="formula-heading">
          <h2 id="formula-heading" className="mb-3 text-xl font-semibold text-navy">
            The formula
          </h2>
          <p className="mb-3">
            This calculator uses the same monthly compounding model as the
            compound interest calculator, solved in reverse. Given a
            starting balance <code>P</code>, a monthly rate <code>i</code>,
            a duration of <code>N</code> months, and a target balance{" "}
            <code>T</code>, the growth factor is <code>(1 + i) ^ N</code>.
            The required monthly contribution <code>C</code> is the amount
            that, added every month at the chosen timing, makes up the
            difference between the target and what the starting balance
            alone would grow to.
          </p>
          <p>
            If the starting balance already meets or exceeds the target, or
            if interest on the starting balance alone is projected to reach
            it, the required monthly saving is $0. If the duration is 0
            months and the target is above the starting balance, there is
            no monthly period available to close the gap, and this
            calculator says so rather than showing a misleading number.
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
            Choosing the wrong rate type for the number you have will give
            a different, and less accurate, answer.
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="mb-3 text-xl font-semibold text-navy">
            What this calculator does not include
          </h2>
          <p>
            This projection does not account for taxes on interest, account
            or fund fees, inflation, or the possibility that your rate
            changes before you reach your goal. Actual results may differ
            because future rates can change. See the{" "}
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
            { href: "/calculators/savings-time", label: "Savings time calculator" },
            { href: "/calculators/compound-interest", label: "Compound interest calculator" },
            { href: "/calculators/savings-scenarios", label: "Savings scenario calculator" },
            { href: "/guides/how-to-calculate-a-savings-goal", label: "Guide: how to calculate a savings goal" },
            { href: "/guides/nominal-interest-rate-vs-apy", label: "Guide: nominal interest rate versus APY" },
          ]}
        />
      </div>
    </div>
  );
}
