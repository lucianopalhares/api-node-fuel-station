// consultar o histórico resumido das importações 

import type { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';

export type ImportSummary = {
  id: string;
  filename: string;
  status: string;
  totalRows: number;
  importedRows: number;
  updatedRows: number;
  skippedRows: number;
  errorRows: number;
  failureReason: string | null;
  startedAt: string;
  finishedAt: string | null;
};

type ImportSummaryRow = {
  id: string;
  filename: string;
  status: string;
  total_rows: number;
  imported_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: number;
  failure_reason: string | null;
  started_at: string;
  finished_at: string | null;
};

export class ListImports {
  constructor(private readonly database: DatabaseClient) {}

  async execute(limit: number, importId?: string): Promise<ImportSummary[]> {
    const result = await this.database.query<ImportSummaryRow>(
      `SELECT id, filename, status, total_rows, imported_rows, updated_rows,
              skipped_rows, error_rows, failure_reason, started_at, finished_at
         FROM imports
        WHERE ($2::BIGINT IS NULL OR id = $2::BIGINT)
        ORDER BY started_at DESC, id DESC
        LIMIT $1`,
      [limit, importId || null],
    );

    return result.rows.map(mapSummary);
  }
}

export function mapSummary(row: ImportSummaryRow): ImportSummary {
  return {
    id: row.id,
    filename: row.filename,
    status: row.status,
    totalRows: row.total_rows,
    importedRows: row.imported_rows,
    updatedRows: row.updated_rows,
    skippedRows: row.skipped_rows,
    errorRows: row.error_rows,
    failureReason: row.failure_reason,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  };
}
