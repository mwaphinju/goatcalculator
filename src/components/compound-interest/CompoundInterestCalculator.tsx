"use client";

import { useId, useState } from "react";
import { calculateCompoundInterest } from "@/lib/finance/compoundInterest";
import { COMPOUND_INTEREST_LIMITS, MAX_YEARS } from "@/lib/finance/limits";
import { validateMonthsField, validateNumberField, type FieldValidation } from "@/lib/finance/validation";
import { formatDuration, formatMoney } from "@/lib/finance/format";
import type { CompoundInterestInput, ContributionTiming } from "@/lib/finance/types";
import { useExampleOrigin } from "@/hooks/useExampleOrigin";
import { useTouchedFields } from "@/hooks/useTouchedFields";
import { NumberField } from "@/components/shared/NumberField";
import { FieldHelp } from "@/components/shared/FieldHelp";
import { StatCard } from "@/components/shared/StatCard";
import { GrowthChart } from "@/components/shared/GrowthChart";
import { RadioGroup } from "@/components/shared/RadioGroup";
import { MonthlyScheduleTable } from "@/components/shared/MonthlyScheduleTable";
import { PrintButton } from "@/components/shared/PrintButton";
import { AssumptionsSummary } from "./AssumptionsSummary";

const FIELD_KEYS = ["initialBalance", "rate", "duration", "contribution"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  initialBalance: "Initial balance",
  rate: "Nominal annual interest rate",
  duration: "Duration",
  contribution: "Monthly contribution",
};

type DurationMode = "months" | "years-months";

const EXAMPLE = {
  initialBalance: "1000",
  rate: "6",
  months: 120,
  contribution: "100",
  timing: "end" as ContributionTiming,
};

function validateYearsMonthsDuration(yearsStr: string, monthsPartStr: string): FieldValidation {
  const yearsEmpty = yearsStr.trim() === "";
  const monthsEmpty = monthsPartStr.trim() === "";
  if (yearsEmpty && monthsEmpty) return { status: "empty" };
  if (yearsEmpty || monthsEmpty) {
    return {
      status: "invalid",
      message: "Enter both years and months (use 0 for either one if not needed).",
    };
  }
  const years = Number(yearsStr);
  const monthsPart = Number(monthsPartStr);
  if (!Number.isInteger(years) || years < 0 || years > MAX_YEARS) {
    return { status: "invalid", message: `Years must be a whole number from 0 to ${MAX_YEARS}.` };
  }
  if (!Number.isInteger(monthsPart) || monthsPart < 0 || monthsPart > 11) {
    return { status: "invalid", message: "Months must be a whole number from 0 to 11." };
  }
  const total = years * 12 + monthsPart;
  if (total > COMPOUND_INTEREST_LIMITS.months.max) {
    return {
      status: "invalid",
      message: `Duration must be ${COMPOUND_INTEREST_LIMITS.months.max} months or fewer.`,
    };
  }
  return { status: "valid", value: total };
}

/** Restores a visible zero default on blur if a visitor clears the field, rather than ever silently treating a blank field as zero. */
function restoreZeroOnBlur(value: string, setValue: (v: string) => void) {
  if (value.trim() === "") setValue("0");
}

