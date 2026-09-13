/**
 * Ordinary currency amounts (up to roughly hundreds of millions) stay at a
 * comfortably large, readable size. Only once a value's digit count grows
 * past what any reasonable card width can hold on one line does the size
 * step down, and even then only as far as a still-legible floor;
 * `break-words` on the value itself is a safety net for those rare cases,
 * not how normal amounts are kept from overflowing their card.
 */
function statValueSizeClass(formatted: string): string {
  if (formatted.length <= 13) return "text-xl";
  if (formatted.length <= 20) return "text-base";
  return "text-sm";
}

export function StatCard({
  label,
  value,
  accentClassName = "text-navy",
}: {
  label: string;
  value: string;
  accentClassName?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-3">
      <dt className="text-xs text-navy-soft">{label}</dt>
      <dd
        className={`font-semibold tabular-nums break-words ${statValueSizeClass(value)} ${accentClassName}`}
      >
        {value}
      </dd>
    </div>
  );
}
