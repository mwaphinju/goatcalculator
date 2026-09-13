"use client";

import type { RateMode } from "@/lib/finance/types";
import { NumberField } from "./NumberField";
import { RadioGroup } from "./RadioGroup";
import { FieldHelp } from "./FieldHelp";

interface RateFieldProps {
  idPrefix: string;
  rateMode: RateMode;
  onRateModeChange: (mode: RateMode) => void;
  rateStr: string;
  onRateChange: (value: string) => void;
  onBlur: () => void;
  errorMessage: string | null;
  isExampleValue: boolean;
  onTryExample?: () => void;
}

/**
 * The rate mode choice (explicit, defaults to nominal) plus the rate
 * amount itself (required, never defaulted to 0%), bundled together since
 * every calculator that accepts a rate needs both. APY is already an
 * effective annual rate; a nominal annual rate still needs the monthly
 * conversion this model applies before it can compound. Neither is
 * "converted again" on top of the other, whichever mode is chosen.
 */
export function RateField({
  idPrefix,
  rateMode,
  onRateModeChange,
  rateStr,
  onRateChange,
  onBlur,
  errorMessage,
  isExampleValue,
  onTryExample,
}: RateFieldProps) {
  return (
    <div className="space-y-2">
      <RadioGroup
        legend="Rate type"
        name={`${idPrefix}-rate-mode`}
        value={rateMode}
        onChange={(v) => onRateModeChange(v as RateMode)}
        options={[
          { value: "nominal", label: "Nominal annual rate, compounded monthly" },
          { value: "apy", label: "APY (annual percentage yield)" },
        ]}
      />
      <NumberField
        id={`${idPrefix}-rate`}
        label={rateMode === "apy" ? "APY" : "Nominal annual rate"}
        unitLabel={rateMode === "apy" ? "% per year, effective" : "% per year, nominal"}
        value={rateStr}
        onChange={onRateChange}
        onBlur={onBlur}
        placeholder="e.g. 4.5"
        required
        errorMessage={errorMessage}
        isExampleValue={isExampleValue}
        helper={
          onTryExample ? (
            <FieldHelp
              label={rateMode === "apy" ? "APY" : "nominal annual rate"}
              explanation="A nominal annual rate has not yet had monthly compounding applied, so this model divides it by 12 for you. An APY (annual percentage yield) is already an effective annual rate, so it is converted directly to a monthly rate without compounding it again on top. Different accounts pay very different rates, and rates change over time. There is no single correct number to enter."
              onTryExample={onTryExample}
            />
          ) : (
            <p className="mt-1 text-xs text-navy-soft">
              A nominal annual rate has not yet had monthly compounding applied, so this model
              divides it by 12. An APY is already an effective annual rate, so it converts
              directly to a monthly rate without compounding it again.
            </p>
          )
        }
      />
    </div>
  );
}
