import type { Metadata } from "next";
import { SavingsScenariosCalculator } from "@/components/savings-scenarios/SavingsScenariosCalculator";

export const metadata: Metadata = {
  title: "Savings Scenario Calculator",
  description:
    "Compare up to three savings possibilities using assumptions you choose, including monthly contributions, account fees, and inflation.",
};

export default function SavingsScenariosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Savings scenario calculator
      </h1>
      <p className="mb-8 max-w-2xl text-navy-soft">
        Compare up to three savings possibilities side by side, using
        assumptions you choose for the rate, monthly contribution, monthly
        account fee, and inflation. None of these scenarios is a
        prediction, guarantee, or recommendation.
      </p>

      <div className="mb-12">
        <SavingsScenariosCalculator />
      </div>

      <div className="max-w-3xl space-y-10 border-t border-border pt-10 text-navy-soft">
        <section aria-labelledby="calculation-heading">
          <h2 id="calculation-heading" className="mb-3 text-xl font-semibold text-navy">
            How the comparison is calculated
          </h2>
          <p className="mb-3">
            Each scenario is projected independently, one month at a time,
            using the shared starting balance and duration you enter. The
            order each month depends on your chosen contribution timing:
          </p>
          <div className="mb-3 space-y-3 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <div>
              <p className="mb-1 font-sans font-semibold text-navy-soft">End of each month</p>
              <p>Balance after growth = starting balance &times; (1 + monthly rate)</p>
              <p>Balance after contribution = balance after growth + monthly contribution</p>
              <p>Ending balance = greater of 0 and (balance after contribution &minus; monthly fee)</p>
            </div>
            <div>
              <p className="mb-1 font-sans font-semibold text-navy-soft">Beginning of each month</p>
              <p>Balance after contribution = starting balance + monthly contribution</p>
              <p>Balance after growth = balance after contribution &times; (1 + monthly rate)</p>
              <p>Ending balance = greater of 0 and (balance after growth &minus; monthly fee)</p>
            </div>
          </div>
          <p>
            The monthly rate is the annual interest rate you enter divided
            by 100 and divided by 12. This calculator supports a nominal
            annual rate compounded monthly only. All calculations are done
            at high internal precision; amounts are rounded to the nearest
            cent only for display and CSV output, and exact halfway values
            are rounded up.
          </p>
        </section>

        <section aria-labelledby="inflation-heading">
          <h2 id="inflation-heading" className="mb-3 text-xl font-semibold text-navy">
            How inflation affects buying power
          </h2>
          <p className="mb-3">
            Inflation never changes a scenario&apos;s projected account
            balance. It is used only to estimate what that final balance
            could be worth in today&apos;s money:
          </p>
          <div className="mb-3 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>
              Estimated buying power = final balance / (1 + annual
              inflation rate / 100)^(duration in months / 12)
            </p>
          </div>
          <p>
            If the inflation rate is 0 percent, estimated buying power
            equals the final balance exactly.
          </p>
        </section>

        <section aria-labelledby="fees-heading">
          <h2 id="fees-heading" className="mb-3 text-xl font-semibold text-navy">
            How monthly fees are applied
          </h2>
          <p className="mb-2">
            A scenario&apos;s monthly account fee, if any, is deducted
            after that month&apos;s growth and contribution have both been
            applied. The balance can never go negative: if a fee would
            exceed the balance available, only the available balance is
            deducted, and the calculator reports the actual, smaller fee
            that was applied. This does not model account debt or
            overdraft charges of any kind.
          </p>
        </section>

        <section aria-labelledby="scope-heading">
          <h2 id="scope-heading" className="mb-3 text-xl font-semibold text-navy">
            What this calculator does not include
          </h2>
          <p className="mb-2">
            This calculator does not model taxes, changing interest rates,
            deposits that vary over time, investment losses, account debt,
            overdraft charges, withdrawal limits, or any fee other than the
            single optional monthly fee you enter for each scenario.
          </p>
          <p>
            Scenario names are visitor-chosen labels for comparison only;
            they, and every assumption you enter, are never a forecast,
            guarantee, or recommendation. See the{" "}
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
