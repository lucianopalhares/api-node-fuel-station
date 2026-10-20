import { CSV_HEADERS } from '../validation/CsvImportValidation';

export type CsvExportRecord = Record<string, unknown>;

export function createCsvHeader(): string {
  return `\uFEFF${CSV_HEADERS.join(';')}\r\n`;
}

export function serializeCsvRecord(record: CsvExportRecord): string {
  const values = CSV_HEADERS.map((header) => escapeCsvValue(record[header]));
  return `${values.join(';')}\r\n`;
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const text = String(value);
  if (!/[";\r\n]/.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}
