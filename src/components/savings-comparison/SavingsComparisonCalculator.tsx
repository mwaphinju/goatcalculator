"use client";

import { useId, useState } from "react";
import { compareSavingsScenarios } from "@/lib/finance/savingsComparison";
import { SAVINGS_COMPARISON_LIMITS } from "@/lib/finance/limits";
import { validateMonthsField, validateNumberField, type FieldValidation } from "@/lib/finance/validation";
import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { ContributionTiming, RateMode, ScenarioInput } from "@/lib/finance/types";
import { useExampleOrigin } from "@/hooks/useExampleOrigin";
import { useTouchedFields } from "@/hooks/useTouchedFields";
import { StatCard } from "@/components/shared/StatCard";
import { PrintButton } from "@/components/shared/PrintButton";
import { CsvDownloadButton } from "@/components/shared/CsvDownloadButton";
import { toCsv } from "@/lib/csv";
import { ScenarioFields, type ScenarioFieldKey } from "./ScenarioFields";
import { ComparisonChart } from "@/components/shared/ComparisonChart";
import { ComparisonTable } from "@/components/shared/ComparisonTable";

const FIELD_KEYS: readonly ScenarioFieldKey[] = ["startingBalance", "contribution", "rate", "duration"];

const EXAMPLE = {
  baseline: { startingBalance: "1000", contribution: "100", rateMode: "nominal" as RateMode, rate: "6", months: "120", timing: "end" as ContributionTiming },
  alternative: { startingBalance: "1000", contribution: "150", rateMode: "nominal" as RateMode, rate: "6", months: "120", timing: "end" as ContributionTiming },
};

function restoreZeroOnBlur(value: string, setValue: (v: string) => void) {
  if (value.trim() === "") setValue("0");
}

function useScenarioFormState() {
  const [startingBalanceStr, setStartingBalanceStr] = useState("0");
  const [contributionStr, setContributionStr] = useState("0");
  const [rateMode, setRateMode] = useState<RateMode>("nominal");
  const [rateStr, setRateStr] = useState("");
  const [monthsStr, setMonthsStr] = useState("");
  const [timing, setTiming] = useState<ContributionTiming>("end");
  return {
    startingBalanceStr, setStartingBalanceStr,
    contributionStr, setContributionStr,
    rateMode, setRateMode,
    rateStr, setRateStr,
    monthsStr, setMonthsStr,
    timing, setTiming,
  };
}

type ScenarioFormState = ReturnType<typeof useScenarioFormState>;

function validateScenario(state: ScenarioFormState): Record<ScenarioFieldKey, FieldValidation> {
  return {
    startingBalance: validateNumberField(state.startingBalanceStr, SAVINGS_COMPARISON_LIMITS.startingBalance, "Starting balance"),
    contribution: validateNumberField(state.contributionStr, SAVINGS_COMPARISON_LIMITS.monthlyContribution, "Monthly contribution"),
    rate: validateNumberField(state.rateStr, SAVINGS_COMPARISON_LIMITS.rate, "Rate"),
    duration: validateMonthsField(state.monthsStr, "Duration", SAVINGS_COMPARISON_LIMITS.months.max),
  };
}

