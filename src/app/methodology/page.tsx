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
            <p>End of each month: B_next = B × (1 + i) + C</p>
            <p>Beginning of each month: B_next = (B + C) × (1 + i)</p>
          </div>
          <p className="mb-3">
            <code>Total interest</code> is reported as{" "}
            <code>final balance − initial balance − total contributions</code>,
            so the four headline figures always reconcile exactly at full
            internal precision, before display rounding.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Precision and rounding</h3>
          <p className="mb-3">
            Internally, every step of the calculation is done with high
            precision decimal arithmetic, kept to 40 significant digits, not
            ordinary floating-point numbers, so rounding error does not
            accumulate over a long schedule. Figures shown on screen,
            including the headline totals and every cell of the monthly
            table, are rounded to the nearest cent for display. Exact
            halfway values are rounded up.
            Because each figure is rounded independently, two displayed
            figures can differ from their unrounded sum by up to $0.01; this
            is a display artifact, not an error in the underlying
            calculation.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Input limits</h3>
          <p className="mb-2">
            These bounds exist to keep results finite and the page
            responsive. They are not a claim about what is realistic:
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
            Canadian dollars or Australian dollars. Enter amounts in
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
            Taxes, fees, inflation, and variable rates are not silently
            approximated here. This calculator only shows the model
            described above. An APY input mode is available on the{" "}
            <a href="/calculators/savings-goal" className="text-teal-dark underline hover:text-teal">
              savings goal
            </a>
            ,{" "}
            <a href="/calculators/savings-time" className="text-teal-dark underline hover:text-teal">
              savings time
            </a>
            , and{" "}
            <a href="/calculators/savings-comparison" className="text-teal-dark underline hover:text-teal">
              savings comparison
            </a>{" "}
            calculators, described below, not on this one.
          </p>

          <h3 className="mb-2 mt-4 font-semibold text-navy">Example mode</h3>
          <p>
            The &ldquo;Try an example&rdquo; action fills in illustrative,
            clearly labeled sample values so you can see how the calculator
            works before entering your own numbers. Example rates are not
            current, typical, recommended, or guaranteed. They exist only
            to demonstrate the calculation. As soon as you edit any field,
            the calculator treats the scenario as your own; any field you
            haven&apos;t touched yet is flagged so you know it still holds
            an example value rather than something you chose.
          </p>
        </section>

        <section aria-labelledby="rate-modes-heading">
          <h2 id="rate-modes-heading" className="mb-3 text-xl font-semibold text-navy">
            Nominal annual rate versus APY
          </h2>
          <p className="mb-2">
            The savings goal, savings time, and savings comparison
            calculators let you enter a rate as either a nominal annual
            rate or an APY (annual percentage yield). Both are converted to
            the same monthly rate <code>i</code> the model applies each
            month:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>Nominal annual rate: i = rate / 100 / 12</p>
            <p>APY: i = (1 + APY / 100) ^ (1 / 12) − 1</p>
          </div>
          <p>
            A nominal annual rate has not yet had monthly compounding
            applied to it, so this calculator divides it by 12. An APY is
            already an effective annual rate, meaning it already accounts
            for whatever compounding produced it, so it converts directly
            to the equivalent monthly rate. Neither path compounds the
            other again on top. Entering the same number in the wrong mode
            will give a different, less accurate, answer.
          </p>
        </section>

        <section aria-labelledby="input-policy-heading">
          <h2 id="input-policy-heading" className="mb-3 text-xl font-semibold text-navy">
            Input defaults and required fields
          </h2>
          <p className="mb-2">Every calculator on this site follows the same rule for each input:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Defaulted to zero:</strong> the field visibly shows 0
              or $0 and is used immediately. This is only done where zero
              naturally means &ldquo;none&rdquo;, such as a starting
              balance or a monthly contribution.
            </li>
            <li>
              <strong>Required:</strong> the field starts empty and its
              label visibly says &ldquo;Required&rdquo;. A rate (nominal or
              APY) is always required and never defaults to 0%, since a
              blank rate is a question you have not answered yet, not an
              answer of zero.
            </li>
            <li>
              <strong>Explicit choice:</strong> an option such as rate type
              or contribution timing is always visibly selected, with no
              ambiguous unselected state.
            </li>
          </ul>
          <p className="mt-2">
            A field is never silently treated as zero while it is blank.
            If you clear a defaulted zero field, it is restored to zero
            once you move to another field.
          </p>
        </section>

        <section aria-labelledby="sg-heading">
          <h2 id="sg-heading" className="mb-3 text-xl font-semibold text-navy">
            Savings goal calculator
          </h2>
          <p className="mb-2">
            Solves for the monthly contribution required to reach a target
            balance, using the closed-form inverse of the compounding
            model above rather than a numerical search. If the starting
            balance already meets the target, or if interest on the
            starting balance alone would reach it, the required monthly
            saving is $0. If the duration is 0 months and the target is
            above the starting balance, there is no monthly period
            available, and the calculator explains this rather than
            showing a misleading number. This calculator does not include
            taxes, account or fund fees, inflation, or the possibility
            that your rate changes before you reach your goal.
          </p>
        </section>

        <section aria-labelledby="st-heading">
          <h2 id="st-heading" className="mb-3 text-xl font-semibold text-navy">
            Savings time calculator
          </h2>
          <p className="mb-2">
            Finds the first whole month a target balance is reached by
            simulating the compounding model one month at a time, checking
            the balance immediately after each month&apos;s growth and
            contribution are both applied, up to a documented maximum of
            1,200 months (100 years). If the target is not reached within
            that horizon under the entered assumptions, this calculator
            says so rather than inventing an end date. An estimated
            calendar date is shown only if you enter a starting month and
            year; otherwise only the duration is shown. This calculator
            does not include taxes, account or fund fees, inflation, or
            the possibility that your rate or contribution changes before
            you reach your goal.
          </p>
        </section>

        <section aria-labelledby="sc-heading">
          <h2 id="sc-heading" className="mb-3 text-xl font-semibold text-navy">
            Savings comparison calculator
          </h2>
          <p className="mb-2">
            Runs a baseline and an alternative scenario independently
            through the same compounding model, each with its own starting
            balance, monthly contribution, rate, duration, and
            contribution timing, and reports the numeric differences
            between them. It does not calculate a comparison until both
            scenarios have a duration and a rate entered. It does not say
            one scenario is better: that depends on assumptions, such as
            whether a higher contribution is realistic for you, that this
            calculator has no way to know. It does not include taxes,
            account or fund fees, inflation, or the possibility that rates
            change.
          </p>
        </section>

        <section aria-labelledby="lp-heading">
          <h2 id="lp-heading" className="mb-3 text-xl font-semibold text-navy">
            Loan payment calculator
          </h2>
          <p className="mb-3">
            Estimates the fixed monthly principal and interest payment on a
            loan, given monthly rate <code>i</code> greater than zero:
          </p>
          <div className="mb-3 space-y-1 rounded-md border border-border bg-surface p-4 font-mono text-sm text-navy">
            <p>M = P &times; i / (1 &minus; (1 + i)^&minus;n)</p>
            <p>For zero interest: M = P / n</p>
          </div>
          <p className="mb-2">
            <code>P</code> is the loan amount, <code>n</code> is the number
            of monthly payments, and <code>M</code> is the theoretical
            payment before cent rounding.
          </p>
          <p>
            Cent rounding policy: balance, interest and principal are kept
            at high internal precision throughout. For each schedule row,
            interest is calculated first on the current balance, then the
            scheduled payment (M rounded to the nearest cent) is applied,
            then the remainder goes to principal. The final payment is
            capped at the exact remaining amount owed, so the schedule
            always reaches exactly $0.00 and never goes negative. Lender
            conventions and payment rounding can differ slightly from this
            illustrative schedule. This calculator only supports monthly
            payment frequency.
          </p>
        </section>

        <section aria-labelledby="lpo-heading">
          <h2 id="lpo-heading" className="mb-3 text-xl font-semibold text-navy">
            Loan payoff calculator
          </h2>
          <p className="mb-2">
            Each month, interest is calculated first on the remaining
            balance, then the required payment is applied, then any
            recurring extra payment is applied to principal, then (in the
            selected month only) the one time extra payment is applied.
            Every payment is capped at the amount actually owed; any
            requested extra beyond what was owed is reported as unused and
            is never counted as paid. Month 1 is the first modeled payment
            month. A baseline scenario (the required payment alone, no
            extras) is compared against your extra payment scenario, both
            simulated the same way, up to a documented maximum of 1,200
            months.
          </p>
          <p>
            If the required and extra monthly payments together do not
            exceed the first month&apos;s interest, the balance cannot
            decrease under a fixed rate and payment, so this calculator
            states this clearly instead of inventing a payoff date, and
            shows only the payment that would cover that first
            month&apos;s interest as an educational reference point, not a
            lender requirement. Interest saved and a payoff comparison are
            only shown when both scenarios amortize within the supported
            horizon.
          </p>
        </section>

        <section aria-labelledby="apr-heading">
          <h2 id="apr-heading" className="mb-3 text-xl font-semibold text-navy">
            Note rate versus APR
          </h2>
          <p>
            Both loan calculators use the annual note interest rate you
            enter, which is not necessarily the same as an APR. An APR can
            include certain fees on top of the note rate; these
            calculators exclude fees entirely and do not calculate or
            claim an all-in APR. Neither loan calculator implies loan
            approval, quotes a lender, recommends a provider, or advises
            whether refinancing is suitable for you. They do not include
            taxes, insurance, escrow, fees, penalties, or changing rates.
            Real lender schedules may differ due to rounding, payment
            date, fees, escrow, penalties, and changing rates.
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
