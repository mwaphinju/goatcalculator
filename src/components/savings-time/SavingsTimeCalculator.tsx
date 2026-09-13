"use client";

import { useId, useState } from "react";
import { calculateSavingsTime } from "@/lib/finance/savingsTime";
import { SAVINGS_TIME_LIMITS } from "@/lib/finance/limits";
import {
  validateNumberField,
  validateTargetBalanceField,
  type FieldValidation,
} from "@/lib/finance/validation";
import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { ContributionTiming, RateMode, SavingsTimeInput } from "@/lib/finance/types";
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

const FIELD_KEYS = ["startingBalance", "targetBalance", "monthlyContribution", "rate"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  startingBalance: "Starting balance",
  targetBalance: "Target balance",
  monthlyContribution: "Monthly contribution",
  rate: "Rate",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EXAMPLE = {
  startingBalance: "1000",
  targetBalance: "20000",
  monthlyContribution: "300",
  rateMode: "nominal" as RateMode,
  rate: "6",
  timing: "end" as ContributionTiming,
};

function restoreZeroOnBlur(value: string, setValue: (v: string) => void) {
  if (value.trim() === "") setValue("0");
}

function addMonthsToDate(year: number, month1to12: number, monthsToAdd: number): { year: number; month: number } {
  const zeroBased = month1to12 - 1 + monthsToAdd;
  const year2 = year + Math.floor(zeroBased / 12);
  const month2 = ((zeroBased % 12) + 12) % 12;
  return { year: year2, month: month2 + 1 };
}

export function SavingsTimeCalculator() {
  const idPrefix = useId();

  const [startingBalanceStr, setStartingBalanceStr] = useState("0");
  const [targetBalanceStr, setTargetBalanceStr] = useState("");
  const [contributionStr, setContributionStr] = useState("0");
  const [rateMode, setRateMode] = useState<RateMode>("nominal");
  const [rateStr, setRateStr] = useState("");
  const [timing, setTiming] = useState<ContributionTiming>("end");
  const [startYearStr, setStartYearStr] = useState("");
  const [startMonthStr, setStartMonthStr] = useState("");

  const { origin, exampleResidue, onFieldEdit, onUntrackedEdit, activateExample } =
    useExampleOrigin<FieldKey>(FIELD_KEYS);
  const { touched, markTouched } = useTouchedFields<"targetBalance" | "rate">();

  function tryExample() {
    setStartingBalanceStr(EXAMPLE.startingBalance);
    setTargetBalanceStr(EXAMPLE.targetBalance);
    setContributionStr(EXAMPLE.monthlyContribution);
    setRateMode(EXAMPLE.rateMode);
    setRateStr(EXAMPLE.rate);
    setTiming(EXAMPLE.timing);
    activateExample();
  }

  const vStartingBalance = validateNumberField(
    startingBalanceStr,
    SAVINGS_TIME_LIMITS.startingBalance,
    FIELD_LABELS.startingBalance,
  );
  const vTargetBalance = validateTargetBalanceField(
    targetBalanceStr,
    SAVINGS_TIME_LIMITS.targetBalance,
    FIELD_LABELS.targetBalance,
  );
  const vContribution = validateNumberField(
    contributionStr,
    SAVINGS_TIME_LIMITS.monthlyContribution,
    FIELD_LABELS.monthlyContribution,
  );
  const vRate = validateNumberField(rateStr, SAVINGS_TIME_LIMITS.rate, FIELD_LABELS.rate);

  const validations: Record<FieldKey, FieldValidation> = {
    startingBalance: vStartingBalance,
    targetBalance: vTargetBalance,
    monthlyContribution: vContribution,
    rate: vRate,
  };

  const allValid = FIELD_KEYS.every((k) => validations[k].status === "valid");
  const attempted = origin !== "default";

  const requiredError = (key: "targetBalance" | "rate", message: string) =>
    (touched.has(key) || attempted) && validations[key].status !== "valid" ? message : null;

  const hardErrorMessage = (key: FieldKey): string | null => {
    const v = validations[key];
    if (v.status === "invalid") return v.message;
    if (key === "targetBalance") return requiredError("targetBalance", "Enter a target balance.");
    if (key === "rate") return requiredError("rate", "Enter an annual rate or APY.");
    return null;
  };

  // Optional starting month/year: empty is valid (date display simply
  // doesn't appear); a value only counts once both parts are filled.
  const startYearNum = startYearStr.trim() === "" ? null : Number(startYearStr);
  const startMonthNum = startMonthStr.trim() === "" ? null : Number(startMonthStr);
  const hasValidStartDate =
    startYearNum !== null &&
    startMonthNum !== null &&
    Number.isInteger(startYearNum) &&
    Number.isInteger(startMonthNum) &&
    startMonthNum >= 1 &&
    startMonthNum <= 12 &&
    startYearNum >= 1900 &&
    startYearNum <= 2200;

  let input: SavingsTimeInput | null = null;
  if (
    allValid &&
    vStartingBalance.status === "valid" &&
    vTargetBalance.status === "valid" &&
    vContribution.status === "valid" &&
    vRate.status === "valid"
  ) {
    input = {
      startingBalance: vStartingBalance.value,
      targetBalance: vTargetBalance.value,
      monthlyContribution: vContribution.value,
      rateMode,
      ratePercent: vRate.value,
      timing,
    };
  }

  const result = input ? calculateSavingsTime(input) : null;

  const showExampleBanner = origin === "example";
  const showResidueNotice = origin === "user" && exampleResidue.size > 0;

  const reachedDate =
    result && result.monthsToReach !== null && hasValidStartDate && startYearNum !== null && startMonthNum !== null
      ? addMonthsToDate(startYearNum, startMonthNum, result.monthsToReach)
      : null;

  function downloadScheduleCsv() {
    if (!result || !input) return "";
    const generatedAt = new Date().toLocaleString("en-US");
    const rows: (string | number)[][] = [
      ["GOAT Calculator: Savings time calculator"],
      ["Generated", generatedAt],
      [],
      ["Starting balance", formatMoney(result.startingBalance)],
      ["Target balance", formatMoney(String(input.targetBalance))],
      ["Monthly contribution", formatMoney(String(input.monthlyContribution))],
      ["Rate type", rateMode === "apy" ? "APY" : "Nominal annual rate, compounded monthly"],
      ["Rate (%)", input.ratePercent],
      ["Contribution timing", timing === "end" ? "End of each month" : "Beginning of each month"],
      ["Months to reach target", result.monthsToReach ?? "Not reached within the documented maximum"],
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
          Your plan
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
          id={`${idPrefix}-contribution`}
          label={FIELD_LABELS.monthlyContribution}
          unitLabel="your currency per month"
          value={contributionStr}
          onChange={(v) => {
            setContributionStr(v);
            onFieldEdit("monthlyContribution");
          }}
          onBlur={() => restoreZeroOnBlur(contributionStr, setContributionStr)}
          errorMessage={hardErrorMessage("monthlyContribution")}
          isExampleValue={exampleResidue.has("monthlyContribution")}
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

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-navy">
            Starting month and year (optional)
          </legend>
          <p className="mb-2 text-xs text-navy-soft">
            Leave blank to see the duration only. Enter both to also see an
            estimated calendar date.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor={`${idPrefix}-start-month`} className="mb-1 block text-sm font-medium text-navy">
                Month
              </label>
              <select
                id={`${idPrefix}-start-month`}
                value={startMonthStr}
                onChange={(e) => {
                  setStartMonthStr(e.target.value);
                  onUntrackedEdit();
                }}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-navy shadow-sm focus:outline-none"
              >
                <option value="">Not set</option>
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={String(i + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <NumberField
                id={`${idPrefix}-start-year`}
                label="Year"
                value={startYearStr}
                onChange={(v) => {
                  setStartYearStr(v);
                  onUntrackedEdit();
                }}
                placeholder="e.g. 2026"
              />
            </div>
          </div>
        </fieldset>

        {!allValid ? (
          <div
            role="status"
            className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-navy-soft"
          >
            <p>
              Enter a target balance and an annual rate or APY to see how
              long it would take to reach your goal. A zero amount means
              none.
            </p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Time to reach your target
          </h2>
          {result ? (
            <div className="flex gap-2">
              <PrintButton />
              <CsvDownloadButton filename="goat-calculator-savings-time.csv" getContent={downloadScheduleCsv} />
            </div>
          ) : null}
        </div>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter a target balance and an annual rate or APY to see how
            long it would take to reach your goal. A zero amount means
            none.
          </p>
        ) : (
          <>
            {showExampleBanner ? (
              <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
                Illustrative example. Edit these assumptions.
              </p>
            ) : null}

            {result.reason === "already-reached" ? (
              <p className="rounded-md border border-teal bg-teal-soft/40 px-4 py-3 text-sm text-navy">
                Your target is already reached: your starting balance of{" "}
                {formatMoney(result.startingBalance)} already meets or
                exceeds your target. That is 0 months.
              </p>
            ) : result.reason === "not-reached" ? (
              <p className="rounded-md border border-red-soft bg-red-soft px-4 py-3 text-sm text-red">
                With no monthly contribution and a 0% rate, your balance
                never changes, so your target is not reached under the
                entered assumptions. Add a monthly contribution or a
                positive rate to see a projection.
              </p>
            ) : result.reason === "exceeds-max" ? (
              <p className="rounded-md border border-red-soft bg-red-soft px-4 py-3 text-sm text-red">
                Your target is not reached within the documented maximum of{" "}
                {result.maxMonths} months, which is {formatDuration(result.maxMonths)}, under the
                entered assumptions. Try a higher monthly contribution or a
                higher rate.
              </p>
            ) : (
              <>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard
                    label="Time to reach target"
                    value={formatDuration(result.monthsToReach ?? 0) || "0 months"}
                    accentClassName="text-teal-dark"
                  />
                  <StatCard label="Final balance" value={formatMoney(result.finalBalance)} />
                  <StatCard label="Total contributions" value={formatMoney(result.totalContributions)} />
                  <StatCard label="Estimated interest" value={formatMoney(result.totalInterest)} />
                </dl>

                {reachedDate ? (
                  <p className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-navy">
                    Estimated date reached:{" "}
                    <strong>
                      {MONTH_NAMES[reachedDate.month - 1]} {reachedDate.year}
                    </strong>
                  </p>
                ) : null}

                <p className="text-sm text-navy-soft">
                  Starting from {formatMoney(result.startingBalance)} and
                  saving {formatMoney(String(input.monthlyContribution))} each
                  month, this scenario is projected to reach your target of{" "}
                  {formatMoney(String(input.targetBalance))} after{" "}
                  {formatDuration(result.monthsToReach ?? 0) || "0 months"}. Of
                  the projected {formatMoney(result.finalBalance)} final
                  balance, {formatMoney(result.totalContributions)} is money
                  you contributed and {formatMoney(result.totalInterest)} is
                  estimated interest. Actual results may differ because
                  future rates can change.
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
                      <dt className="text-navy-soft">Monthly contribution</dt>
                      <dd className="font-medium text-navy">{formatMoney(String(input.monthlyContribution))}</dd>
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
                    captionPrefix="Monthly savings time schedule"
                    regionLabel="Monthly savings time schedule table, scrollable horizontally on narrow screens"
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
