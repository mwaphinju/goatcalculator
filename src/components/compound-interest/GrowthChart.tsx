import { formatMoney } from "@/lib/finance/format";
import type { ScheduleRow } from "@/lib/finance/types";

interface GrowthChartProps {
  schedule: ScheduleRow[];
  initialBalance: string;
}

const WIDTH = 640;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 64 };

/** Picks at most `maxPoints` evenly-spaced points, always keeping the first and last. */
function samplePoints<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = (items.length - 1) / (maxPoints - 1);
  const sampled: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(items[Math.round(i * step)]);
  }
  return sampled;
}

export function GrowthChart({ schedule, initialBalance }: GrowthChartProps) {
  if (schedule.length === 0) {
    return null;
  }

  const points = samplePoints(schedule, 60);
  const startBalance = Number(initialBalance);

  const principalSeries: { month: number; value: number }[] = [
    { month: 0, value: startBalance },
  ];
  const balanceSeries: { month: number; value: number }[] = [
    { month: 0, value: startBalance },
  ];

  let cumulativePrincipal = startBalance;
  for (const row of points) {
    cumulativePrincipal += Number(row.contribution);
    principalSeries.push({ month: row.month, value: cumulativePrincipal });
    balanceSeries.push({ month: row.month, value: Number(row.endingBalance) });
  }

  const maxMonth = schedule.length;
  const maxValue = Math.max(...balanceSeries.map((p) => p.value), 1);

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const x = (month: number) => PADDING.left + (month / maxMonth) * innerWidth;
  const y = (value: number) => PADDING.top + innerHeight - (value / maxValue) * innerHeight;

  const balancePath = balanceSeries
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.month).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");
  const principalPath = principalSeries
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.month).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");

  const areaPath = [
    balancePath,
    `L ${x(principalSeries[principalSeries.length - 1].month).toFixed(1)} ${y(
      principalSeries[principalSeries.length - 1].value,
    ).toFixed(1)}`,
    ...principalSeries
      .slice()
      .reverse()
      .map((p) => `L ${x(p.month).toFixed(1)} ${y(p.value).toFixed(1)}`),
    "Z",
  ].join(" ");

  const finalBalance = balanceSeries[balanceSeries.length - 1].value;
  const finalPrincipal = principalSeries[principalSeries.length - 1].value;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  const chartDescriptionId = "growth-chart-description";

  return (
    <figure>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-labelledby={chartDescriptionId}
        className="w-full text-navy-soft"
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
            <text x={PADDING.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="currentColor">
              {formatMoney(String(tick)).replace(".00", "")}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="var(--color-teal-soft)" stroke="none" />
        <path d={principalPath} fill="none" stroke="var(--color-navy-soft)" strokeWidth={2} strokeDasharray="4 3" />
        <path d={balancePath} fill="none" stroke="var(--color-teal-dark)" strokeWidth={2.5} />

        <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill="currentColor">
          Month 0
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={10} fill="currentColor" textAnchor="end">
          Month {maxMonth}
        </text>
      </svg>

      <figcaption id={chartDescriptionId} className="mt-2 text-sm text-navy-soft">
        Growth over {maxMonth} {maxMonth === 1 ? "month" : "months"}: the solid
        teal line is the projected balance, ending at {formatMoney(String(finalBalance))}.
        The dashed line is money put in (starting balance plus contributions),
        ending at {formatMoney(String(finalPrincipal))}. The shaded gap between
        the lines is interest earned. Exact figures for every month are in the
        table below.
      </figcaption>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-navy-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-teal-dark" aria-hidden /> Balance
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-navy-soft" aria-hidden /> Contributed + initial
        </span>
      </div>
    </figure>
  );
}
