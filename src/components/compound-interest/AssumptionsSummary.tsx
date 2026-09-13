import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { CompoundInterestInput } from "@/lib/finance/types";

interface AssumptionsSummaryProps {
  input: CompoundInterestInput;
  isExample: boolean;
}

/**
 * Renders directly from the same `CompoundInterestInput` object that was
 * passed to `calculateCompoundInterest` for the currently displayed result,
 * so this summary can never drift out of sync with the numbers above it.
 */
export function AssumptionsSummary({ input, isExample }: AssumptionsSummaryProps) {
  return (
    <details className="rounded-md border border-border bg-surface p-4">
      <summary className="cursor-pointer select-none font-medium text-navy">
        Assumptions used {isExample ? "(illustrative example)" : ""}
      </summary>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-navy-soft">Initial balance</dt>
          <dd className="font-medium text-navy">{formatMoney(String(input.initialBalance))}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-navy-soft">Nominal annual interest rate</dt>
          <dd className="font-medium text-navy">{formatPercent(input.annualRatePercent)}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-navy-soft">Compounding frequency</dt>
          <dd className="font-medium text-navy">Monthly (the only frequency this calculator supports)</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-navy-soft">Duration</dt>
          <dd className="font-medium text-navy">
            {input.months} {input.months === 1 ? "month" : "months"}
            {input.months >= 12 ? ` (${formatDuration(input.months)})` : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-navy-soft">Monthly contribution</dt>
          <dd className="font-medium text-navy">{formatMoney(String(input.monthlyContribution))}</dd>
        </div>
        <div className="flex justify-between gap-2 sm:block">
          <dt className="text-navy-soft">Contribution timing</dt>
          <dd className="font-medium text-navy">
            {input.timing === "end" ? "End of each month" : "Beginning of each month"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 border-t border-border pt-3 text-xs text-navy-soft">
        This projection does not include taxes, account fees or inflation.
        See the{" "}
        <a href="/methodology" className="text-teal-dark underline hover:text-teal">
          methodology page
        </a>{" "}
        for what is and isn&apos;t modeled.
      </p>
    </details>
  );
}
