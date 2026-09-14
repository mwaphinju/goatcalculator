"use client";

import { useId } from "react";
import { NumberField } from "@/components/shared/NumberField";

export interface ScenarioBranchFieldsProps {
  defaultName: string;
  name: string;
  onNameChange: (name: string) => void;
  rateStr: string;
  onRateChange: (v: string) => void;
  onRateBlur: () => void;
  rateErrorMessage: string | null;
  rateIsExampleValue: boolean;
  contributionStr: string;
  onContributionChange: (v: string) => void;
  onContributionBlur: () => void;
  contributionErrorMessage: string | null;
  contributionIsExampleValue: boolean;
  feeStr: string;
  onFeeChange: (v: string) => void;
  onFeeBlur: () => void;
  feeErrorMessage: string | null;
  feeIsExampleValue: boolean;
}

/**
 * One editable scenario "branch": a visitor-renamed label plus the rate,
 * monthly contribution and monthly account fee assumptions for that
 * scenario. Used three times (for Scenario A, B and C) by the savings
 * scenario calculator. The heading tracks the current name so a rename is
 * reflected immediately, while the group's accessible name comes from
 * that same heading via `aria-labelledby`.
 */
export function ScenarioBranchFields({
  defaultName,
  name,
  onNameChange,
  rateStr,
  onRateChange,
  onRateBlur,
  rateErrorMessage,
  rateIsExampleValue,
  contributionStr,
  onContributionChange,
  onContributionBlur,
  contributionErrorMessage,
  contributionIsExampleValue,
  feeStr,
  onFeeChange,
  onFeeBlur,
  feeErrorMessage,
  feeIsExampleValue,
}: ScenarioBranchFieldsProps) {
  const idPrefix = useId();
  const headingId = `${idPrefix}-heading`;
  const nameId = `${idPrefix}-name`;

  return (
    <div role="group" aria-labelledby={headingId} className="space-y-4 rounded-md border border-border p-4">
      <h3 id={headingId} className="break-words text-base font-semibold text-navy">
        {name.trim() || defaultName}
      </h3>

      <div>
        <label htmlFor={nameId} className="mb-1 block text-sm font-medium text-navy">
          Scenario name
        </label>
        <input
          id={nameId}
          type="text"
          value={name}
          maxLength={60}
          placeholder={defaultName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-navy shadow-sm focus:outline-none"
        />
        <p className="mt-1 text-xs text-navy-soft">
          This label is for comparison only. Renaming it does not change the
          calculation, and it is never a prediction of what will happen.
        </p>
      </div>

      <NumberField
        id={`${idPrefix}-rate`}
        label="Annual interest rate"
        unitLabel="% per year, nominal"
        value={rateStr}
        onChange={onRateChange}
        onBlur={onRateBlur}
        placeholder="e.g. 5"
        required
        errorMessage={rateErrorMessage}
        isExampleValue={rateIsExampleValue}
      />

      <NumberField
        id={`${idPrefix}-contribution`}
        label="Monthly contribution"
        unitLabel="your currency per month"
        value={contributionStr}
        onChange={onContributionChange}
        onBlur={onContributionBlur}
        errorMessage={contributionErrorMessage}
        isExampleValue={contributionIsExampleValue}
      />

      <NumberField
        id={`${idPrefix}-fee`}
        label="Monthly account fee"
        unitLabel="your currency per month"
        value={feeStr}
        onChange={onFeeChange}
        onBlur={onFeeBlur}
        errorMessage={feeErrorMessage}
        isExampleValue={feeIsExampleValue}
      />

      <p className="text-xs text-navy-soft">
        These are assumptions you choose for this scenario, not a forecast,
        guarantee, or recommendation.
      </p>
    </div>
  );
}
