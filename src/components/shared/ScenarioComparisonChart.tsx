"use client";

import { useId } from "react";
import { formatMoney } from "@/lib/finance/format";

/** The minimal shape any schedule row needs for this chart: a month number and the balance at the end of it. */
interface BalancePoint {
  month: number;
  endingBalance: string;
}

interface ScenarioSeriesInput {
  label: string;
  schedule: BalancePoint[];
  startingBalance: string;
}

interface ScenarioComparisonChartProps {
  series: ScenarioSeriesInput[];
}

const WIDTH = 640;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 64 };

/**
 * Each scenario line uses both a distinct color and a distinct dash
 * pattern, so up to three scenarios stay distinguishable without relying
 * on color alone.
 */
const LINE_STYLES: { stroke: string; dasharray?: string; width: number; legendStyle: "solid" | "dashed" | "dotted" }[] = [
  { stroke: "var(--color-teal-dark)", width: 2.5, legendStyle: "solid" },
  { stroke: "var(--color-navy-soft)", dasharray: "5 4", width: 2, legendStyle: "dashed" },
  { stroke: "var(--color-amber)", dasharray: "1.5 3.5", width: 2.5, legendStyle: "dotted" },
];

function samplePoints<T>(items: T[], maxPoints: number): T[] {
  if (items.length <= maxPoints) return items;
  const step = (items.length - 1) / (maxPoints - 1);
  const sampled: T[] = [];
  for (let i = 0; i < maxPoints; i++) {
    sampled.push(items[Math.round(i * step)]);
  }
  return sampled;
}

function toSeriesPoints(schedule: BalancePoint[], startingBalance: string, maxMonth: number) {
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

/**
 * Accessible multi-line chart comparing up to three savings scenarios'
 * balance over time. Used by the savings scenario calculator, where each
 * scenario is an assumption the visitor chose, not a prediction.
 */
export function ScenarioComparisonChart({ series }: ScenarioComparisonChartProps) {
  const chartDescriptionId = useId();

  const maxMonth = Math.max(...series.map((s) => s.schedule.length), 0);
  if (maxMonth === 0) return null;

  const pointSeries = series.map((s) => toSeriesPoints(s.schedule, s.startingBalance, maxMonth));
  const maxValue = Math.max(...pointSeries.flatMap((p) => p.map((point) => point.value)), 1);

  const innerWidth = WIDTH - PADDING.left - PADDING.right;
  const innerHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const x = (month: number) => PADDING.left + (month / maxMonth) * innerWidth;
  const y = (value: number) => PADDING.top + innerHeight - (value / maxValue) * innerHeight;

  const pathFor = (points: { month: number; value: number }[]) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(p.month).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  const finalValues = pointSeries.map((points) => points[points.length - 1].value);

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

        {pointSeries.map((points, i) => {
          const style = LINE_STYLES[i % LINE_STYLES.length];
          return (
            <path
              key={series[i].label}
              d={pathFor(points)}
              fill="none"
              stroke={style.stroke}
              strokeWidth={style.width}
              strokeDasharray={style.dasharray}
            />
          );
        })}

        <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill="currentColor">
          Month 0
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={10} fill="currentColor" textAnchor="end">
          Month {maxMonth}
        </text>
      </svg>

      <figcaption id={chartDescriptionId} className="mt-2 text-sm text-navy-soft">
        Balance over {maxMonth} {maxMonth === 1 ? "month" : "months"} for each scenario, using the
        assumptions you entered:{" "}
        {series.map((s, i) => `${s.label}, ending at ${formatMoney(String(finalValues[i]))}`).join("; ")}.
        These are assumptions you chose for comparison, not predictions of
        what will happen. Exact figures for every month are in the table
        below.
      </figcaption>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-navy-soft">
        {series.map((s, i) => {
          const style = LINE_STYLES[i % LINE_STYLES.length];
          return (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-0 w-4"
                style={{
                  borderTopWidth: 2,
                  borderTopStyle: style.legendStyle,
                  borderTopColor: style.stroke,
                }}
                aria-hidden
              />
              {s.label}
            </span>
          );
        })}
      </div>
    </figure>
  );
}
