/**
 * Build a CSV string. Output is UTF-8 with a BOM so Excel opens accented
 * characters correctly. Cells beginning with = + - @ are prefixed with an
 * apostrophe to prevent spreadsheet formula injection.
 */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (value: unknown): string => {
    if (value == null) return '';
    let s = typeof value === 'string' ? value : String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [columns.map(escape).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escape(row[c])).join(','));
  }
  return `﻿${lines.join('\r\n')}`;
}
