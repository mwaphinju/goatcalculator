"use client";

interface FieldHelpProps {
  label: string;
  explanation: string;
  onTryExample: () => void;
}

/**
 * "I don't know" help affordance for a field that needs a visitor
 * assumption. Explains what the value means and offers two explicit
 * paths: keep typing your own number, or load a clearly labeled
 * illustrative example.
 */
export function FieldHelp({ label, explanation, onTryExample }: FieldHelpProps) {
  return (
    <details className="mt-1 text-xs text-navy-soft">
      <summary className="cursor-pointer select-none text-teal-dark hover:text-teal">
        Not sure what to enter?
      </summary>
      <div className="mt-2 rounded-md border border-border bg-teal-soft/40 p-3">
        <p className="mb-2">{explanation}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTryExample}
            className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-dark"
          >
            Try an example
          </button>
          <span className="self-center text-xs text-navy-soft">
            or enter your own {label.toLowerCase()} above
          </span>
        </div>
      </div>
    </details>
  );
}
