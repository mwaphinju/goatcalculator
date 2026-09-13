"use client";

import { useId } from "react";
import { formatMoney } from "@/lib/finance/format";
import type { LoanScheduleRow } from "@/lib/finance/types";

interface LoanBalanceChartProps {
  schedule: LoanScheduleRow[];
  startingBalance: string;
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

/** Shows a loan's remaining balance declining to zero over its term. */
export function LoanBalanceChart({ schedule, startingBalance }: LoanBalanceChartProps) {
  const chartDescriptionId = useId();

  if (schedule.length === 0) return null;

  const points = samplePoints(schedule, 60);
  const maxMonth = schedule.length;
  const series: { month: number; value: number }[] = [{ month: 0, value: Number(startingBalance) }];
  for (const row of points) {
    series.push({ month: row.month, value: Number(row.endingBalance) });
  }

  const maxValue = Math.max(...series.map((p) => p.value), 1);
  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (month: number) => PADDING.left + (month / maxMonth) * innerWidth;
  const y = (value: number) => PADDING.top + innerHeight - (value / maxValue) * innerHeight;

  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.month).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(" ");
  const areaPath = [
    path,
    `L ${x(series[series.length - 1].month).toFixed(1)} ${y(0).toFixed(1)}`,
    `L ${x(0).toFixed(1)} ${y(0).toFixed(1)}`,
    "Z",
  ].join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

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
        <path d={areaPath} fill="var(--color-teal-soft)" stroke="none" />
        <path d={path} fill="none" stroke="var(--color-teal-dark)" strokeWidth={2.5} />
        <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill="currentColor">
          Month 0
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={10} fill="currentColor" textAnchor="end">
          Month {maxMonth}
        </text>
      </svg>
      <figcaption id={chartDescriptionId} className="mt-2 text-sm text-navy-soft">
        Remaining balance over {maxMonth} {maxMonth === 1 ? "month" : "months"}: starting at{" "}
        {formatMoney(startingBalance)} and declining to $0.00 as payments are applied. Exact
        figures for every month are in the table below.
      </figcaption>
    </figure>
  );
}
