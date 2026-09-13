"use client";

import { useId, useState } from "react";
import { calculateLoanPayoff } from "@/lib/finance/loanPayoff";
import { LOAN_PAYOFF_LIMITS } from "@/lib/finance/limits";
import {
  validateNumberField,
  validatePositiveAmountField,
  validatePositiveMonthsField,
  type FieldValidation,
} from "@/lib/finance/validation";
import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { LoanPayoffInput, LoanPayoffScenarioResult } from "@/lib/finance/types";
import { useExampleOrigin } from "@/hooks/useExampleOrigin";
import { useTouchedFields } from "@/hooks/useTouchedFields";
import { NumberField } from "@/components/shared/NumberField";
import { FieldHelp } from "@/components/shared/FieldHelp";
import { StatCard } from "@/components/shared/StatCard";
import { ComparisonChart } from "@/components/shared/ComparisonChart";
import { ComparisonTable } from "@/components/shared/ComparisonTable";
import { LoanScheduleTable } from "@/components/shared/LoanScheduleTable";
import { PrintButton } from "@/components/shared/PrintButton";
import { CsvDownloadButton } from "@/components/shared/CsvDownloadButton";
import { toCsv } from "@/lib/csv";

const FIELD_KEYS = [
  "balance",
  "rate",
  "requiredPayment",
  "extraMonthly",
  "oneTimeExtra",
  "oneTimeExtraMonth",
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  balance: "Current loan balance",
  rate: "Annual note interest rate",
  requiredPayment: "Required monthly payment",
  extraMonthly: "Extra monthly payment",
  oneTimeExtra: "One time extra payment",
  oneTimeExtraMonth: "Month for one time extra payment",
};

const EXAMPLE = {
  balance: "10000",
  rate: "6",
  requiredPayment: "200",
  extraMonthly: "50",
  oneTimeExtra: "500",
  oneTimeExtraMonth: "6",
};

function restoreOnBlur(value: string, setValue: (v: string) => void, defaultValue: string) {
  if (value.trim() === "") setValue(defaultValue);
}

function ScenarioStatus({ label, scenario }: { label: string; scenario: LoanPayoffScenarioResult }) {
  if (scenario.reason === "non-amortizing") {
    return (
      <p className="rounded-md border border-red-soft bg-red-soft px-4 py-3 text-sm text-red">
        {label}: your required and extra monthly payments together do not
        cover this month&apos;s interest, so the balance does not decrease
        under this payment. The minimum payment needed to cover just the
        first month&apos;s interest is {formatMoney(scenario.minimumPaymentToCoverInterest)}.
        This is an educational calculation only, not a lender requirement,
        and paying only this amount would never reduce your balance.
      </p>
    );
  }
  if (scenario.reason === "exceeds-max") {
    return (
      <p className="rounded-md border border-red-soft bg-red-soft px-4 py-3 text-sm text-red">
        {label}: this loan is not paid off within the documented maximum
        of {scenario.maxMonths} months ({formatDuration(scenario.maxMonths)}) under
        these payments. Try a higher payment.
      </p>
    );
  }
  return null;
}

