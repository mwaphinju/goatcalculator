"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-md border border-border px-3 py-1.5 text-sm font-medium text-navy hover:border-teal"
    >
      Print this result
    </button>
  );
}
