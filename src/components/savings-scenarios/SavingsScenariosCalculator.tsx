"use client";

import { useId, useState } from "react";
import { calculateSavingsScenarios } from "@/lib/finance/savingsScenarios";
import { SAVINGS_SCENARIOS_LIMITS } from "@/lib/finance/limits";
import {
  validateNumberField,
  validatePositiveMonthsField,
  type FieldValidation,
} from "@/lib/finance/validation";
import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { ContributionTiming, SavingsScenariosInput } from "@/lib/finance/types";
import { useExampleOrigin } from "@/hooks/useExampleOrigin";
import { useTouchedFields } from "@/hooks/useTouchedFields";
import { NumberField } from "@/components/shared/NumberField";
import { RadioGroup } from "@/components/shared/RadioGroup";
import { StatCard } from "@/components/shared/StatCard";
import { ScenarioComparisonChart } from "@/components/shared/ScenarioComparisonChart";
import { ScenarioComparisonTable } from "@/components/shared/ScenarioComparisonTable";
import { ScenarioMonthlyScheduleTable } from "@/components/shared/ScenarioMonthlyScheduleTable";
import { PrintButton } from "@/components/shared/PrintButton";
import { CsvDownloadButton } from "@/components/shared/CsvDownloadButton";
import { toCsv } from "@/lib/csv";
import { ScenarioBranchFields } from "./ScenarioBranchFields";

const FIELD_KEYS = [
  "startingBalance",
  "duration",
  "inflationRate",
  "aRate",
  "aContribution",
  "aFee",
  "bRate",
  "bContribution",
  "bFee",
  "cRate",
  "cContribution",
  "cFee",
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  startingBalance: "Starting balance",
  duration: "Duration",
  inflationRate: "Inflation rate per year",
  aRate: "Annual interest rate",
  aContribution: "Monthly contribution",
  aFee: "Monthly account fee",
  bRate: "Annual interest rate",
  bContribution: "Monthly contribution",
  bFee: "Monthly account fee",
  cRate: "Annual interest rate",
  cContribution: "Monthly contribution",
  cFee: "Monthly account fee",
};

const DEFAULT_NAMES = ["Scenario A", "Scenario B", "Scenario C"] as const;

const EXAMPLE = {
  startingBalance: "1000",
  duration: "120",
  inflationRate: "3",
  a: { rate: "4", contribution: "100", fee: "0" },
  b: { rate: "6", contribution: "125", fee: "5" },
  c: { rate: "8", contribution: "150", fee: "10" },
};

function restoreZeroOnBlur(value: string, setValue: (v: string) => void) {
  if (value.trim() === "") setValue("0");
}

function useBranchState(defaultName: string) {
  const [name, setName] = useState(defaultName);
  const [rateStr, setRateStr] = useState("");
  const [contributionStr, setContributionStr] = useState("0");
  const [feeStr, setFeeStr] = useState("0");
  return { name, setName, rateStr, setRateStr, contributionStr, setContributionStr, feeStr, setFeeStr };
}

