import { formatMoney } from "@/lib/finance/format";
import { ScrollableRegion } from "./ScrollableRegion";

interface ScenarioSummary {
  label: string;
  finalBalance: string;
  buyingPowerToday: string;
  totalContributions: string;
  totalInterest: string;
  totalFeesDeducted: string;
}

interface ScenarioComparisonTableProps {
  scenarios: ScenarioSummary[];
  regionLabel?: string;
}

const METRICS: { key: keyof Omit<ScenarioSummary, "label">; label: string }[] = [
  { key: "finalBalance", label: "Final balance" },
  { key: "buyingPowerToday", label: "Estimated buying power in today's money" },
  { key: "totalContributions", label: "Total contributions" },
  { key: "totalInterest", label: "Total interest earned" },
  { key: "totalFeesDeducted", label: "Total fees deducted" },
];

/**
 * The accessible summary table alternative to the stat cards above it: one
 * row per metric, one column per scenario. Scenario labels are the
 * visitor's own chosen names, used for comparison only, never a
 * prediction or ranking.
 */
export function ScenarioComparisonTable({
  scenarios,
  regionLabel = "Scenario comparison table, scrollable horizontally on narrow screens",
}: ScenarioComparisonTableProps) {
  return (
    <ScrollableRegion ariaLabel={regionLabel}>
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <caption className="sr-only">
          Comparison of {scenarios.length} savings scenarios: final balance, estimated buying power
          in today&apos;s money, total contributions, total interest earned, and total fees
          deducted for each.
        </caption>
        <thead className="sticky top-0 bg-teal-soft text-navy">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Metric
            </th>
            {scenarios.map((s) => (
              <th key={s.label} scope="col" className="px-3 py-2 text-right font-medium">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => (
            <tr key={metric.key} className="border-t border-border odd:bg-warm-white/60">
              <th scope="row" className="px-3 py-1.5 text-left font-normal text-navy-soft">
                {metric.label}
              </th>
              {scenarios.map((s) => (
                <td key={s.label} className="px-3 py-1.5 text-right tabular-nums">
                  {formatMoney(s[metric.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableRegion>
  );
}
