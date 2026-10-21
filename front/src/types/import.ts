
export type ImportStatus = 'queued' | 'processing' | 'completed' | 'failed' | string;

export type ImportSummary = {
  id: string;
  filename: string;
  status: ImportStatus;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  skippedRows: number;
  errorRows: number;
  failureReason: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type ImportRowStatus = 'imported' | 'updated' | 'skipped' | 'invalid';

export type ImportRow = {
  id: string;
  rowNumber: number;
  status: ImportRowStatus;
  stationId: string | null;
  stationName: string | null;
  cnpj: string | null;
  rawData: Record<string, unknown>;
  normalizedData: Record<string, unknown> | null;
  errors: Array<{ field?: string; message?: string }>;
};

export type ImportDetails = {
  summary: ImportSummary;
  rows: ImportRow[];
  pagination: { page: number; limit: number; hasNext: boolean };
};