export function SavingsComparisonCalculator() {
  const idPrefix = useId();

  const baseline = useScenarioFormState();
  const alternative = useScenarioFormState();

  const baselineOrigin = useExampleOrigin<ScenarioFieldKey>(FIELD_KEYS);
  const alternativeOrigin = useExampleOrigin<ScenarioFieldKey>(FIELD_KEYS);
  const baselineTouched = useTouchedFields<"rate" | "duration">();
  const alternativeTouched = useTouchedFields<"rate" | "duration">();

  function tryExample() {
    baseline.setStartingBalanceStr(EXAMPLE.baseline.startingBalance);
    baseline.setContributionStr(EXAMPLE.baseline.contribution);
    baseline.setRateMode(EXAMPLE.baseline.rateMode);
    baseline.setRateStr(EXAMPLE.baseline.rate);
    baseline.setMonthsStr(EXAMPLE.baseline.months);
    baseline.setTiming(EXAMPLE.baseline.timing);
    baselineOrigin.activateExample();

    alternative.setStartingBalanceStr(EXAMPLE.alternative.startingBalance);
    alternative.setContributionStr(EXAMPLE.alternative.contribution);
    alternative.setRateMode(EXAMPLE.alternative.rateMode);
    alternative.setRateStr(EXAMPLE.alternative.rate);
    alternative.setMonthsStr(EXAMPLE.alternative.months);
    alternative.setTiming(EXAMPLE.alternative.timing);
    alternativeOrigin.activateExample();
  }

  const baselineValidations = validateScenario(baseline);
  const alternativeValidations = validateScenario(alternative);

  const baselineValid = FIELD_KEYS.every((k) => baselineValidations[k].status === "valid");
  const alternativeValid = FIELD_KEYS.every((k) => alternativeValidations[k].status === "valid");
  const allValid = baselineValid && alternativeValid;

  function makeErrorMessage(
    validations: Record<ScenarioFieldKey, FieldValidation>,
    touched: Set<"rate" | "duration">,
    attempted: boolean,
  ) {
    return (key: ScenarioFieldKey): string | null => {
      const v = validations[key];
      if (v.status === "invalid") return v.message;
      if (key === "rate") {
        return (touched.has("rate") || attempted) && v.status !== "valid" ? "Enter an annual rate or APY." : null;
      }
      if (key === "duration") {
        return (touched.has("duration") || attempted) && v.status !== "valid" ? "Enter a duration." : null;
      }
      return null;
    };
  }

  const baselineAttempted = baselineOrigin.origin !== "default";
  const alternativeAttempted = alternativeOrigin.origin !== "default";

  const baselineErrorMessage = makeErrorMessage(baselineValidations, baselineTouched.touched, baselineAttempted);
  const alternativeErrorMessage = makeErrorMessage(alternativeValidations, alternativeTouched.touched, alternativeAttempted);

  let baselineInput: ScenarioInput | null = null;
  if (baselineValid) {
    baselineInput = {
      startingBalance: (baselineValidations.startingBalance as { status: "valid"; value: number }).value,
      monthlyContribution: (baselineValidations.contribution as { status: "valid"; value: number }).value,
      rateMode: baseline.rateMode,
      ratePercent: (baselineValidations.rate as { status: "valid"; value: number }).value,
      months: (baselineValidations.duration as { status: "valid"; value: number }).value,
      timing: baseline.timing,
    };
  }

  let alternativeInput: ScenarioInput | null = null;
  if (alternativeValid) {
    alternativeInput = {
      startingBalance: (alternativeValidations.startingBalance as { status: "valid"; value: number }).value,
      monthlyContribution: (alternativeValidations.contribution as { status: "valid"; value: number }).value,
      rateMode: alternative.rateMode,
      ratePercent: (alternativeValidations.rate as { status: "valid"; value: number }).value,
      months: (alternativeValidations.duration as { status: "valid"; value: number }).value,
      timing: alternative.timing,
    };
  }

  const result = allValid && baselineInput && alternativeInput ? compareSavingsScenarios(baselineInput, alternativeInput) : null;

  const showExampleBanner = baselineOrigin.origin === "example" && alternativeOrigin.origin === "example";

  function downloadComparisonCsv() {
    if (!result || !baselineInput || !alternativeInput) return "";
    const generatedAt = new Date().toLocaleString("en-US");
    const rows: (string | number)[][] = [
      ["GOAT Calculator: Savings comparison calculator"],
      ["Generated", generatedAt],
      [],
      ["Scenario", "Starting balance", "Monthly contribution", "Rate type", "Rate (%)", "Duration (months)", "Timing", "Final balance", "Total contributions", "Estimated interest"],
      [
        "Baseline",
        formatMoney(result.baseline.startingBalance),
        formatMoney(String(baselineInput.monthlyContribution)),
        baseline.rateMode === "apy" ? "APY" : "Nominal",
        baselineInput.ratePercent,
        baselineInput.months,
        baseline.timing === "end" ? "End of each month" : "Beginning of each month",
        formatMoney(result.baseline.finalBalance),
        formatMoney(result.baseline.totalContributions),
        formatMoney(result.baseline.totalInterest),
      ],
      [
        "Alternative",
        formatMoney(result.alternative.startingBalance),
        formatMoney(String(alternativeInput.monthlyContribution)),
        alternative.rateMode === "apy" ? "APY" : "Nominal",
        alternativeInput.ratePercent,
        alternativeInput.months,
        alternative.timing === "end" ? "End of each month" : "Beginning of each month",
        formatMoney(result.alternative.finalBalance),
        formatMoney(result.alternative.totalContributions),
        formatMoney(result.alternative.totalInterest),
      ],
      [],
      ["Final balance difference (alternative minus baseline)", formatMoney(result.finalBalanceDifference)],
      ["Contributions difference (alternative minus baseline)", formatMoney(result.totalContributionsDifference)],
      ["Interest difference (alternative minus baseline)", formatMoney(result.totalInterestDifference)],
      ["Excludes taxes, fees, inflation and variable rates", "Yes"],
      [],
      ["Month", "Baseline balance", "Alternative balance", "Difference"],
    ];
    const maxMonth = Math.max(result.baseline.schedule.length, result.alternative.schedule.length);
    for (let m = 1; m <= maxMonth; m++) {
      const b = result.baseline.schedule[m - 1]?.endingBalance ?? result.baseline.finalBalance;
      const a = result.alternative.schedule[m - 1]?.endingBalance ?? result.alternative.finalBalance;
      rows.push([m, formatMoney(b), formatMoney(a), formatMoney(String(Number(a) - Number(b)))]);
    }
    return toCsv(rows);
  }

  const summarySentence = (() => {
    if (!result) return "";
    const diff = Number(result.finalBalanceDifference);
    const months = Math.max(result.baseline.schedule.length, result.alternative.schedule.length);
    if (diff === 0) {
      return `Your alternative scenario reaches the same estimated balance as your baseline scenario after ${formatDuration(months) || "0 months"}.`;
    }
    const direction = diff > 0 ? "higher" : "lower";
    return `Your alternative scenario reaches an estimated balance that is ${formatMoney(String(Math.abs(diff)))} ${direction} after ${formatDuration(months) || "0 months"}.`;
  })();

  return (
    <div className="space-y-8">
      {showExampleBanner ? (
        <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
          Illustrative example. Edit these assumptions.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-navy-soft">
          Not sure what to enter?{" "}
          <button
            type="button"
            onClick={tryExample}
            className="rounded-sm font-medium text-teal-dark underline hover:text-teal"
          >
            Try an example
          </button>{" "}
          to load a baseline and an alternative scenario.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ScenarioFields
          idPrefix={`${idPrefix}-baseline`}
          legend="Baseline scenario"
          startingBalanceStr={baseline.startingBalanceStr}
          onStartingBalanceChange={(v) => {
            baseline.setStartingBalanceStr(v);
            baselineOrigin.onFieldEdit("startingBalance");
          }}
          onStartingBalanceBlur={() => restoreZeroOnBlur(baseline.startingBalanceStr, baseline.setStartingBalanceStr)}
          contributionStr={baseline.contributionStr}
          onContributionChange={(v) => {
            baseline.setContributionStr(v);
            baselineOrigin.onFieldEdit("contribution");
          }}
          onContributionBlur={() => restoreZeroOnBlur(baseline.contributionStr, baseline.setContributionStr)}
          rateMode={baseline.rateMode}
          onRateModeChange={(mode) => {
            baseline.setRateMode(mode);
            baselineOrigin.onUntrackedEdit();
          }}
          rateStr={baseline.rateStr}
          onRateChange={(v) => {
            baseline.setRateStr(v);
            baselineOrigin.onFieldEdit("rate");
          }}
          onRateBlur={() => baselineTouched.markTouched("rate")}
          monthsStr={baseline.monthsStr}
          onMonthsChange={(v) => {
            baseline.setMonthsStr(v);
            baselineOrigin.onFieldEdit("duration");
          }}
          onMonthsBlur={() => baselineTouched.markTouched("duration")}
          timing={baseline.timing}
          onTimingChange={(t) => {
            baseline.setTiming(t);
            baselineOrigin.onUntrackedEdit();
          }}
          validations={baselineValidations}
          errorMessage={baselineErrorMessage}
          exampleResidue={baselineOrigin.exampleResidue}
          onTryExample={tryExample}
        />

        <ScenarioFields
          idPrefix={`${idPrefix}-alternative`}
          legend="Alternative scenario"
          startingBalanceStr={alternative.startingBalanceStr}
          onStartingBalanceChange={(v) => {
            alternative.setStartingBalanceStr(v);
            alternativeOrigin.onFieldEdit("startingBalance");
          }}
          onStartingBalanceBlur={() => restoreZeroOnBlur(alternative.startingBalanceStr, alternative.setStartingBalanceStr)}
          contributionStr={alternative.contributionStr}
          onContributionChange={(v) => {
            alternative.setContributionStr(v);
            alternativeOrigin.onFieldEdit("contribution");
          }}
          onContributionBlur={() => restoreZeroOnBlur(alternative.contributionStr, alternative.setContributionStr)}
          rateMode={alternative.rateMode}
          onRateModeChange={(mode) => {
            alternative.setRateMode(mode);
            alternativeOrigin.onUntrackedEdit();
          }}
          rateStr={alternative.rateStr}
          onRateChange={(v) => {
            alternative.setRateStr(v);
            alternativeOrigin.onFieldEdit("rate");
          }}
          onRateBlur={() => alternativeTouched.markTouched("rate")}
          monthsStr={alternative.monthsStr}
          onMonthsChange={(v) => {
            alternative.setMonthsStr(v);
            alternativeOrigin.onFieldEdit("duration");
          }}
          onMonthsBlur={() => alternativeTouched.markTouched("duration")}
          timing={alternative.timing}
          onTimingChange={(t) => {
            alternative.setTiming(t);
            alternativeOrigin.onUntrackedEdit();
          }}
          validations={alternativeValidations}
          errorMessage={alternativeErrorMessage}
          exampleResidue={alternativeOrigin.exampleResidue}
          onTryExample={tryExample}
        />
      </div>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Comparison
          </h2>
          {result ? (
            <div className="flex gap-2">
              <PrintButton />
              <CsvDownloadButton filename="goat-calculator-savings-comparison.csv" getContent={downloadComparisonCsv} />
            </div>
          ) : null}
        </div>

        {!result || !baselineInput || !alternativeInput ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter a duration and an annual rate or APY for both scenarios to
            see a comparison. A zero amount means none.
          </p>
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Final balance difference"
                value={formatMoney(result.finalBalanceDifference)}
                accentClassName="text-teal-dark"
              />
              <StatCard label="Contributions difference" value={formatMoney(result.totalContributionsDifference)} />
              <StatCard label="Estimated interest difference" value={formatMoney(result.totalInterestDifference)} />
            </dl>

            <p className="text-sm text-navy-soft">
              {summarySentence} Whether that difference is worthwhile
              depends on your own situation. This calculator does not say
              one scenario is better, only what the entered assumptions
              project.
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-surface p-4">
                <h3 className="mb-2 text-sm font-semibold text-navy">Baseline</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Final balance</dt>
                    <dd className="font-medium text-navy">{formatMoney(result.baseline.finalBalance)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Total contributions</dt>
                    <dd className="font-medium text-navy">{formatMoney(result.baseline.totalContributions)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Estimated interest</dt>
                    <dd className="font-medium text-navy">{formatMoney(result.baseline.totalInterest)}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-md border border-border bg-surface p-4">
                <h3 className="mb-2 text-sm font-semibold text-navy">Alternative</h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Final balance</dt>
                    <dd className="font-medium text-navy">{formatMoney(result.alternative.finalBalance)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Total contributions</dt>
                    <dd className="font-medium text-navy">{formatMoney(result.alternative.totalContributions)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Estimated interest</dt>
                    <dd className="font-medium text-navy">{formatMoney(result.alternative.totalInterest)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <ComparisonChart
              baselineSchedule={result.baseline.schedule}
              baselineStartingBalance={result.baseline.startingBalance}
              alternativeSchedule={result.alternative.schedule}
              alternativeStartingBalance={result.alternative.startingBalance}
            />

            <details className="rounded-md border border-border bg-surface p-4">
              <summary className="cursor-pointer select-none font-medium text-navy">
                Assumptions used {showExampleBanner ? "(illustrative example)" : ""}
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Baseline starting balance</dt>
                    <dd className="font-medium text-navy">{formatMoney(String(baselineInput.startingBalance))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Baseline monthly contribution</dt>
                    <dd className="font-medium text-navy">{formatMoney(String(baselineInput.monthlyContribution))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Baseline rate type</dt>
                    <dd className="font-medium text-navy">{baseline.rateMode === "apy" ? "APY" : "Nominal"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Baseline rate</dt>
                    <dd className="font-medium text-navy">{formatPercent(baselineInput.ratePercent)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Baseline duration</dt>
                    <dd className="font-medium text-navy">{baselineInput.months} months</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Baseline timing</dt>
                    <dd className="font-medium text-navy">
                      {baseline.timing === "end" ? "End of each month" : "Beginning of each month"}
                    </dd>
                  </div>
                </dl>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Alternative starting balance</dt>
                    <dd className="font-medium text-navy">{formatMoney(String(alternativeInput.startingBalance))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Alternative monthly contribution</dt>
                    <dd className="font-medium text-navy">{formatMoney(String(alternativeInput.monthlyContribution))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Alternative rate type</dt>
                    <dd className="font-medium text-navy">{alternative.rateMode === "apy" ? "APY" : "Nominal"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Alternative rate</dt>
                    <dd className="font-medium text-navy">{formatPercent(alternativeInput.ratePercent)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Alternative duration</dt>
                    <dd className="font-medium text-navy">{alternativeInput.months} months</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-navy-soft">Alternative timing</dt>
                    <dd className="font-medium text-navy">
                      {alternative.timing === "end" ? "End of each month" : "Beginning of each month"}
                    </dd>
                  </div>
                </dl>
              </div>
              <p className="mt-3 border-t border-border pt-3 text-xs text-navy-soft">
                This comparison does not include taxes, account fees,
                inflation, or the possibility that rates change. See the{" "}
                <a href="/methodology" className="text-teal-dark underline hover:text-teal">
                  methodology page
                </a>{" "}
                for what is and isn&apos;t modeled.
              </p>
            </details>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">Monthly comparison table</h3>
              <ComparisonTable
                baselineSchedule={result.baseline.schedule}
                alternativeSchedule={result.alternative.schedule}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
