// retornar o resumo e as linhas processadas de uma importação.

import { NotFoundError } from '../../shared/errors/NotFoundError';
import type { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import { mapSummary, type ImportSummary } from './ListImports';

export const importRowStatuses = ['imported', 'updated', 'skipped', 'invalid'] as const;
export type ImportRowStatus = (typeof importRowStatuses)[number];

export type ImportRowDetails = {
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

type ImportRowDetailsRow = {
  id: string;
  row_number: number;
  status: ImportRowStatus;
  station_id: string | null;
  station_name: string | null;
  cnpj: string | null;
  raw_data: Record<string, unknown>;
  normalized_data: Record<string, unknown> | null;
  errors: Array<{ field?: string; message?: string }>;
};

export type ImportDetails = {
  summary: ImportSummary;
  rows: ImportRowDetails[];
  pagination: { page: number; limit: number; hasNext: boolean };
};

export class GetImportDetails {
  constructor(private readonly database: DatabaseClient) {}

  async execute(input: {
    importId: string;
    page: number;
    limit: number;
    status?: ImportRowStatus;
  }): Promise<ImportDetails> {
    const importResult = await this.database.query<Parameters<typeof mapSummary>[0]>(
      `SELECT id, filename, status, total_rows, imported_rows, updated_rows,
              skipped_rows, error_rows, failure_reason, started_at, finished_at
         FROM imports
        WHERE id = $1`,
      [input.importId],
    );

    const importRow = importResult.rows[0];
    if (!importRow) {
      throw new NotFoundError('IMPORT_NOT_FOUND', 'Importação não encontrada.');
    }

    const values: unknown[] = [input.importId, input.limit + 1, (input.page - 1) * input.limit];
    let statusClause = '';
    if (input.status) {
      values.push(input.status);
      statusClause = ` AND ir.status = $${values.length}`;
    }

    const rowsResult = await this.database.query<ImportRowDetailsRow>(
      `SELECT ir.id, ir.row_number, ir.status, ir.station_id,
              COALESCE(s.nome_fantasia, s.nome_posto) AS station_name,
              s.cnpj, ir.raw_data, ir.normalized_data, ir.errors
         FROM import_rows ir
         LEFT JOIN stations s ON s.id = ir.station_id
        WHERE ir.import_id = $1${statusClause}
        ORDER BY ir.row_number ASC
        LIMIT $2 OFFSET $3`,
      values,
    );

    const hasNext = rowsResult.rows.length > input.limit;
    return {
      summary: mapSummary(importRow),
      rows: rowsResult.rows.slice(0, input.limit).map(mapRow),
      pagination: { page: input.page, limit: input.limit, hasNext },
    };
  }
}

function mapRow(row: ImportRowDetailsRow): ImportRowDetails {
  return {
    id: row.id,
    rowNumber: row.row_number,
    status: row.status,
    stationId: row.station_id,
    stationName: row.station_name,
    cnpj: row.cnpj,
    rawData: row.raw_data,
    normalizedData: row.normalized_data,
    errors: row.errors,
  };
}
