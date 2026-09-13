"use client";

import { useId, useState } from "react";
import { calculateSavingsGoal } from "@/lib/finance/savingsGoal";
import { SAVINGS_GOAL_LIMITS } from "@/lib/finance/limits";
import {
  validateMonthsField,
  validateNumberField,
  validateTargetBalanceField,
  type FieldValidation,
} from "@/lib/finance/validation";
import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { ContributionTiming, RateMode, SavingsGoalInput } from "@/lib/finance/types";
import { useExampleOrigin } from "@/hooks/useExampleOrigin";
import { useTouchedFields } from "@/hooks/useTouchedFields";
import { NumberField } from "@/components/shared/NumberField";
import { RateField } from "@/components/shared/RateField";
import { RadioGroup } from "@/components/shared/RadioGroup";
import { StatCard } from "@/components/shared/StatCard";
import { GrowthChart } from "@/components/shared/GrowthChart";
import { MonthlyScheduleTable } from "@/components/shared/MonthlyScheduleTable";
import { PrintButton } from "@/components/shared/PrintButton";
import { CsvDownloadButton } from "@/components/shared/CsvDownloadButton";
import { toCsv } from "@/lib/csv";

const FIELD_KEYS = ["startingBalance", "targetBalance", "duration", "rate"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  startingBalance: "Starting balance",
  targetBalance: "Target balance",
  duration: "Duration",
  rate: "Rate",
};

const EXAMPLE = {
  startingBalance: "1000",
  targetBalance: "20000",
  months: "60",
  rateMode: "nominal" as RateMode,
  rate: "6",
  timing: "end" as ContributionTiming,
};

function restoreZeroOnBlur(value: string, setValue: (v: string) => void) {
  if (value.trim() === "") setValue("0");
}

