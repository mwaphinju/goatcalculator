import { formatMoney } from "@/lib/finance/format";
import { ScrollableRegion } from "./ScrollableRegion";

interface BalancePoint {
  month: number;
  endingBalance: string;
}

interface ScenarioSeries {
  label: string;
  schedule: BalancePoint[];
}

interface ScenarioMonthlyScheduleTableProps {
  series: ScenarioSeries[];
  captionPrefix?: string;
  regionLabel?: string;
  emptyMessage?: string;
}

/**
 * The month-by-month ending balance for each scenario, side by side.
 * Total contributions, interest earned and fees deducted per scenario are
 * shown in `ScenarioComparisonTable` above rather than repeated on every
 * row here, keeping this table usable at narrow widths.
 */
export function ScenarioMonthlyScheduleTable({
  series,
  captionPrefix = "Monthly scenario schedule",
  regionLabel = "Monthly schedule table, scrollable horizontally on narrow screens",
  emptyMessage = "No monthly schedule to show.",
}: ScenarioMonthlyScheduleTableProps) {
  const maxMonth = Math.max(...series.map((s) => s.schedule.length), 0);
  if (maxMonth === 0) {
    return <p className="text-sm text-navy-soft">{emptyMessage}</p>;
  }

  const lastValues = series.map((s) =>
    s.schedule.length > 0 ? s.schedule[s.schedule.length - 1].endingBalance : "0",
  );

  const rows = Array.from({ length: maxMonth }, (_, i) => {
    const month = i + 1;
    return {
      month,
      values: series.map((s, si) => s.schedule[i]?.endingBalance ?? lastValues[si]),
    };
  });

  return (
    <ScrollableRegion ariaLabel={regionLabel}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">
          {captionPrefix}: ending balance for each of {series.length} scenarios, for each of{" "}
          {rows.length} {rows.length === 1 ? "month" : "months"}.
        </caption>
        <thead className="sticky top-0 bg-teal-soft text-navy">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Month
            </th>
            {series.map((s) => (
              <th key={s.label} scope="col" className="px-3 py-2 text-right font-medium">
                {s.label} balance
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className="border-t border-border odd:bg-warm-white/60">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-navy-soft">
                {row.month}
              </th>
              {row.values.map((v, i) => (
                <td key={series[i].label} className="px-3 py-1.5 text-right tabular-nums">
                  {formatMoney(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableRegion>
  );
}