export function LoanPayoffCalculator() {
  const idPrefix = useId();

  const [balanceStr, setBalanceStr] = useState("");
  const [rateStr, setRateStr] = useState("");
  const [requiredPaymentStr, setRequiredPaymentStr] = useState("");
  const [extraMonthlyStr, setExtraMonthlyStr] = useState("0");
  const [oneTimeExtraStr, setOneTimeExtraStr] = useState("0");
  const [oneTimeExtraMonthStr, setOneTimeExtraMonthStr] = useState("1");

  const { origin, exampleResidue, onFieldEdit, activateExample } = useExampleOrigin<FieldKey>(FIELD_KEYS);
  const { touched, markTouched } = useTouchedFields<FieldKey>();

  function tryExample() {
    setBalanceStr(EXAMPLE.balance);
    setRateStr(EXAMPLE.rate);
    setRequiredPaymentStr(EXAMPLE.requiredPayment);
    setExtraMonthlyStr(EXAMPLE.extraMonthly);
    setOneTimeExtraStr(EXAMPLE.oneTimeExtra);
    setOneTimeExtraMonthStr(EXAMPLE.oneTimeExtraMonth);
    activateExample();
  }

  const vBalance = validatePositiveAmountField(balanceStr, LOAN_PAYOFF_LIMITS.currentBalance, FIELD_LABELS.balance);
  const vRate = validateNumberField(rateStr, LOAN_PAYOFF_LIMITS.rate, FIELD_LABELS.rate);
  const vRequiredPayment = validatePositiveAmountField(
    requiredPaymentStr,
    LOAN_PAYOFF_LIMITS.requiredMonthlyPayment,
    FIELD_LABELS.requiredPayment,
  );
  const vExtraMonthly = validateNumberField(extraMonthlyStr, LOAN_PAYOFF_LIMITS.extraMonthlyPayment, FIELD_LABELS.extraMonthly);
  const vOneTimeExtra = validateNumberField(oneTimeExtraStr, LOAN_PAYOFF_LIMITS.oneTimeExtraPayment, FIELD_LABELS.oneTimeExtra);
  const vOneTimeExtraMonth = validatePositiveMonthsField(
    oneTimeExtraMonthStr,
    FIELD_LABELS.oneTimeExtraMonth,
    LOAN_PAYOFF_LIMITS.maxMonths,
  );

  const validations: Record<FieldKey, FieldValidation> = {
    balance: vBalance,
    rate: vRate,
    requiredPayment: vRequiredPayment,
    extraMonthly: vExtraMonthly,
    oneTimeExtra: vOneTimeExtra,
    oneTimeExtraMonth: vOneTimeExtraMonth,
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

  let input: LoanPayoffInput | null = null;
  if (
    allValid &&
    vBalance.status === "valid" &&
    vRate.status === "valid" &&
    vRequiredPayment.status === "valid" &&
    vExtraMonthly.status === "valid" &&
    vOneTimeExtra.status === "valid" &&
    vOneTimeExtraMonth.status === "valid"
  ) {
    input = {
      currentBalance: vBalance.value,
      annualRatePercent: vRate.value,
      requiredMonthlyPayment: vRequiredPayment.value,
      extraMonthlyPayment: vExtraMonthly.value,
      oneTimeExtraPayment: vOneTimeExtra.value,
      oneTimeExtraMonth: vOneTimeExtraMonth.value,
    };
  }

  const result = input ? calculateLoanPayoff(input) : null;

  const showExampleBanner = origin === "example";
  const showResidueNotice = origin === "user" && exampleResidue.size > 0;

  const bothAmortized = result?.baseline.reason === "amortizing" && result?.withExtra.reason === "amortizing";

  function downloadScheduleCsv() {
    if (!result || !input) return "";
    const generatedAt = new Date().toLocaleString("en-US");
    const rows: (string | number)[][] = [
      ["GOAT Calculator: Loan payoff calculator"],
      ["Generated", generatedAt],
      [],
      ["Current loan balance", formatMoney(String(input.currentBalance))],
      ["Annual note interest rate (%)", input.annualRatePercent],
      ["Required monthly payment", formatMoney(String(input.requiredMonthlyPayment))],
      ["Extra monthly payment", formatMoney(String(input.extraMonthlyPayment))],
      ["One time extra payment", formatMoney(String(input.oneTimeExtraPayment))],
      ["Month for one time extra payment", input.oneTimeExtraMonth],
      ["Baseline result", result.baseline.reason],
      ["Baseline months to payoff", result.baseline.monthsToPayoff ?? "Not reached"],
      ["Baseline total interest", formatMoney(result.baseline.totalInterest)],
      ["Baseline total paid", formatMoney(result.baseline.totalPaid)],
      ["Extra payment result", result.withExtra.reason],
      ["Extra payment months to payoff", result.withExtra.monthsToPayoff ?? "Not reached"],
      ["Extra payment total interest", formatMoney(result.withExtra.totalInterest)],
      ["Extra payment total paid", formatMoney(result.withExtra.totalPaid)],
      ["Months saved", result.monthsSaved ?? "Not applicable"],
      ["Interest saved", result.interestSaved !== null ? formatMoney(result.interestSaved) : "Not applicable"],
      ["Unused one time extra", formatMoney(result.withExtra.unusedOneTimeExtra)],
      ["Excludes fees, taxes, insurance, escrow and APR", "Yes"],
      [],
      ["Month", "Baseline balance", "Extra payment balance"],
    ];
    const maxMonth = Math.max(result.baseline.schedule.length, result.withExtra.schedule.length);
    for (let m = 1; m <= maxMonth; m++) {
      const b = result.baseline.schedule[m - 1]?.endingBalance ?? result.baseline.schedule.at(-1)?.endingBalance ?? String(input.currentBalance);
      const w = result.withExtra.schedule[m - 1]?.endingBalance ?? result.withExtra.schedule.at(-1)?.endingBalance ?? String(input.currentBalance);
      rows.push([m, formatMoney(b), formatMoney(w)]);
    }
    return toCsv(rows);
  }

  const summarySentence = (() => {
    if (!result || !bothAmortized || result.monthsSaved === null || result.interestSaved === null) return "";
    if (result.monthsSaved <= 0) {
      return "Your extra payments do not reduce the payoff time or interest under these entered assumptions.";
    }
    return `Paying ${formatMoney(String(input?.extraMonthlyPayment ?? 0))} extra each month${
      Number(input?.oneTimeExtraPayment ?? 0) > 0 ? ", plus your one time extra payment," : ""
    } is projected to pay off this loan ${result.monthsSaved} ${
      result.monthsSaved === 1 ? "month" : "months"
    } sooner and save an estimated ${formatMoney(result.interestSaved)} in interest.`;
  })();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
      <section aria-labelledby={`${idPrefix}-inputs-heading`} className="space-y-5">
        <h2 id={`${idPrefix}-inputs-heading`} className="text-lg font-semibold text-navy">
          Your loan and payments
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
          id={`${idPrefix}-balance`}
          label={FIELD_LABELS.balance}
          unitLabel="your currency"
          value={balanceStr}
          onChange={(v) => {
            setBalanceStr(v);
            onFieldEdit("balance");
          }}
          onBlur={() => markTouched("balance")}
          placeholder="e.g. 10000"
          required
          errorMessage={errorMessage("balance")}
          isExampleValue={exampleResidue.has("balance")}
        />

        <NumberField
          id={`${idPrefix}-rate`}
          label={FIELD_LABELS.rate}
          unitLabel="% per year"
          value={rateStr}
          onChange={(v) => {
            setRateStr(v);
            onFieldEdit("rate");
          }}
          onBlur={() => markTouched("rate")}
          placeholder="e.g. 6.5"
          required
          errorMessage={errorMessage("rate")}
          isExampleValue={exampleResidue.has("rate")}
          helper={
            <FieldHelp
              label={FIELD_LABELS.rate}
              explanation="This is the note rate on your loan, not necessarily the APR. Explicitly entering 0% is valid."
              onTryExample={tryExample}
            />
          }
        />

        <NumberField
          id={`${idPrefix}-required-payment`}
          label={FIELD_LABELS.requiredPayment}
          unitLabel="your currency per month"
          value={requiredPaymentStr}
          onChange={(v) => {
            setRequiredPaymentStr(v);
            onFieldEdit("requiredPayment");
          }}
          onBlur={() => markTouched("requiredPayment")}
          placeholder="e.g. 200"
          required
          errorMessage={errorMessage("requiredPayment")}
          isExampleValue={exampleResidue.has("requiredPayment")}
        />

        <NumberField
          id={`${idPrefix}-extra-monthly`}
          label={FIELD_LABELS.extraMonthly}
          unitLabel="your currency per month"
          value={extraMonthlyStr}
          onChange={(v) => {
            setExtraMonthlyStr(v);
            onFieldEdit("extraMonthly");
          }}
          onBlur={() => restoreOnBlur(extraMonthlyStr, setExtraMonthlyStr, "0")}
          errorMessage={errorMessage("extraMonthly")}
          isExampleValue={exampleResidue.has("extraMonthly")}
        />

        <NumberField
          id={`${idPrefix}-one-time-extra`}
          label={FIELD_LABELS.oneTimeExtra}
          unitLabel="your currency"
          value={oneTimeExtraStr}
          onChange={(v) => {
            setOneTimeExtraStr(v);
            onFieldEdit("oneTimeExtra");
          }}
          onBlur={() => restoreOnBlur(oneTimeExtraStr, setOneTimeExtraStr, "0")}
          errorMessage={errorMessage("oneTimeExtra")}
          isExampleValue={exampleResidue.has("oneTimeExtra")}
        />

        <NumberField
          id={`${idPrefix}-one-time-extra-month`}
          label={FIELD_LABELS.oneTimeExtraMonth}
          unitLabel="month number, 1 = first payment month"
          value={oneTimeExtraMonthStr}
          onChange={(v) => {
            setOneTimeExtraMonthStr(v);
            onFieldEdit("oneTimeExtraMonth");
          }}
          onBlur={() => restoreOnBlur(oneTimeExtraMonthStr, setOneTimeExtraMonthStr, "1")}
          errorMessage={errorMessage("oneTimeExtraMonth")}
          isExampleValue={exampleResidue.has("oneTimeExtraMonth")}
        />
        <p className="-mt-3 text-xs text-navy-soft">
          Applies only if the one time extra payment above is greater than
          $0. Defaults to month 1, the first modeled payment month.
        </p>

        {!allValid ? (
          <div
            role="status"
            className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-navy-soft"
          >
            <p>
              Enter your current loan balance, an annual note interest
              rate, and your required monthly payment to see a payoff
              comparison. Extra payments default to $0, which means none.
            </p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Payoff comparison
          </h2>
          {result ? (
            <div className="flex gap-2">
              <PrintButton />
              <CsvDownloadButton filename="goat-calculator-loan-payoff.csv" getContent={downloadScheduleCsv} />
            </div>
          ) : null}
        </div>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter your current loan balance, an annual note interest rate,
            and your required monthly payment to see a payoff comparison.
            Extra payments default to $0, which means none.
          </p>
        ) : (
          <>
            {showExampleBanner ? (
              <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
                Illustrative example. Edit these assumptions.
              </p>
            ) : null}

            <ScenarioStatus label="Baseline (no extra payments)" scenario={result.baseline} />
            <ScenarioStatus label="Your extra payment scenario" scenario={result.withExtra} />

            {bothAmortized ? (
              <>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <StatCard label="Baseline payoff duration" value={formatDuration(result.baseline.monthsToPayoff ?? 0) || "0 months"} />
                  <StatCard label="Extra payment payoff duration" value={formatDuration(result.withExtra.monthsToPayoff ?? 0) || "0 months"} />
                  <StatCard
                    label="Months saved"
                    value={String(result.monthsSaved ?? 0)}
                    accentClassName="text-teal-dark"
                  />
                  <StatCard
                    label="Estimated interest saved"
                    value={formatMoney(result.interestSaved ?? "0")}
                    accentClassName="text-teal-dark"
                  />
                  <StatCard label="Baseline total interest" value={formatMoney(result.baseline.totalInterest)} />
                  <StatCard label="Extra payment total interest" value={formatMoney(result.withExtra.totalInterest)} />
                  <StatCard label="Baseline total paid" value={formatMoney(result.baseline.totalPaid)} />
                  <StatCard label="Extra payment total paid" value={formatMoney(result.withExtra.totalPaid)} />
                </dl>

                <p className="text-sm text-navy-soft">
                  {summarySentence} Real lender schedules may differ due
                  to rounding, payment date, fees, escrow, penalties and
                  changing rates.
                </p>

                {Number(result.withExtra.unusedOneTimeExtra) > 0 ? (
                  <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm text-amber">
                    {formatMoney(result.withExtra.unusedOneTimeExtra)} of your
                    requested one time extra payment was not applied,
                    either because the loan was already paid off before the
                    selected month or because less was owed than requested
                    that month. This unused amount is not counted as paid.
                  </p>
                ) : null}

                <ComparisonChart
                  baselineSchedule={result.baseline.schedule}
                  baselineStartingBalance={String(input.currentBalance)}
                  alternativeSchedule={result.withExtra.schedule}
                  alternativeStartingBalance={String(input.currentBalance)}
                  baselineLabel="Baseline"
                  alternativeLabel="With extra payments"
                />

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-navy">Monthly balance comparison</h3>
                  <ComparisonTable
                    baselineSchedule={result.baseline.schedule}
                    alternativeSchedule={result.withExtra.schedule}
                    baselineLabel="Baseline"
                    alternativeLabel="With extra"
                    captionPrefix="Monthly loan payoff comparison schedule"
                    regionLabel="Monthly loan payoff comparison table, scrollable horizontally on narrow screens"
                  />
                </div>
              </>
            ) : null}

            <details className="rounded-md border border-border bg-surface p-4">
              <summary className="cursor-pointer select-none font-medium text-navy">
                Assumptions used {showExampleBanner ? "(illustrative example)" : ""}
              </summary>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Current loan balance</dt>
                  <dd className="font-medium text-navy">{formatMoney(String(input.currentBalance))}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Annual note interest rate</dt>
                  <dd className="font-medium text-navy">{formatPercent(input.annualRatePercent)}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Required monthly payment</dt>
                  <dd className="font-medium text-navy">{formatMoney(String(input.requiredMonthlyPayment))}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Extra monthly payment</dt>
                  <dd className="font-medium text-navy">{formatMoney(String(input.extraMonthlyPayment))}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">One time extra payment</dt>
                  <dd className="font-medium text-navy">{formatMoney(String(input.oneTimeExtraPayment))}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Month for one time extra payment</dt>
                  <dd className="font-medium text-navy">Month {input.oneTimeExtraMonth}</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-border pt-3 text-xs text-navy-soft">
                This projection does not include taxes, insurance, escrow,
                fees, penalties, or changing rates, and does not calculate
                an APR. See the{" "}
                <a href="/methodology" className="text-teal-dark underline hover:text-teal">
                  methodology page
                </a>{" "}
                for what is and isn&apos;t modeled.
              </p>
            </details>

            {bothAmortized ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-navy">
                  Extra payment scenario schedule
                </h3>
                <LoanScheduleTable
                  schedule={result.withExtra.schedule}
                  captionPrefix="Extra payment scenario amortization schedule"
                  regionLabel="Extra payment scenario amortization schedule table, scrollable horizontally on narrow screens"
                />
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
