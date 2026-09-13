"use client";

interface NumberFieldProps {
  id: string;
  label: string;
  unitLabel?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  errorMessage?: string | null;
  isExampleValue?: boolean;
  /**
   * Marks this as a required visitor assumption: appends "(Required)" to
   * the visible label text (not just a placeholder, so the requirement is
   * never conveyed by color or placeholder text alone) and sets
   * aria-required so assistive technology announces it too.
   */
  required?: boolean;
  helper?: React.ReactNode;
}

export function NumberField({
  id,
  label,
  unitLabel,
  value,
  onChange,
  onBlur,
  placeholder,
  errorMessage,
  isExampleValue,
  required,
  helper,
}: NumberFieldProps) {
  const errorId = `${id}-error`;
  const exampleId = `${id}-example`;
  const describedBy = [errorMessage ? errorId : null, isExampleValue ? exampleId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-navy">
          {label}
          {unitLabel ? (
            <span className="ml-1 font-normal text-navy-soft">({unitLabel})</span>
          ) : null}
          {required ? <span className="ml-1 font-normal text-amber">(Required)</span> : null}
        </label>
      </div>
      <input
        id={id}
        name={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={errorMessage ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-navy shadow-sm focus:outline-none ${
          errorMessage ? "border-red" : "border-border"
        }`}
      />
      {isExampleValue ? (
        <p id={exampleId} className="mt-1 text-xs text-amber">
          Example value. Not yet edited.
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red">
          {errorMessage}
        </p>
      ) : null}
      {helper}
    </div>
  );
}
