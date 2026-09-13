"use client";

import { downloadCsv } from "@/lib/csv";

interface CsvDownloadButtonProps {
  filename: string;
  getContent: () => string;
  label?: string;
}

export function CsvDownloadButton({ filename, getContent, label = "Download CSV" }: CsvDownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, getContent())}
      className="no-print rounded-md border border-border px-3 py-1.5 text-sm font-medium text-navy hover:border-teal"
    >
      {label}
    </button>
  );
}