export function CompoundInterestCalculator() {
  const idPrefix = useId();

  // Initial balance, monthly contribution and duration are all "defaulted
  // zero" fields: they start visibly at 0/0 months, which is immediately a
  // valid, calculable answer. The annual rate is the one required field:
  // it starts empty and blocks calculation until the visitor enters one.
  const [initialBalanceStr, setInitialBalanceStr] = useState("0");
  const [rateStr, setRateStr] = useState("");
  const [contributionStr, setContributionStr] = useState("0");
  const [timing, setTiming] = useState<ContributionTiming>("end");

  const [durationMode, setDurationMode] = useState<DurationMode>("months");
  const [monthsStr, setMonthsStr] = useState("0");
  const [yearsStr, setYearsStr] = useState("0");
  const [monthsPartStr, setMonthsPartStr] = useState("0");

  const { origin, exampleResidue, onFieldEdit, onUntrackedEdit, activateExample } =
    useExampleOrigin<FieldKey>(FIELD_KEYS);
  const { touched, markTouched } = useTouchedFields<"rate">();

  function tryExample() {
    setInitialBalanceStr(EXAMPLE.initialBalance);
    setRateStr(EXAMPLE.rate);
    setDurationMode("months");
    setMonthsStr(String(EXAMPLE.months));
    setYearsStr("0");
    setMonthsPartStr("0");
    setContributionStr(EXAMPLE.contribution);
    setTiming(EXAMPLE.timing);
    activateExample();
  }

  const vInitialBalance = validateNumberField(
    initialBalanceStr,
    COMPOUND_INTEREST_LIMITS.initialBalance,
    FIELD_LABELS.initialBalance,
  );
  const vRate = validateNumberField(rateStr, COMPOUND_INTEREST_LIMITS.annualRatePercent, FIELD_LABELS.rate);
  const vContribution = validateNumberField(
    contributionStr,
    COMPOUND_INTEREST_LIMITS.monthlyContribution,
    FIELD_LABELS.contribution,
  );
  const vDuration: FieldValidation =
    durationMode === "months"
      ? validateMonthsField(monthsStr, FIELD_LABELS.duration)
      : validateYearsMonthsDuration(yearsStr, monthsPartStr);

  const validations: Record<FieldKey, FieldValidation> = {
    initialBalance: vInitialBalance,
    rate: vRate,
    duration: vDuration,
    contribution: vContribution,
  };

  const allValid = FIELD_KEYS.every((k) => validations[k].status === "valid");

  // "Attempted calculation": the visitor has done something (edited any
  // field, or loaded the example) beyond the page's untouched starting
  // state. Combined with the rate field's own touched state, this is what
  // gates the rate's required message so it never appears on first paint.
  const attempted = origin !== "default";
  const showRateError = (touched.has("rate") || attempted) && vRate.status !== "valid";

  let input: CompoundInterestInput | null = null;
  if (
    allValid &&
    vInitialBalance.status === "valid" &&
    vRate.status === "valid" &&
    vDuration.status === "valid" &&
    vContribution.status === "valid"
  ) {
    input = {
      initialBalance: vInitialBalance.value,
      annualRatePercent: vRate.value,
      months: vDuration.value,
      monthlyContribution: vContribution.value,
      timing,
    };
  }

  const result = input ? calculateCompoundInterest(input) : null;

  const showExampleBanner = origin === "example";
  const showResidueNotice = origin === "user" && exampleResidue.size > 0;

  const errorMessage = (key: FieldKey) => {
    if (key === "rate") return showRateError ? "Enter an annual rate." : null;
    const v = validations[key];
    return v.status === "invalid" ? v.message : null;
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
      <section aria-labelledby={`${idPrefix}-inputs-heading`} className="space-y-5">
        <h2 id={`${idPrefix}-inputs-heading`} className="text-lg font-semibold text-navy">
          Your scenario
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
          id={`${idPrefix}-initial-balance`}
          label={FIELD_LABELS.initialBalance}
          unitLabel="your currency, e.g. $"
          value={initialBalanceStr}
          onChange={(v) => {
            setInitialBalanceStr(v);
            onFieldEdit("initialBalance");
          }}
          onBlur={() => restoreZeroOnBlur(initialBalanceStr, setInitialBalanceStr)}
          errorMessage={errorMessage("initialBalance")}
          isExampleValue={exampleResidue.has("initialBalance")}
        />

        <NumberField
          id={`${idPrefix}-rate`}
          label={FIELD_LABELS.rate}
          unitLabel="% per year, nominal"
          value={rateStr}
          onChange={(v) => {
            setRateStr(v);
            onFieldEdit("rate");
          }}
          onBlur={() => markTouched("rate")}
          placeholder="e.g. 4.5"
          required
          errorMessage={errorMessage("rate")}
          isExampleValue={exampleResidue.has("rate")}
          helper={
            <FieldHelp
              label={FIELD_LABELS.rate}
              explanation="This is the nominal annual interest rate your balance is assumed to earn, before monthly compounding is applied. It is not an APY. Different savings accounts, CDs and investments pay very different rates, and rates change over time. There is no single correct number to enter."
              onTryExample={tryExample}
            />
          }
        />

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-navy">Duration</legend>
          <div className="mb-2 flex gap-4 text-sm text-navy-soft">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`${idPrefix}-duration-mode`}
                checked={durationMode === "months"}
                onChange={() => setDurationMode("months")}
              />
              Months
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`${idPrefix}-duration-mode`}
                checked={durationMode === "years-months"}
                onChange={() => setDurationMode("years-months")}
              />
              Years + months
            </label>
          </div>

          {durationMode === "months" ? (
            <NumberField
              id={`${idPrefix}-months`}
              label="Duration"
              unitLabel="whole months"
              value={monthsStr}
              onChange={(v) => {
                setMonthsStr(v);
                onFieldEdit("duration");
              }}
              onBlur={() => restoreZeroOnBlur(monthsStr, setMonthsStr)}
              errorMessage={errorMessage("duration")}
              isExampleValue={exampleResidue.has("duration")}
            />
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <NumberField
                  id={`${idPrefix}-years`}
                  label="Years"
                  value={yearsStr}
                  onChange={(v) => {
                    setYearsStr(v);
                    onFieldEdit("duration");
                  }}
                  onBlur={() => restoreZeroOnBlur(yearsStr, setYearsStr)}
                />
              </div>
              <div className="flex-1">
                <NumberField
                  id={`${idPrefix}-months-part`}
                  label="Months"
                  value={monthsPartStr}
                  onChange={(v) => {
                    setMonthsPartStr(v);
                    onFieldEdit("duration");
                  }}
                  onBlur={() => restoreZeroOnBlur(monthsPartStr, setMonthsPartStr)}
                />
              </div>
              {errorMessage("duration") ? (
                <p role="alert" className="col-span-2 text-xs text-red">
                  {errorMessage("duration")}
                </p>
              ) : null}
              {exampleResidue.has("duration") ? (
                <p className="col-span-2 text-xs text-amber">Example value. Not yet edited.</p>
              ) : null}
            </div>
          )}
        </fieldset>

        <NumberField
          id={`${idPrefix}-contribution`}
          label={FIELD_LABELS.contribution}
          unitLabel="your currency per month"
          value={contributionStr}
          onChange={(v) => {
            setContributionStr(v);
            onFieldEdit("contribution");
          }}
          onBlur={() => restoreZeroOnBlur(contributionStr, setContributionStr)}
          errorMessage={errorMessage("contribution")}
          isExampleValue={exampleResidue.has("contribution")}
          helper={
            <FieldHelp
              label={FIELD_LABELS.contribution}
              explanation="This is how much you plan to add to the balance every month, in addition to the amount it already earns in interest. Enter 0 if you don't plan to add anything."
              onTryExample={tryExample}
            />
          }
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
              Enter an annual rate and your assumptions to see how savings
              could grow. A zero amount means none.
            </p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Projection
          </h2>
          {result ? <PrintButton /> : null}
        </div>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter an annual rate and your assumptions to see how savings
            could grow. A zero amount means none.
          </p>
        ) : (
          <>
            {showExampleBanner ? (
              <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
                Illustrative example. Edit these assumptions.
              </p>
            ) : null}

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard label="Final balance" value={formatMoney(result.finalBalance)} />
              <StatCard label="Initial balance" value={formatMoney(result.initialBalance)} />
              <StatCard
                label="Total contributions"
                value={formatMoney(result.totalContributions)}
              />
              <StatCard
                label="Total interest"
                value={formatMoney(result.totalInterest)}
                accentClassName="text-teal-dark"
              />
            </dl>

            <p className="text-sm text-navy-soft">
              Of your projected {formatMoney(result.finalBalance)} balance after{" "}
              {formatDuration(input.months) || "0 months"},{" "}
              {formatMoney(result.initialBalance)} is what you started with,{" "}
              {formatMoney(result.totalContributions)} is money you contributed
              yourself, and {formatMoney(result.totalInterest)} is interest your
              money earned by compounding monthly.
              {input.months === 0
                ? " No monthly growth period was applied because the duration is 0 months."
                : ""}
            </p>

            <GrowthChart schedule={result.schedule} startingBalance={result.initialBalance} />

            <AssumptionsSummary input={input} isExample={showExampleBanner} />

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">Monthly schedule</h3>
              <MonthlyScheduleTable schedule={result.schedule} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
