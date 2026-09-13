"use client";

import type { ContributionTiming, RateMode } from "@/lib/finance/types";
import type { FieldValidation } from "@/lib/finance/validation";
import { NumberField } from "@/components/shared/NumberField";
import { RateField } from "@/components/shared/RateField";
import { RadioGroup } from "@/components/shared/RadioGroup";

export type ScenarioFieldKey = "startingBalance" | "contribution" | "rate" | "duration";

interface ScenarioFieldsProps {
  idPrefix: string;
  legend: string;
  startingBalanceStr: string;
  onStartingBalanceChange: (v: string) => void;
  onStartingBalanceBlur: () => void;
  contributionStr: string;
  onContributionChange: (v: string) => void;
  onContributionBlur: () => void;
  rateMode: RateMode;
  onRateModeChange: (mode: RateMode) => void;
  rateStr: string;
  onRateChange: (v: string) => void;
  onRateBlur: () => void;
  monthsStr: string;
  onMonthsChange: (v: string) => void;
  onMonthsBlur: () => void;
  timing: ContributionTiming;
  onTimingChange: (timing: ContributionTiming) => void;
  validations: Record<ScenarioFieldKey, FieldValidation>;
  errorMessage: (key: ScenarioFieldKey) => string | null;
  exampleResidue: Set<ScenarioFieldKey>;
  onTryExample: () => void;
}

export function ScenarioFields({
  idPrefix,
  legend,
  startingBalanceStr,
  onStartingBalanceChange,
  onStartingBalanceBlur,
  contributionStr,
  onContributionChange,
  onContributionBlur,
  rateMode,
  onRateModeChange,
  rateStr,
  onRateChange,
  onRateBlur,
  monthsStr,
  onMonthsChange,
  onMonthsBlur,
  timing,
  onTimingChange,
  errorMessage,
  exampleResidue,
  onTryExample,
}: ScenarioFieldsProps) {
  return (
    <fieldset className="space-y-4 rounded-md border border-border p-4">
      <legend className="px-1 text-base font-semibold text-navy">{legend}</legend>

      <NumberField
        id={`${idPrefix}-starting-balance`}
        label="Starting balance"
        unitLabel="your currency, e.g. $"
        value={startingBalanceStr}
        onChange={onStartingBalanceChange}
        onBlur={onStartingBalanceBlur}
        errorMessage={errorMessage("startingBalance")}
        isExampleValue={exampleResidue.has("startingBalance")}
      />

      <NumberField
        id={`${idPrefix}-contribution`}
        label="Monthly contribution"
        unitLabel="your currency per month"
        value={contributionStr}
        onChange={onContributionChange}
        onBlur={onContributionBlur}
        errorMessage={errorMessage("contribution")}
        isExampleValue={exampleResidue.has("contribution")}
      />

      <NumberField
        id={`${idPrefix}-months`}
        label="Duration"
        unitLabel="whole months"
        value={monthsStr}
        onChange={onMonthsChange}
        onBlur={onMonthsBlur}
        placeholder="e.g. 60"
        required
        errorMessage={errorMessage("duration")}
        isExampleValue={exampleResidue.has("duration")}
      />

      <RateField
        idPrefix={idPrefix}
        rateMode={rateMode}
        onRateModeChange={onRateModeChange}
        rateStr={rateStr}
        onRateChange={onRateChange}
        onBlur={onRateBlur}
        errorMessage={errorMessage("rate")}
        isExampleValue={exampleResidue.has("rate")}
        onTryExample={onTryExample}
      />

      <RadioGroup
        legend="When is the monthly contribution added?"
        name={`${idPrefix}-timing`}
        value={timing}
        onChange={(v) => onTimingChange(v as ContributionTiming)}
        options={[
          { value: "end", label: "End of each month (contribution added after that month's interest)" },
          { value: "begin", label: "Beginning of each month (contribution added before that month's interest)" },
        ]}
      />
    </fieldset>
  );
}