export function SavingsGoalCalculator() {
  const idPrefix = useId();

  const [startingBalanceStr, setStartingBalanceStr] = useState("0");
  const [targetBalanceStr, setTargetBalanceStr] = useState("");
  const [monthsStr, setMonthsStr] = useState("");
  const [rateMode, setRateMode] = useState<RateMode>("nominal");
  const [rateStr, setRateStr] = useState("");
  const [timing, setTiming] = useState<ContributionTiming>("end");

  const { origin, exampleResidue, onFieldEdit, onUntrackedEdit, activateExample } =
    useExampleOrigin<FieldKey>(FIELD_KEYS);
  const { touched, markTouched } = useTouchedFields<"targetBalance" | "duration" | "rate">();

  function tryExample() {
    setStartingBalanceStr(EXAMPLE.startingBalance);
    setTargetBalanceStr(EXAMPLE.targetBalance);
    setMonthsStr(EXAMPLE.months);
    setRateMode(EXAMPLE.rateMode);
    setRateStr(EXAMPLE.rate);
    setTiming(EXAMPLE.timing);
    activateExample();
  }

  const vStartingBalance = validateNumberField(
    startingBalanceStr,
    SAVINGS_GOAL_LIMITS.startingBalance,
    FIELD_LABELS.startingBalance,
  );
  const vTargetBalance = validateTargetBalanceField(
    targetBalanceStr,
    SAVINGS_GOAL_LIMITS.targetBalance,
    FIELD_LABELS.targetBalance,
  );
  const vMonths = validateMonthsField(monthsStr, FIELD_LABELS.duration, SAVINGS_GOAL_LIMITS.months.max);
  const vRate = validateNumberField(rateStr, SAVINGS_GOAL_LIMITS.rate, FIELD_LABELS.rate);

  const validations: Record<FieldKey, FieldValidation> = {
    startingBalance: vStartingBalance,
    targetBalance: vTargetBalance,
    duration: vMonths,
    rate: vRate,
  };

  const allValid = FIELD_KEYS.every((k) => validations[k].status === "valid");
  const attempted = origin !== "default";

  const requiredError = (key: "targetBalance" | "duration" | "rate", message: string) =>
    (touched.has(key) || attempted) && validations[key].status !== "valid" ? message : null;

  const errorMessage = (key: FieldKey): string | null => {
    if (key === "targetBalance") return requiredError("targetBalance", "Enter a target balance.");
    if (key === "duration") return requiredError("duration", "Enter a duration.");
    if (key === "rate") {
      return requiredError("rate", "Enter an annual rate or APY.");
    }
    const v = validations[key];
    return v.status === "invalid" ? v.message : null;
  };
  // Non-required-field validation errors (out-of-range, not just empty) show immediately.
  const hardErrorMessage = (key: FieldKey): string | null => {
    const v = validations[key];
    if (v.status === "invalid") return v.message;
    return errorMessage(key);
  };

  let input: SavingsGoalInput | null = null;
  if (
    allValid &&
    vStartingBalance.status === "valid" &&
    vTargetBalance.status === "valid" &&
    vMonths.status === "valid" &&
    vRate.status === "valid"
  ) {
    input = {
      startingBalance: vStartingBalance.value,
      targetBalance: vTargetBalance.value,
      months: vMonths.value,
      rateMode,
      ratePercent: vRate.value,
      timing,
    };
  }

  const result = input ? calculateSavingsGoal(input) : null;

  const showExampleBanner = origin === "example";
  const showResidueNotice = origin === "user" && exampleResidue.size > 0;

  function downloadScheduleCsv() {
    if (!result || !input) return "";
    const generatedAt = new Date().toLocaleString("en-US");
    const rows: (string | number)[][] = [
      ["GOAT Calculator: Savings goal calculator"],
      ["Generated", generatedAt],
      [],
      ["Starting balance", formatMoney(result.startingBalance)],
      ["Target balance", formatMoney(String(input.targetBalance))],
      ["Duration (months)", input.months],
      ["Rate type", rateMode === "apy" ? "APY" : "Nominal annual rate, compounded monthly"],
      ["Rate (%)", input.ratePercent],
      ["Contribution timing", timing === "end" ? "End of each month" : "Beginning of each month"],
      ["Required monthly contribution", result.requiredMonthlyContribution !== null ? formatMoney(result.requiredMonthlyContribution) : "Not applicable"],
      ["Final balance", formatMoney(result.finalBalance)],
      ["Total contributions", formatMoney(result.totalContributions)],
      ["Estimated interest", formatMoney(result.totalInterest)],
      ["Excludes taxes, fees, inflation and variable rates", "Yes"],
      [],
      ["Month", "Starting balance", "Contribution", "Interest earned", "Ending balance"],
      ...result.schedule.map((row) => [
        row.month,
        formatMoney(row.startingBalance),
        formatMoney(row.contribution),
        formatMoney(row.interest),
        formatMoney(row.endingBalance),
      ]),
    ];
    return toCsv(rows);
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
      <section aria-labelledby={`${idPrefix}-inputs-heading`} className="space-y-5">
        <h2 id={`${idPrefix}-inputs-heading`} className="text-lg font-semibold text-navy">
          Your goal
        </h2>

        {showExampleBanner ? (
          <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
            Illustrative example. Edit these assumptions.
          </p>
        ) : null}
        {showResidueNotice ? (
          <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm text-amber">
            You&apos;re editing your own scenario. These fields still show
            example values:{" "}
            {Array.from(exampleResidue)
              .map((k) => FIELD_LABELS[k])
              .join(", ")}
            .
          </p>
        ) : null}

        <NumberField
          id={`${idPrefix}-starting-balance`}
          label={FIELD_LABELS.startingBalance}
          unitLabel="your currency, e.g. $"
          value={startingBalanceStr}
          onChange={(v) => {
            setStartingBalanceStr(v);
            onFieldEdit("startingBalance");
          }}
          onBlur={() => restoreZeroOnBlur(startingBalanceStr, setStartingBalanceStr)}
          errorMessage={hardErrorMessage("startingBalance")}
          isExampleValue={exampleResidue.has("startingBalance")}
        />

        <NumberField
          id={`${idPrefix}-target-balance`}
          label={FIELD_LABELS.targetBalance}
          unitLabel="your currency"
          value={targetBalanceStr}
          onChange={(v) => {
            setTargetBalanceStr(v);
            onFieldEdit("targetBalance");
          }}
          onBlur={() => markTouched("targetBalance")}
          placeholder="e.g. 20000"
          required
          errorMessage={hardErrorMessage("targetBalance")}
          isExampleValue={exampleResidue.has("targetBalance")}
        />

        <NumberField
          id={`${idPrefix}-months`}
          label={FIELD_LABELS.duration}
          unitLabel="whole months"
          value={monthsStr}
          onChange={(v) => {
            setMonthsStr(v);
            onFieldEdit("duration");
          }}
          onBlur={() => markTouched("duration")}
          placeholder="e.g. 60"
          required
          errorMessage={hardErrorMessage("duration")}
          isExampleValue={exampleResidue.has("duration")}
        />

        <RateField
          idPrefix={idPrefix}
          rateMode={rateMode}
          onRateModeChange={(mode) => {
            setRateMode(mode);
            onUntrackedEdit();
          }}
          rateStr={rateStr}
          onRateChange={(v) => {
            setRateStr(v);
            onFieldEdit("rate");
          }}
          onBlur={() => markTouched("rate")}
          errorMessage={hardErrorMessage("rate")}
          isExampleValue={exampleResidue.has("rate")}
          onTryExample={tryExample}
        />

        <RadioGroup
          legend="When is the monthly contribution added?"
          name={`${idPrefix}-timing`}
          value={timing}
          onChange={(v) => {
            setTiming(v as ContributionTiming);
            onUntrackedEdit();
          }}
          options={[
            { value: "end", label: "End of each month (contribution added after that month's interest)" },
            { value: "begin", label: "Beginning of each month (contribution added before that month's interest)" },
          ]}
        />

        {!allValid ? (
          <div
            role="status"
            className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-navy-soft"
          >
            <p>
              Enter a target balance, duration, and an annual rate or APY to
              see how much you would need to save each month. A zero amount
              means none.
            </p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Required monthly saving
          </h2>
          {result ? (
            <div className="flex gap-2">
              <PrintButton />
              <CsvDownloadButton filename="goat-calculator-savings-goal.csv" getContent={downloadScheduleCsv} />
            </div>
          ) : null}
        </div>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter a target balance, duration, and an annual rate or APY to
            see how much you would need to save each month. A zero amount
            means none.
          </p>
        ) : (
          <>
            {showExampleBanner ? (
              <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
                Illustrative example. Edit these assumptions.
              </p>
            ) : null}

            {result.reason === "impossible-zero-duration" ? (
              <p className="rounded-md border border-red-soft bg-red-soft px-4 py-3 text-sm text-red">
                With a duration of 0 months, there is no monthly period in
                which to reach a target above your starting balance. Enter a
                duration of at least 1 month, or lower your target to your
                starting balance or below.
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Required monthly saving"
                    value={formatMoney(result.requiredMonthlyContribution ?? "0")}
                    accentClassName="text-teal-dark"
                  />
                  <StatCard label="Projected final balance" value={formatMoney(result.finalBalance)} />
                  <StatCard label="Total contributions" value={formatMoney(result.totalContributions)} />
                  <StatCard label="Estimated interest" value={formatMoney(result.totalInterest)} />
                </dl>

                <p className="text-sm text-navy-soft">
                  {result.reason === "already-met"
                    ? `Your starting balance of ${formatMoney(result.startingBalance)} already meets or exceeds your target, so no monthly saving is required.`
                    : result.reason === "interest-alone"
                      ? `Interest alone is projected to reach your target from your starting balance of ${formatMoney(result.startingBalance)}, so no monthly saving is required.`
                      : `Saving ${formatMoney(result.requiredMonthlyContribution ?? "0")} each month, starting from ${formatMoney(result.startingBalance)}, is projected to reach your target of ${formatMoney(String(input.targetBalance))} after ${formatDuration(input.months) || "0 months"}. Of the projected ${formatMoney(result.finalBalance)} final balance, ${formatMoney(result.totalContributions)} is money you contributed and ${formatMoney(result.totalInterest)} is estimated interest.`}{" "}
                  Actual results may differ because future rates can change.
                </p>

                <GrowthChart schedule={result.schedule} startingBalance={result.startingBalance} />

                <details className="rounded-md border border-border bg-surface p-4">
                  <summary className="cursor-pointer select-none font-medium text-navy">
                    Assumptions used {showExampleBanner ? "(illustrative example)" : ""}
                  </summary>
                  <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-navy-soft">Starting balance</dt>
                      <dd className="font-medium text-navy">{formatMoney(result.startingBalance)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-navy-soft">Target balance</dt>
                      <dd className="font-medium text-navy">{formatMoney(String(input.targetBalance))}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-navy-soft">Duration</dt>
                      <dd className="font-medium text-navy">
                        {input.months} {input.months === 1 ? "month" : "months"}
                        {input.months >= 12 ? ` (${formatDuration(input.months)})` : ""}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-navy-soft">Rate type</dt>
                      <dd className="font-medium text-navy">
                        {rateMode === "apy" ? "APY" : "Nominal annual rate, compounded monthly"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-navy-soft">Rate</dt>
                      <dd className="font-medium text-navy">{formatPercent(input.ratePercent)}</dd>
                    </div>
                    <div className="flex justify-between gap-2 sm:block">
                      <dt className="text-navy-soft">Contribution timing</dt>
                      <dd className="font-medium text-navy">
                        {input.timing === "end" ? "End of each month" : "Beginning of each month"}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 border-t border-border pt-3 text-xs text-navy-soft">
                    This projection does not include taxes, account fees,
                    inflation, or the possibility that rates change. See the{" "}
                    <a href="/methodology" className="text-teal-dark underline hover:text-teal">
                      methodology page
                    </a>{" "}
                    for what is and isn&apos;t modeled.
                  </p>
                </details>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-navy">Monthly schedule</h3>
                  <MonthlyScheduleTable
                    schedule={result.schedule}
                    captionPrefix="Monthly savings goal schedule"
                    regionLabel="Monthly savings goal schedule table, scrollable horizontally on narrow screens"
                  />
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
