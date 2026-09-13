import { formatMoney } from "@/lib/finance/format";
import type { LoanScheduleRow } from "@/lib/finance/types";
import { ScrollableRegion } from "./ScrollableRegion";

interface LoanScheduleTableProps {
  schedule: LoanScheduleRow[];
  emptyMessage?: string;
  captionPrefix?: string;
  regionLabel?: string;
}

/** The amortization schedule shape shared by the loan payment and loan payoff calculators (payment split into principal and interest, rather than a single "contribution"). */
export function LoanScheduleTable({
  schedule,
  emptyMessage = "No monthly schedule to show.",
  captionPrefix = "Monthly amortization schedule",
  regionLabel = "Monthly amortization schedule table, scrollable horizontally on narrow screens",
}: LoanScheduleTableProps) {
  if (schedule.length === 0) {
    return <p className="text-sm text-navy-soft">{emptyMessage}</p>;
  }

  return (
    <ScrollableRegion ariaLabel={regionLabel}>
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="sr-only">
          {captionPrefix}: starting balance, payment, principal, interest
          and ending balance for each of {schedule.length}{" "}
          {schedule.length === 1 ? "month" : "months"}.
        </caption>
        <thead className="sticky top-0 bg-teal-soft text-navy">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Month
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Starting balance
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Payment
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Principal
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Interest
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Ending balance
            </th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row) => (
            <tr key={row.month} className="border-t border-border odd:bg-warm-white/60">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-navy-soft">
                {row.month}
              </th>
              <td className="px-3 py-1.5 text-right tabular-nums">
                {formatMoney(row.startingBalance)}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(row.payment)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(row.principal)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(row.interest)}</td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                {formatMoney(row.endingBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableRegion>
  );
}
