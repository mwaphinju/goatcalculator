"use client";

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  legend: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
}

/**
 * An explicit-choice field: a visible, unambiguous selection with no
 * unlabeled default state (unlike a required text field, an
 * always-checked radio always has a valid current value).
 */
export function RadioGroup({ legend, name, value, onChange, options }: RadioGroupProps) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-navy">{legend}</legend>
      <div className="flex flex-col gap-1.5 text-sm text-navy-soft">
        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
