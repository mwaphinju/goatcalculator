"use client";

import { useId, useState } from "react";
import { calculateLoanPayment } from "@/lib/finance/loanPayment";
import { LOAN_PAYMENT_LIMITS, MAX_YEARS } from "@/lib/finance/limits";
import {
  validateNumberField,
  validatePositiveAmountField,
  validatePositiveMonthsField,
  type FieldValidation,
} from "@/lib/finance/validation";
import { formatDuration, formatMoney, formatPercent } from "@/lib/finance/format";
import type { LoanPaymentInput } from "@/lib/finance/types";
import { useExampleOrigin } from "@/hooks/useExampleOrigin";
import { useTouchedFields } from "@/hooks/useTouchedFields";
import { NumberField } from "@/components/shared/NumberField";
import { FieldHelp } from "@/components/shared/FieldHelp";
import { StatCard } from "@/components/shared/StatCard";
import { LoanBalanceChart } from "@/components/shared/LoanBalanceChart";
import { LoanScheduleTable } from "@/components/shared/LoanScheduleTable";
import { PrintButton } from "@/components/shared/PrintButton";
import { CsvDownloadButton } from "@/components/shared/CsvDownloadButton";
import { toCsv } from "@/lib/csv";

const FIELD_KEYS = ["loanAmount", "rate", "term"] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABELS: Record<FieldKey, string> = {
  loanAmount: "Loan amount",
  rate: "Annual note interest rate",
  term: "Loan term",
};

type TermMode = "months" | "years-months";

const EXAMPLE = {
  loanAmount: "10000",
  rate: "6",
  months: "36",
};

function validateYearsMonthsTerm(yearsStr: string, monthsPartStr: string): FieldValidation {
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
  if (total <= 0) {
    return { status: "invalid", message: "Loan term must be greater than 0 months." };
  }
  if (total > LOAN_PAYMENT_LIMITS.months.max) {
    return {
      status: "invalid",
      message: `Loan term must be ${LOAN_PAYMENT_LIMITS.months.max} months or fewer.`,
    };
  }
  return { status: "valid", value: total };
}

