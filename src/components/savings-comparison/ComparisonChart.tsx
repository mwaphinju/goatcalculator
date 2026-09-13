"use client";

import { useId } from "react";
import { formatMoney } from "@/lib/finance/format";
import type { ScheduleRow } from "@/lib/finance/types";

interface ComparisonChartProps {
  baselineSchedule: ScheduleRow[];
  baselineStartingBalance: string;
  alternativeSchedule: ScheduleRow[];
  alternativeStartingBalance: string;
}

const WIDTH = 640;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 64 };

function samplePoints<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = (items.length - 1) / (maxPoints - 1);
  const sampled: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(items[Math.round(i * step)]);
  }
  return sampled;
}

function toSeries(schedule: ScheduleRow[], startingBalance: string, maxMonth: number) {
  const points = samplePoints(schedule, 60);
  const series: { month: number; value: number }[] = [{ month: 0, value: Number(startingBalance) }];
  for (const row of points) {
    series.push({ month: row.month, value: Number(row.endingBalance) });
  }
  if (series[series.length - 1].month < maxMonth) {
    series.push({ month: maxMonth, value: series[series.length - 1].value });
  }
  return series;
}

/** Accessible two-line chart comparing a baseline and an alternative savings scenario over time. */
export function ComparisonChart({
  baselineSchedule,
  baselineStartingBalance,
  alternativeSchedule,
  alternativeStartingBalance,
}: ComparisonChartProps) {
  const chartDescriptionId = useId();

  const maxMonth = Math.max(baselineSchedule.length, alternativeSchedule.length);
  if (maxMonth === 0) return null;

  const baselineSeries = toSeries(baselineSchedule, baselineStartingBalance, maxMonth);
  const alternativeSeries = toSeries(alternativeSchedule, alternativeStartingBalance, maxMonth);

  const maxValue = Math.max(
    ...baselineSeries.map((p) => p.value),
    ...alternativeSeries.map((p) => p.value),
    1,
  );

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (month: number) => PADDING.left + (month / maxMonth) * innerWidth;
  const y = (value: number) => PADDING.top + innerHeight - (value / maxValue) * innerHeight;

  const pathFor = (series: { month: number; value: number }[]) =>
    series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.month).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  const baselinePath = pathFor(baselineSeries);
  const alternativePath = pathFor(alternativeSeries);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  const finalBaseline = baselineSeries[baselineSeries.length - 1].value;
  const finalAlternative = alternativeSeries[alternativeSeries.length - 1].value;

  return (
    <figure>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-labelledby={chartDescriptionId} className="w-full text-navy-soft">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(tick)} y2={y(tick)} stroke="var(--color-border)" strokeWidth={1} />
            <text x={PADDING.left - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="currentColor">
              {formatMoney(String(tick)).replace(".00", "")}
            </text>
          </g>
        ))}

        <path d={baselinePath} fill="none" stroke="var(--color-navy-soft)" strokeWidth={2} strokeDasharray="4 3" />
        <path d={alternativePath} fill="none" stroke="var(--color-teal-dark)" strokeWidth={2.5} />

        <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill="currentColor">
          Month 0
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={10} fill="currentColor" textAnchor="end">
          Month {maxMonth}
        </text>
      </svg>

      <figcaption id={chartDescriptionId} className="mt-2 text-sm text-navy-soft">
        Balance over {maxMonth} {maxMonth === 1 ? "month" : "months"}: the dashed line is the
        baseline scenario, ending at {formatMoney(String(finalBaseline))}. The solid teal line is
        the alternative scenario, ending at {formatMoney(String(finalAlternative))}. Exact figures
        for every month are in the table below.
      </figcaption>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-navy-soft">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-navy-soft" aria-hidden /> Baseline
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-teal-dark" aria-hidden /> Alternative
        </span>
      </div>
    </figure>
  );
}
