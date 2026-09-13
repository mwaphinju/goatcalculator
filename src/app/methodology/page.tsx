import type { Metadata } from "next";
import { COMPOUND_INTEREST_LIMITS } from "@/lib/finance/limits";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How GOAT Calculator's tools work: the math, the assumptions, rounding rules, input limits, and privacy approach.",
};

export default function MethodologyPage() {
  const L = COMPOUND_INTEREST_LIMITS;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-navy">
        Methodology
      </h1>
      <p className="mb-10 text-navy-soft">
        What every calculator on this site does and does not do, in plain
        terms, so you can decide how much to trust a result.
      </p>

      <div className="space-y-10 text-navy-soft">
        <section aria-labelledby="privacy-heading">
          <h2 id="privacy-heading" className="mb-3 text-xl font-semibold text-navy">
            Your numbers stay on your device
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Every calculation runs in your browser using ordinary arithmetic.</li>
            <li>Nothing you type is sent to a server, an AI model, or any third party.</li>
            <li>No login, account, or bank connection is required or offered.</li>
            <li>Your inputs are not stored automatically and are not placed in the page URL.</li>
            <li>This site does not run analytics, advertising, or session-replay scripts.</li>
          </ul>
        </section>

        <section aria-labelledby="ci-heading">
          <h2 id="ci-heading" className="mb-3 text-xl font-semibold text-navy">
            Compound interest calculator
          </h2>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Model</h3>
          <p className="mb-3">
            Monthly compounding only. Given a nominal annual rate expressed
            as a percent, the monthly rate used in the model is{" "}
            <code>i = (rate / 100) / 12</code>. Starting from the initial
            balance, the calculator applies one step per month for the exact
            number of months you enter:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>End of month: B_next = B × (1 + i) + C</p>
            <p>Beginning of month: B_next = (B + C) × (1 + i)</p>
          </div>
          <p className="mb-3">
            <code>Total interest</code> is reported as{" "}
            <code>final balance − initial balance − total contributions</code>,
            so the four headline figures always reconcile exactly at full
            internal precision, before display rounding.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Precision and rounding</h3>
          <p className="mb-3">
            Internally, every step of the calculation is done with
            arbitrary-precision decimal arithmetic (40 significant digits),
            not ordinary floating-point numbers, so rounding error does not
            accumulate over a long schedule. Figures shown on screen — the
            headline totals and every cell of the month-by-month table — are
            rounded to the nearest cent (round-half-up) only for display.
            Because each figure is rounded independently, two displayed
            figures can differ from their unrounded sum by up to $0.01; this
            is a display artifact, not an error in the underlying
            calculation.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Input limits</h3>
          <p className="mb-2">
            These bounds exist to keep results finite and the page
            responsive — they are not a claim about what is realistic:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Initial balance: {L.initialBalance.min.toLocaleString("en-US")} to{" "}
              {L.initialBalance.max.toLocaleString("en-US")}
            </li>
            <li>
              Monthly contribution: {L.monthlyContribution.min.toLocaleString("en-US")} to{" "}
              {L.monthlyContribution.max.toLocaleString("en-US")}
            </li>
            <li>
              Nominal annual interest rate: {L.annualRatePercent.min}% to{" "}
              {L.annualRatePercent.max}%
            </li>
            <li>
              Duration: {L.months.min} to {L.months.max} whole months
            </li>
          </ul>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Currency</h3>
          <p>
            The calculator is currency-agnostic. The math is identical
            whether you&apos;re thinking in US dollars, British pounds,
            Canadian dollars or Australian dollars — enter amounts in
            whichever unit you like and read the results in the same unit.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Scope: what is not modeled</h3>
          <p className="mb-2">This calculator does not account for:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Taxes on interest earned</li>
            <li>Account, fund or advisory fees</li>
            <li>Inflation, which reduces the future purchasing power of any nominal balance</li>
            <li>Interest rates or contribution amounts that change over time</li>
            <li>Compounding frequencies other than monthly (e.g. daily, continuous)</li>
            <li>The difference between a nominal annual rate and annual percentage yield (APY)</li>
          </ul>
          <p className="mt-2">
            Taxes, fees, inflation, variable rates, and an APY input mode are
            candidates for a later, separately reviewed phase of this
            project. They are not silently approximated here — this
            calculator only shows the model described above.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Example mode</h3>
          <p>
            The &ldquo;Try an example&rdquo; action fills in illustrative,
            clearly labeled sample values so you can see how the calculator
            works before entering your own numbers. Example rates are not
            current, typical, recommended, or guaranteed — they exist only
            to demonstrate the calculation. As soon as you edit any field,
            the calculator treats the scenario as your own; any field you
            haven&apos;t touched yet is flagged so you know it still holds
            an example value rather than something you chose.
          </p>
        </section>

        <section aria-labelledby="disclaimer-heading">
          <h2 id="disclaimer-heading" className="mb-3 text-xl font-semibold text-navy">
            General disclaimer
          </h2>
          <p>
            Results are estimates for education and planning purposes only.
            They are not financial, tax, or investment advice, and they are
            not a guarantee of any future return. Real accounts are subject
            to fees, taxes, and rates that change over time.
          </p>
        </section>
      </div>
    </div>
  );
}
