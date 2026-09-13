import { formatMoney } from "@/lib/finance/format";
import type { ScheduleRow } from "@/lib/finance/types";
import { ScrollableRegion } from "./ScrollableRegion";

interface MonthlyScheduleTableProps {
  schedule: ScheduleRow[];
  emptyMessage?: string;
  captionPrefix?: string;
  regionLabel?: string;
}

export function MonthlyScheduleTable({
  schedule,
  emptyMessage = "No monthly schedule to show for a duration of 0 months.",
  captionPrefix = "Monthly balance schedule",
  regionLabel = "Monthly schedule table, scrollable horizontally on narrow screens",
}: MonthlyScheduleTableProps) {
  if (schedule.length === 0) {
    return <p className="text-sm text-navy-soft">{emptyMessage}</p>;
  }

  return (
    <ScrollableRegion ariaLabel={regionLabel}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">
          {captionPrefix}: starting balance, contribution, interest earned
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
              Contribution
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Interest earned
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
              <td className="px-3 py-1.5 text-right tabular-nums">
                {formatMoney(row.contribution)}
              </td>
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
