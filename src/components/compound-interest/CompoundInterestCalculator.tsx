"use client";

import { useId, useState } from "react";
import { calculateCompoundInterest } from "@/lib/finance/compoundInterest";
import { COMPOUND_INTEREST_LIMITS, MAX_YEARS } from "@/lib/finance/limits";
import { validateMonthsField, validateNumberField, type FieldValidation } from "@/lib/finance/validation";
import { formatDuration, formatMoney } from "@/lib/finance/format";
import type { CompoundInterestInput, ContributionTiming } from "@/lib/finance/types";
import { NumberField } from "./NumberField";
import { FieldHelp } from "./FieldHelp";
import { AssumptionsSummary } from "./AssumptionsSummary";
import { GrowthChart } from "./GrowthChart";
import { ScheduleTable } from "./ScheduleTable";

const FIELD_KEYS = ["initialBalance", "rate", "duration", "contribution"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  initialBalance: "Initial balance",
  rate: "Nominal annual interest rate",
  duration: "Duration",
  contribution: "Monthly contribution",
};

type DurationMode = "months" | "years-months";
type Origin = "empty" | "example" | "user";

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

export function CompoundInterestCalculator() {
  const idPrefix = useId();

  const [initialBalanceStr, setInitialBalanceStr] = useState("");
  const [rateStr, setRateStr] = useState("");
  const [contributionStr, setContributionStr] = useState("");
  const [timing, setTiming] = useState<ContributionTiming>("end");

  const [durationMode, setDurationMode] = useState<DurationMode>("months");
  const [monthsStr, setMonthsStr] = useState("");
  const [yearsStr, setYearsStr] = useState("");
  const [monthsPartStr, setMonthsPartStr] = useState("");

  const [origin, setOrigin] = useState<Origin>("empty");
  const [exampleResidue, setExampleResidue] = useState<Set<FieldKey>>(new Set());

  function onUserEdit(key: FieldKey) {
    if (origin === "example") {
      setExampleResidue(new Set(FIELD_KEYS.filter((k) => k !== key)));
      setOrigin("user");
    } else if (origin === "user") {
      if (exampleResidue.has(key)) {
        const next = new Set(exampleResidue);
        next.delete(key);
        setExampleResidue(next);
      }
    } else {
      setOrigin("user");
    }
  }

  function onTimingEdit() {
    // Timing is a mechanics choice, not one of the four tracked assumption
    // fields, so it never gains its own "still shows example value" tag —
    // but changing it while an example is loaded still means the visitor
    // acted, so the scenario stops being untouched. None of the four
    // tracked fields were edited, so all of them are still carrying
    // example values.
    if (origin === "example") {
      setExampleResidue(new Set(FIELD_KEYS));
      setOrigin("user");
    } else if (origin === "empty") {
      setOrigin("user");
    }
  }

  function tryExample() {
    setInitialBalanceStr(EXAMPLE.initialBalance);
    setRateStr(EXAMPLE.rate);
    setDurationMode("months");
    setMonthsStr(String(EXAMPLE.months));
    setYearsStr("");
    setMonthsPartStr("");
    setContributionStr(EXAMPLE.contribution);
    setTiming(EXAMPLE.timing);
    setOrigin("example");
    setExampleResidue(new Set());
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

  const missingFields = FIELD_KEYS.filter((k) => validations[k].status === "empty");
  const invalidFields = FIELD_KEYS.filter((k) => validations[k].status === "invalid");
  const allValid = missingFields.length === 0 && invalidFields.length === 0;

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
            Illustrative example — edit these assumptions.
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
            onUserEdit("initialBalance");
          }}
          placeholder="e.g. 1000"
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
            onUserEdit("rate");
          }}
          placeholder="e.g. 4.5"
          errorMessage={errorMessage("rate")}
          isExampleValue={exampleResidue.has("rate")}
          helper={
            <FieldHelp
              label={FIELD_LABELS.rate}
              explanation="This is the nominal annual interest rate your balance is assumed to earn, before monthly compounding is applied. It is not an APY. Different savings accounts, CDs and investments pay very different rates, and rates change over time — there is no single correct number to enter."
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
                onUserEdit("duration");
              }}
              placeholder="e.g. 120"
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
                    onUserEdit("duration");
                  }}
                  placeholder="e.g. 10"
                />
              </div>
              <div className="flex-1">
                <NumberField
                  id={`${idPrefix}-months-part`}
                  label="Months"
                  value={monthsPartStr}
                  onChange={(v) => {
                    setMonthsPartStr(v);
                    onUserEdit("duration");
                  }}
                  placeholder="0–11"
                />
              </div>
              {errorMessage("duration") ? (
                <p role="alert" className="col-span-2 text-xs text-red">
                  {errorMessage("duration")}
                </p>
              ) : null}
              {exampleResidue.has("duration") ? (
                <p className="col-span-2 text-xs text-amber">Example value — not yet edited</p>
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
            onUserEdit("contribution");
          }}
          placeholder="e.g. 100"
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

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-navy">
            When is the monthly contribution added?
          </legend>
          <div className="flex flex-col gap-1.5 text-sm text-navy-soft">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`${idPrefix}-timing`}
                checked={timing === "end"}
                onChange={() => {
                  setTiming("end");
                  onTimingEdit();
                }}
              />
              End of month (contribution added after that month&apos;s interest)
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`${idPrefix}-timing`}
                checked={timing === "begin"}
                onChange={() => {
                  setTiming("begin");
                  onTimingEdit();
                }}
              />
              Beginning of month (contribution added before that month&apos;s interest)
            </label>
          </div>
        </fieldset>

        {!allValid ? (
          <div
            role="status"
            className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-navy-soft"
          >
            {missingFields.length > 0 ? (
              <p>
                Enter your{" "}
                {missingFields.map((k) => FIELD_LABELS[k].toLowerCase()).join(", ")} to see
                your projection. Zero is a valid answer for any of these — leave a
                field blank only if you haven&apos;t decided yet.
              </p>
            ) : (
              <p>Fix the highlighted field(s) above to see your projection.</p>
            )}
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
          Projection
        </h2>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Your results will appear here once every field above has a value.
          </p>
        ) : (
          <>
            {showExampleBanner ? (
              <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
                Illustrative example — edit these assumptions.
              </p>
            ) : null}

            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-md border border-border bg-surface p-3">
                <dt className="text-xs text-navy-soft">Final balance</dt>
                <dd className="text-xl font-semibold tabular-nums text-navy break-words">
                  {formatMoney(result.finalBalance)}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <dt className="text-xs text-navy-soft">Initial balance</dt>
                <dd className="text-xl font-semibold tabular-nums text-navy break-words">
                  {formatMoney(result.initialBalance)}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <dt className="text-xs text-navy-soft">Total contributions</dt>
                <dd className="text-xl font-semibold tabular-nums text-navy break-words">
                  {formatMoney(result.totalContributions)}
                </dd>
              </div>
              <div className="rounded-md border border-border bg-surface p-3">
                <dt className="text-xs text-navy-soft">Total interest</dt>
                <dd className="text-xl font-semibold tabular-nums text-teal-dark break-words">
                  {formatMoney(result.totalInterest)}
                </dd>
              </div>
            </dl>

            <p className="text-sm text-navy-soft">
              Of your projected {formatMoney(result.finalBalance)} balance after{" "}
              {formatDuration(input.months) || "0 months"},{" "}
              {formatMoney(result.initialBalance)} is what you started with,{" "}
              {formatMoney(result.totalContributions)} is money you contributed
              yourself, and {formatMoney(result.totalInterest)} is interest your
              money earned by compounding monthly.
            </p>

            <GrowthChart schedule={result.schedule} initialBalance={result.initialBalance} />

            <AssumptionsSummary input={input} isExample={showExampleBanner} />

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">
                Month-by-month schedule
              </h3>
              <ScheduleTable schedule={result.schedule} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