export function LoanPaymentCalculator() {
  const idPrefix = useId();

  const [loanAmountStr, setLoanAmountStr] = useState("");
  const [rateStr, setRateStr] = useState("");
  const [termMode, setTermMode] = useState<TermMode>("months");
  const [monthsStr, setMonthsStr] = useState("");
  const [yearsStr, setYearsStr] = useState("");
  const [monthsPartStr, setMonthsPartStr] = useState("");

  const { origin, exampleResidue, onFieldEdit, activateExample } = useExampleOrigin<FieldKey>(FIELD_KEYS);
  const { touched, markTouched } = useTouchedFields<FieldKey>();

  function tryExample() {
    setLoanAmountStr(EXAMPLE.loanAmount);
    setRateStr(EXAMPLE.rate);
    setTermMode("months");
    setMonthsStr(EXAMPLE.months);
    setYearsStr("");
    setMonthsPartStr("");
    activateExample();
  }

  const vLoanAmount = validatePositiveAmountField(loanAmountStr, LOAN_PAYMENT_LIMITS.loanAmount, FIELD_LABELS.loanAmount);
  const vRate = validateNumberField(rateStr, LOAN_PAYMENT_LIMITS.rate, FIELD_LABELS.rate);
  const vTerm: FieldValidation =
    termMode === "months"
      ? validatePositiveMonthsField(monthsStr, FIELD_LABELS.term, LOAN_PAYMENT_LIMITS.months.max)
      : validateYearsMonthsTerm(yearsStr, monthsPartStr);

  const validations: Record<FieldKey, FieldValidation> = {
    loanAmount: vLoanAmount,
    rate: vRate,
    term: vTerm,
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

  let input: LoanPaymentInput | null = null;
  if (
    allValid &&
    vLoanAmount.status === "valid" &&
    vRate.status === "valid" &&
    vTerm.status === "valid"
  ) {
    input = {
      loanAmount: vLoanAmount.value,
      annualRatePercent: vRate.value,
      months: vTerm.value,
    };
  }

  const result = input ? calculateLoanPayment(input) : null;

  const showExampleBanner = origin === "example";
  const showResidueNotice = origin === "user" && exampleResidue.size > 0;

  function downloadScheduleCsv() {
    if (!result || !input) return "";
    const generatedAt = new Date().toLocaleString("en-US");
    const rows: (string | number)[][] = [
      ["GOAT Calculator: Loan payment calculator"],
      ["Generated", generatedAt],
      [],
      ["Loan amount", formatMoney(result.loanAmount)],
      ["Annual note interest rate (%)", input.annualRatePercent],
      ["Loan term (months)", input.months],
      ["Payment frequency", "Monthly"],
      ["Estimated monthly payment", formatMoney(result.monthlyPayment)],
      ["Total paid", formatMoney(result.totalPaid)],
      ["Estimated total interest", formatMoney(result.totalInterest)],
      ["Excludes fees, taxes, insurance, escrow and APR", "Yes"],
      [],
      ["Month", "Starting balance", "Payment", "Principal", "Interest", "Ending balance"],
      ...result.schedule.map((row) => [
        row.month,
        formatMoney(row.startingBalance),
        formatMoney(row.payment),
        formatMoney(row.principal),
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
          Your loan
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
          id={`${idPrefix}-loan-amount`}
          label={FIELD_LABELS.loanAmount}
          unitLabel="your currency"
          value={loanAmountStr}
          onChange={(v) => {
            setLoanAmountStr(v);
            onFieldEdit("loanAmount");
          }}
          onBlur={() => markTouched("loanAmount")}
          placeholder="e.g. 10000"
          required
          errorMessage={errorMessage("loanAmount")}
          isExampleValue={exampleResidue.has("loanAmount")}
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
              explanation="This is the note rate printed on the loan, not necessarily the APR. APR can include certain fees on top of the note rate; this calculator excludes fees entirely and only models principal and interest at the note rate. Explicitly entering 0% is valid."
              onTryExample={tryExample}
            />
          }
        />

        <fieldset>
          <legend className="mb-1 text-sm font-medium text-navy">{FIELD_LABELS.term}</legend>
          <div className="mb-2 flex gap-4 text-sm text-navy-soft">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`${idPrefix}-term-mode`}
                checked={termMode === "months"}
                onChange={() => setTermMode("months")}
              />
              Months
            </label>
            <label className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                name={`${idPrefix}-term-mode`}
                checked={termMode === "years-months"}
                onChange={() => setTermMode("years-months")}
              />
              Years + months
            </label>
          </div>

          {termMode === "months" ? (
            <NumberField
              id={`${idPrefix}-months`}
              label="Loan term"
              unitLabel="whole months"
              value={monthsStr}
              onChange={(v) => {
                setMonthsStr(v);
                onFieldEdit("term");
              }}
              onBlur={() => markTouched("term")}
              placeholder="e.g. 36"
              required
              errorMessage={errorMessage("term")}
              isExampleValue={exampleResidue.has("term")}
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
                    onFieldEdit("term");
                  }}
                  onBlur={() => markTouched("term")}
                />
              </div>
              <div className="flex-1">
                <NumberField
                  id={`${idPrefix}-months-part`}
                  label="Months"
                  value={monthsPartStr}
                  onChange={(v) => {
                    setMonthsPartStr(v);
                    onFieldEdit("term");
                  }}
                  onBlur={() => markTouched("term")}
                />
              </div>
              {errorMessage("term") ? (
                <p role="alert" className="col-span-2 text-xs text-red">
                  {errorMessage("term")}
                </p>
              ) : null}
              {exampleResidue.has("term") ? (
                <p className="col-span-2 text-xs text-amber">Example value. Not yet edited.</p>
              ) : null}
            </div>
          )}
        </fieldset>

        <p className="text-sm text-navy-soft">
          Payment frequency: monthly. This calculator only supports monthly
          payments; it does not offer biweekly or other schedules.
        </p>

        {!allValid ? (
          <div
            role="status"
            className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-navy-soft"
          >
            <p>
              Enter a loan amount, an annual note interest rate, and a loan
              term to see your estimated payment. Explicit 0% is a valid
              rate.
            </p>
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-results-heading`} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={`${idPrefix}-results-heading`} className="text-lg font-semibold text-navy">
            Estimated payment
          </h2>
          {result ? (
            <div className="flex gap-2">
              <PrintButton />
              <CsvDownloadButton filename="goat-calculator-loan-payment.csv" getContent={downloadScheduleCsv} />
            </div>
          ) : null}
        </div>

        {!result || !input ? (
          <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-navy-soft">
            Enter a loan amount, an annual note interest rate, and a loan
            term to see your estimated payment. Explicit 0% is a valid
            rate.
          </p>
        ) : (
          <>
            {showExampleBanner ? (
              <p className="rounded-md border border-amber bg-amber-soft px-3 py-2 text-sm font-medium text-amber">
                Illustrative example. Edit these assumptions.
              </p>
            ) : null}

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatCard
                label="Estimated monthly payment"
                value={formatMoney(result.monthlyPayment)}
                accentClassName="text-teal-dark"
              />
              <StatCard label="Total amount paid" value={formatMoney(result.totalPaid)} />
              <StatCard label="Estimated total interest" value={formatMoney(result.totalInterest)} />
              <StatCard label="Loan amount" value={formatMoney(result.loanAmount)} />
            </dl>

            <p className="text-sm text-navy-soft">
              Borrowing {formatMoney(result.loanAmount)} for{" "}
              {formatDuration(input.months) || "0 months"} at {formatPercent(input.annualRatePercent)}{" "}
              is projected to cost an estimated {formatMoney(result.monthlyPayment)} each month. Of
              the {formatMoney(result.totalPaid)} paid in total, {formatMoney(result.loanAmount)} is
              the principal you borrowed and {formatMoney(result.totalInterest)} is estimated
              interest. Real lender schedules may differ due to rounding, payment date, fees,
              escrow, penalties and changing rates.
            </p>

            <LoanBalanceChart schedule={result.schedule} startingBalance={result.loanAmount} />

            <details className="rounded-md border border-border bg-surface p-4">
              <summary className="cursor-pointer select-none font-medium text-navy">
                Assumptions used {showExampleBanner ? "(illustrative example)" : ""}
              </summary>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Loan amount</dt>
                  <dd className="font-medium text-navy">{formatMoney(result.loanAmount)}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Annual note interest rate</dt>
                  <dd className="font-medium text-navy">{formatPercent(input.annualRatePercent)}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Loan term</dt>
                  <dd className="font-medium text-navy">
                    {input.months} {input.months === 1 ? "month" : "months"}
                    {input.months >= 12 ? ` (${formatDuration(input.months)})` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-navy-soft">Payment frequency</dt>
                  <dd className="font-medium text-navy">Monthly (the only frequency this calculator supports)</dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-border pt-3 text-xs text-navy-soft">
                This estimate does not include taxes, insurance, escrow,
                fees, penalties, or changing rates, and does not calculate
                an APR. See the{" "}
                <a href="/methodology" className="text-teal-dark underline hover:text-teal">
                  methodology page
                </a>{" "}
                for what is and isn&apos;t modeled.
              </p>
            </details>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-navy">Monthly amortization schedule</h3>
              <LoanScheduleTable schedule={result.schedule} />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
