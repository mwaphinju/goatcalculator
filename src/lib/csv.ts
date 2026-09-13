/**
 * Small, dependency-free CSV export helpers. No server round trip: the
 * file is assembled as a string and handed to the browser as a local
 * Blob/object URL, the same way a "Save As" dialog would work for any
 * other local file, so a visitor's financial figures never leave their
 * device and never pass through a URL.
 */

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Joins rows of cell values into a single CSV string (CRLF line endings). */
export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

/**
 * Triggers a browser download of `content` as `filename`. Safe to call
 * only from client-side code (guarded for the static-export server pass).
 */
export function downloadCsv(filename: string, content: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