export function SavingsScenariosCalculator() {
  const idPrefix = useId();

  const [startingBalanceStr, setStartingBalanceStr] = useState("0");
  const [durationStr, setDurationStr] = useState("");
  const [timing, setTiming] = useState<ContributionTiming>("end");
  const [inflationStr, setInflationStr] = useState("0");

  const a = useBranchState(DEFAULT_NAMES[0]);
  const b = useBranchState(DEFAULT_NAMES[1]);
  const c = useBranchState(DEFAULT_NAMES[2]);
  const branches = [a, b, c];

  const { origin, exampleResidue, onFieldEdit, onUntrackedEdit, activateExample } =
    useExampleOrigin<FieldKey>(FIELD_KEYS);
  const { touched, markTouched } = useTouchedFields<FieldKey>();

  function tryExample() {
    setStartingBalanceStr(EXAMPLE.startingBalance);
    setDurationStr(EXAMPLE.duration);
    setInflationStr(EXAMPLE.inflationRate);
    a.setRateStr(EXAMPLE.a.rate);
    a.setContributionStr(EXAMPLE.a.contribution);
    a.setFeeStr(EXAMPLE.a.fee);
    b.setRateStr(EXAMPLE.b.rate);
    b.setContributionStr(EXAMPLE.b.contribution);
    b.setFeeStr(EXAMPLE.b.fee);
    c.setRateStr(EXAMPLE.c.rate);
    c.setContributionStr(EXAMPLE.c.contribution);
    c.setFeeStr(EXAMPLE.c.fee);
    activateExample();
  }

  const vStartingBalance = validateNumberField(
    startingBalanceStr,
    SAVINGS_SCENARIOS_LIMITS.startingBalance,
    FIELD_LABELS.startingBalance,
  );
  const vDuration = validatePositiveMonthsField(durationStr, FIELD_LABELS.duration, SAVINGS_SCENARIOS_LIMITS.months.max);
  const vInflation = validateNumberField(
    inflationStr,
    SAVINGS_SCENARIOS_LIMITS.inflationRate,
    FIELD_LABELS.inflationRate,
  );

  const vARate = validateNumberField(a.rateStr, SAVINGS_SCENARIOS_LIMITS.rate, FIELD_LABELS.aRate);
  const vAContribution = validateNumberField(a.contributionStr, SAVINGS_SCENARIOS_LIMITS.monthlyContribution, FIELD_LABELS.aContribution);
  const vAFee = validateNumberField(a.feeStr, SAVINGS_SCENARIOS_LIMITS.monthlyFee, FIELD_LABELS.aFee);

  const vBRate = validateNumberField(b.rateStr, SAVINGS_SCENARIOS_LIMITS.rate, FIELD_LABELS.bRate);
  const vBContribution = validateNumberField(b.contributionStr, SAVINGS_SCENARIOS_LIMITS.monthlyContribution, FIELD_LABELS.bContribution);
  const vBFee = validateNumberField(b.feeStr, SAVINGS_SCENARIOS_LIMITS.monthlyFee, FIELD_LABELS.bFee);

  const vCRate = validateNumberField(c.rateStr, SAVINGS_SCENARIOS_LIMITS.rate, FIELD_LABELS.cRate);
  const vCContribution = validateNumberField(c.contributionStr, SAVINGS_SCENARIOS_LIMITS.monthlyContribution, FIELD_LABELS.cContribution);
  const vCFee = validateNumberField(c.feeStr, SAVINGS_SCENARIOS_LIMITS.monthlyFee, FIELD_LABELS.cFee);

  const validations: Record<FieldKey, FieldValidation> = {
    startingBalance: vStartingBalance,
    duration: vDuration,
    inflationRate: vInflation,
    aRate: vARate,
    aContribution: vAContribution,
    aFee: vAFee,
    bRate: vBRate,
    bContribution: vBContribution,
    bFee: vBFee,
    cRate: vCRate,
    cContribution: vCContribution,
    cFee: vCFee,
  };

  const allValid = FIELD_KEYS.every((k) => validations[k].status === "valid");
  const attempted = origin !== "default";

  const errorMessage = (key: FieldKey): string | null => {
    const v = validations[key];
    if (v.status === "invalid") return v.message;
    if (v.status === "empty" && (touched.has(key) || attempted)) {
      return `Enter ${FIELD_LABELS[key].toLowerCase()}.`;
    }
    return null;
  };

  let input: SavingsScenariosInput | null = null;
  if (
    allValid &&
    vStartingBalance.status === "valid" &&
    vDuration.status === "valid" &&
    vInflation.status === "valid" &&
    vARate.status === "valid" &&
    vAContribution.status === "valid" &&
    vAFee.status === "valid" &&
    vBRate.status === "valid" &&
    vBContribution.status === "valid" &&
    vBFee.status === "valid" &&
    vCRate.status === "valid" &&
    vCContribution.status === "valid" &&
    vCFee.status === "valid"
  ) {
    input = {
      startingBalance: vStartingBalance.value,
      months: vDuration.value,
      timing,
      inflationRatePercent: vInflation.value,
      scenarios: [
        { ratePercent: vARate.value, monthlyContribution: vAContribution.value, monthlyFee: vAFee.value },
        { ratePercent: vBRate.value, monthlyContribution: vBContribution.value, monthlyFee: vBFee.value },
        { ratePercent: vCRate.value, monthlyContribution: vCContribution.value, monthlyFee: vCFee.value },
      ],
    };
  }

  const result = input ? calculateSavingsScenarios(input) : null;

  const showExampleBanner = origin === "example";
  const showResidueNotice = origin === "user" && exampleResidue.size > 0;

  const names = branches.map((br, i) => br.name.trim() || DEFAULT_NAMES[i]);

  function downloadScenariosCsv() {
    if (!result || !input) return "";
    const generatedAt = new Date().toLocaleString("en-US");
    const timingLabel = timing === "end" ? "End of each month" : "Beginning of each month";
    const rows: (string | number)[][] = [
      ["GOAT Calculator: Savings scenario calculator"],
      ["Generated", generatedAt],
      [],
      ["Starting balance", formatMoney(String(input.startingBalance))],
      ["Duration (months)", input.months],
      ["Contribution timing", timingLabel],
      ["Inflation rate per year (%)", input.inflationRatePercent],
      [],
      [
        "Scenario",
        "Annual interest rate (%)",
        "Monthly contribution",
        "Monthly account fee",
        "Final balance",
        "Estimated buying power in today's money",
        "Total contributions",
        "Total interest earned",
        "Total fees deducted",
      ],
    ];
    result.scenarios.forEach((scenario, i) => {
      rows.push([
        names[i],
        input.scenarios[i].ratePercent,
        formatMoney(String(input.scenarios[i].monthlyContribution)),
        formatMoney(String(input.scenarios[i].monthlyFee)),
        formatMoney(scenario.finalBalance),
        formatMoney(scenario.buyingPowerToday),
        formatMoney(scenario.totalContributions),
        formatMoney(scenario.totalInterest),
        formatMoney(scenario.totalFeesDeducted),
      ]);
    });
    rows.push(
      [],
      ["Scenario labels are for comparison only and are not predictions", "Yes"],
      [
        "Excludes taxes, changing rates, deposits that vary over time, investment losses, account debt, overdraft charges, and any fee other than the monthly fee entered",
        "Yes",
      ],
      [],
      [
        "Month",
        `${names[0]} balance`,
        `${names[0]} contribution`,
        `${names[0]} interest`,
        `${names[0]} fee`,
        `${names[1]} balance`,
        `${names[1]} contribution`,
        `${names[1]} interest`,
        `${names[1]} fee`,
        `${names[2]} balance`,
        `${names[2]} contribution`,
        `${names[2]} interest`,
        `${names[2]} fee`,
      ],
    );
    for (let m = 1; m <= input.months; m++) {
      const row: (string | number)[] = [m];
      for (const scenario of result.scenarios) {
        const scheduleRow = scenario.schedule[m - 1];
        row.push(
          formatMoney(scheduleRow?.endingBalance ?? scenario.finalBalance),
          formatMoney(scheduleRow?.contribution ?? "0"),
          formatMoney(scheduleRow?.interest ?? "0"),
          formatMoney(scheduleRow?.feeDeducted ?? "0"),
        );
      }
      rows.push(row);
    }
    return toCsv(rows);
  }

  const summarySentences = result && input
    ? result.scenarios.map((scenario, i) => {
        const branchInput = input.scenarios[i];
        return `With the assumptions entered for ${names[i]}, a starting balance of ${formatMoney(
          String(input.startingBalance),
        )} and monthly contribution of ${formatMoney(String(branchInput.monthlyContribution))} could result in ${formatMoney(
          scenario.finalBalance,
        )} after ${input.months} ${input.months === 1 ? "month" : "months"}, before considering taxes and other costs not modeled here.`;
      })
    : [];

  return (
    <div className="space-y-8">
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
          to load starting assumptions for three scenarios.
        </p>
      </div>

      <p className="max-w-2xl text-sm text-navy-soft">
        Choose your own assumptions below for up to three savings
        scenarios. Nothing here is a prediction, guarantee, or
        recommendation of what will actually happen to your money.
      </p>

      <fieldset className="space-y-4 rounded-md border border-border p-4">
        <legend className="px-1 text-base font-semibold text-navy">Shared plan</legend>

        <NumberField
          id={`${idPrefix}-starting-balance`}
          label={FIELD_LABELS.startingBalance}
          unitLabel="your currency"
          value={startingBalanceStr}
          onChange={(v) => {
            setStartingBalanceStr(v);
            onFieldEdit("startingBalance");
          }}
          onBlur={() => restoreZeroOnBlur(startingBalanceStr, setStartingBalanceStr)}
          errorMessage={errorMessage("startingBalance")}
          isExampleValue={exampleResidue.has("startingBalance")}
        />

        <NumberField
          id={`${idPrefix}-duration`}
          label={FIELD_LABELS.duration}
          unitLabel="whole months"
          value={durationStr}
          onChange={(v) => {
            setDurationStr(v);
            onFieldEdit("duration");
          }}
          onBlur={() => markTouched("duration")}
          placeholder="e.g. 120"
          required
          errorMessage={errorMessage("duration")}
          isExampleValue={exampleResidue.has("duration")}
        />

        <RadioGroup
          legend="When is each scenario's monthly contribution added?"
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

        <NumberField
          id={`${idPrefix}-inflation`}
          label={FIELD_LABELS.inflationRate}
          unitLabel="% per year"
          value={inflationStr}
          onChange={(v) => {
            setInflationStr(v);
            onFieldEdit("inflationRate");
          }}
          onBlur={() => restoreZeroOnBlur(inflationStr, setInflationStr)}
          errorMessage={errorMessage("inflationRate")}
          isExampleValue={exampleResidue.has("inflationRate")}
        />
        <p className="-mt-3 text-xs text-navy-soft">
          Inflation does not change any scenario&apos;s projected account
          balance. It is used only to estimate that balance&apos;s buying
          power in today&apos;s money. A value of 0 means no inflation
          adjustment.
        </p>
      </fieldset>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ScenarioBranchFields
          defaultName={DEFAULT_NAMES[0]}
          name={a.name}
          onNameChange={a.setName}
          rateStr={a.rateStr}
          onRateChange={(v) => {
            a.setRateStr(v);
            onFieldEdit("aRate");
          }}
          onRateBlur={() => markTouched("aRate")}
          rateErrorMessage={errorMessage("aRate")}
          rateIsExampleValue={exampleResidue.has("aRate")}
          contributionStr={a.contributionStr}
          onContributionChange={(v) => {
            a.setContributionStr(v);
            onFieldEdit("aContribution");
          }}
          onContributionBlur={() => restoreZeroOnBlur(a.contributionStr, a.setContributionStr)}
          contributionErrorMessage={errorMessage("aContribution")}
          contributionIsExampleValue={exampleResidue.has("aContribution")}
          feeStr={a.feeStr}
          onFeeChange={(v) => {
            a.setFeeStr(v);
            onFieldEdit("aFee");
          }}
          onFeeBlur={() => restoreZeroOnBlur(a.feeStr, a.setFeeStr)}
          feeErrorMessage={errorMessage("aFee")}
          feeIsExampleValue={exampleResidue.has("aFee")}
        />

        <ScenarioBranchFields
          defaultName={DEFAULT_NAMES[1]}
          name={b.name}
          onNameChange={b.setName}
          rateStr={b.rateStr}
          onRateChange={(v) => {
            b.setRateStr(v);
            onFieldEdit("bRate");
          }}
          onRateBlur={() => markTouched("bRate")}
          rateErrorMessage={errorMessage("bRate")}
          rateIsExampleValue={exampleResidue.has("bRate")}
          contributionStr={b.contributionStr}
          onContributionChange={(v) => {
            b.setContributionStr(v);
            onFieldEdit("bContribution");
          }}
          onContributionBlur={() => restoreZeroOnBlur(b.contributionStr, b.setContributionStr)}
          contributionErrorMessage={errorMessage("bContribution")}
          contributionIsExampleValue={exampleResidue.has("bContribution")}
          feeStr={b.feeStr}
          onFeeChange={(v) => {
            b.setFeeStr(v);
            onFieldEdit("bFee");
          }}
          onFeeBlur={() => restoreZeroOnBlur(b.feeStr, b.setFeeStr)}
          feeErrorMessage={errorMessage("bFee")}
          feeIsExampleValue={exampleResidue.has("bFee")}
        />

        <ScenarioBranchFields
          defaultName={DEFAULT_NAMES[2]}
          name={c.name}
          onNameChange={c.setName}
          rateStr={c.rateStr}
          onRateChange={(v) => {
            c.setRateStr(v);
            onFieldEdit("cRate");
          }}
          onRateBlur={() => markTouched("cRate")}
          rateErrorMessage={errorMessage("cRate")}
          rateIsExampleValue={exampleResidue.has("cRate")}
          contributionStr={c.contributionStr}
          onContributionChange={(v) => {
            c.setContributionStr(v);
            onFieldEdit("cContribution");
          }}
          onContributionBlur={() => restoreZeroOnBlur(c.contributionStr, c.setContributionStr)}
          contributionErrorMessage={errorMessage("cContribution")}
          contributionIsExampleValue={exampleResidue.has("cContribution")}
          feeStr={c.feeStr}
          onFeeChange={(v) => {
            c.setFeeStr(v);
            onFieldEdit("cFee");
          }}
          onFeeBlur={() => restoreZeroOnBlur(c.feeStr, c.setFeeStr)}
          feeErrorMessage={errorMessage("cFee")}
          feeIsExampleValue={exampleResidue.has("cFee")}
        />
      </div>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Scenario comparison
          </h2>
          {result ? (
            <div className="flex gap-2">
              <PrintButton />
              <CsvDownloadButton filename="goat-calculator-savings-scenarios.csv" getContent={downloadScenariosCsv} />
            </div>
          ) : null}
        </div>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter a duration and an annual interest rate for each of the
            three scenarios to see a comparison. Contributions and fees
            default to $0, which means none.
          </p>
        ) : (
          <>
            <p className="text-xs text-navy-soft">
              Scenario names are for comparison only and are not
              predictions of what will happen.
            </p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {result.scenarios.map((scenario, i) => (
                <div
                  key={names[i]}
                  role="group"
                  aria-label={`${names[i]} results`}
                  className="rounded-md border border-border bg-surface p-4"
                >
                  <h3 className="mb-3 break-words text-sm font-semibold text-navy">{names[i]}</h3>
                  <dl className="grid grid-cols-1 gap-3">
                    <StatCard label="Final balance" value={formatMoney(scenario.finalBalance)} accentClassName="text-teal-dark" />
                    <StatCard label="Estimated buying power today" value={formatMoney(scenario.buyingPowerToday)} />
                    <StatCard label="Total contributions" value={formatMoney(scenario.totalContributions)} />
                    <StatCard label="Total interest earned" value={formatMoney(scenario.totalInterest)} />
                    <StatCard label="Total fees deducted" value={formatMoney(scenario.totalFeesDeducted)} />
                  </dl>
                </div>
              ))}
            </div>

            <ul className="space-y-2 text-sm text-navy-soft">
              {summarySentences.map((sentence, i) => (
                <li key={names[i]}>{sentence}</li>
              ))}
            </ul>

            <ScenarioComparisonChart
              series={result.scenarios.map((scenario, i) => ({
                label: names[i],
                schedule: scenario.schedule,
                startingBalance: scenario.startingBalance,
              }))}
            />

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">Scenario comparison table</h3>
              <ScenarioComparisonTable
                scenarios={result.scenarios.map((scenario, i) => ({
                  label: names[i],
                  finalBalance: scenario.finalBalance,
                  buyingPowerToday: scenario.buyingPowerToday,
                  totalContributions: scenario.totalContributions,
                  totalInterest: scenario.totalInterest,
                  totalFeesDeducted: scenario.totalFeesDeducted,
                }))}
              />
            </div>

            <details className="rounded-md border border-border bg-surface p-4">
              <summary className="cursor-pointer select-none font-medium text-navy">
                Assumptions used {showExampleBanner ? "(illustrative example)" : ""}
              </summary>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Starting balance</dt>
                  <dd className="font-medium text-navy">{formatMoney(String(input.startingBalance))}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Duration</dt>
                  <dd className="font-medium text-navy">{formatDuration(input.months) || "0 months"}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Contribution timing</dt>
                  <dd className="font-medium text-navy">
                    {timing === "end" ? "End of each month" : "Beginning of each month"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Inflation rate per year</dt>
                  <dd className="font-medium text-navy">{formatPercent(input.inflationRatePercent)}</dd>
                </div>
              </dl>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {input.scenarios.map((branchInput, i) => (
                  <dl key={names[i]} className="space-y-1 text-sm">
                    <div className="font-semibold text-navy">{names[i]}</div>
                    <div className="flex justify-between">
                      <dt className="text-navy-soft">Annual interest rate</dt>
                      <dd className="font-medium text-navy">{formatPercent(branchInput.ratePercent)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy-soft">Monthly contribution</dt>
                      <dd className="font-medium text-navy">{formatMoney(String(branchInput.monthlyContribution))}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-navy-soft">Monthly account fee</dt>
                      <dd className="font-medium text-navy">{formatMoney(String(branchInput.monthlyFee))}</dd>
                    </div>
                  </dl>
                ))}
              </div>
              <p className="mt-3 border-t border-border pt-3 text-xs text-navy-soft">
                This comparison does not include taxes, changing rates,
                deposits that vary over time, investment losses, account
                debt, overdraft charges, withdrawal limits, or any fee
                other than the monthly fee entered above. See the{" "}
                <a href="/methodology" className="text-teal-dark underline hover:text-teal">
                  methodology page
                </a>{" "}
                for what is and isn&apos;t modeled.
              </p>
            </details>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">Monthly schedule</h3>
              <ScenarioMonthlyScheduleTable
                series={result.scenarios.map((scenario, i) => ({ label: names[i], schedule: scenario.schedule }))}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
