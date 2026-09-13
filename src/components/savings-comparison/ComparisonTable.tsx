import Decimal from "decimal.js";
import { formatMoney } from "@/lib/finance/format";
import type { ScheduleRow } from "@/lib/finance/types";
import { ScrollableRegion } from "@/components/shared/ScrollableRegion";

interface ComparisonTableProps {
  baselineSchedule: ScheduleRow[];
  alternativeSchedule: ScheduleRow[];
}

/** The accessible table alternative to the comparison chart: baseline vs. alternative ending balance, month by month. */
export function ComparisonTable({ baselineSchedule, alternativeSchedule }: ComparisonTableProps) {
  const maxMonth = Math.max(baselineSchedule.length, alternativeSchedule.length);
  if (maxMonth === 0) {
    return <p className="text-sm text-navy-soft">No monthly schedule to show for a duration of 0 months.</p>;
  }

  const byMonth = new Map<number, { baseline?: string; alternative?: string }>();
  for (const row of baselineSchedule) {
    byMonth.set(row.month, { ...byMonth.get(row.month), baseline: row.endingBalance });
  }
  for (const row of alternativeSchedule) {
    byMonth.set(row.month, { ...byMonth.get(row.month), alternative: row.endingBalance });
  }

  const lastBaseline = baselineSchedule.length > 0 ? baselineSchedule[baselineSchedule.length - 1].endingBalance : "0";
  const lastAlternative =
    alternativeSchedule.length > 0 ? alternativeSchedule[alternativeSchedule.length - 1].endingBalance : "0";

  const rows = Array.from({ length: maxMonth }, (_, i) => {
    const month = i + 1;
    const entry = byMonth.get(month);
    const baseline = entry?.baseline ?? lastBaseline;
    const alternative = entry?.alternative ?? lastAlternative;
    const difference = new Decimal(alternative).minus(baseline);
    return { month, baseline, alternative, difference: difference.toString() };
  });

  return (
    <ScrollableRegion ariaLabel="Comparison schedule table, scrollable horizontally on narrow screens">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">
          Monthly comparison schedule: baseline balance, alternative balance and the difference
          between them for each of {rows.length} {rows.length === 1 ? "month" : "months"}.
        </caption>
        <thead className="sticky top-0 bg-teal-soft text-navy">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Month
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Baseline balance
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Alternative balance
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Difference
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month} className="border-t border-border odd:bg-warm-white/60">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-navy-soft">
                {row.month}
              </th>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(row.baseline)}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatMoney(row.alternative)}</td>
              <td className="px-3 py-1.5 text-right font-medium tabular-nums">{formatMoney(row.difference)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableRegion>
  );
}
