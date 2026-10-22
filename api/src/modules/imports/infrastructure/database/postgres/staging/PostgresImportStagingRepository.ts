/** Implementa o staging da importação no PostgreSQL com inserts e leituras em lote. */

import type { DatabaseClient } from '../../../../../shared/infrastructure/database/DatabaseClient';
import type { ImportStagingRepository } from '../../../../domain/repositories/ImportStagingRepository';
import type { ReadyImportRow, StagingRow } from '../../../../application/staging/types';

export class PostgresImportStagingRepository implements ImportStagingRepository {
  constructor(private readonly database: DatabaseClient) {}

  async insertBatch(rows: StagingRow[]): Promise<void> {
    if (!rows.length) return;
    const values: unknown[] = [];
    const placeholders = rows.map((row, index) => {
      const offset = index * 7;
      values.push(
        row.importId,
        row.rowNumber,
        JSON.stringify(row.rawData),
        row.normalizedData ? JSON.stringify(row.normalizedData) : null,
        row.status,
        JSON.stringify(row.errors),
        null,
      );
      return `($${offset + 1}, $${offset + 2}, NULL, $${offset + 3}::jsonb, $${offset + 4}::jsonb, $${offset + 5}, $${offset + 6}::jsonb, $${offset + 7}::timestamptz)`;
    });

    await this.database.query(
      `INSERT INTO import_rows (import_id, row_number, station_id, raw_data, normalized_data, status, errors, applied_at)
       VALUES ${placeholders.join(',')}
       ON CONFLICT (import_id, row_number) DO UPDATE SET
         raw_data = EXCLUDED.raw_data, normalized_data = EXCLUDED.normalized_data,
         status = EXCLUDED.status, errors = EXCLUDED.errors, applied_at = EXCLUDED.applied_at`,
      values,
    );
  }

  async listReadyBatch(importId: string, afterRowNumber: number, limit: number): Promise<ReadyImportRow[]> {
    const result = await this.database.query<{
      row_number: number;
      raw_data: Record<string, string>;
      normalized_data: Record<string, string>;
    }>(
      `SELECT row_number, raw_data, normalized_data
         FROM import_rows
        WHERE import_id = $1 AND status = 'ready' AND row_number > $2
        ORDER BY row_number ASC
        LIMIT $3`,
      [importId, afterRowNumber, limit],
    );

    return result.rows.map((row) => ({
      importId,
      rowNumber: row.row_number,
      rawData: row.raw_data,
      normalizedData: row.normalized_data,
      status: 'ready',
      errors: [],
    }));
  }

  async markInvalid(database: DatabaseClient, importId: string, rows: Array<{ rowNumber: number; errors: Array<{ field: string; message: string }> }>): Promise<void> {
    for (const row of rows) {
      await database.query(
        `UPDATE import_rows SET status = 'invalid', errors = $1::jsonb WHERE import_id = $2 AND row_number = $3 AND status = 'ready'`,
        [JSON.stringify(row.errors), importId, row.rowNumber],
      );
    }
  }

  async markApplied(database: DatabaseClient, importId: string, rows: Array<{ rowNumber: number; stationId: string; status: 'imported' | 'updated' }>): Promise<void> {
    if (!rows.length) return;
    const values: unknown[] = [];
    const placeholders = rows.map((row, index) => {
      const offset = index * 3;
      values.push(row.rowNumber, row.stationId, row.status);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    });
    await database.query(
      `UPDATE import_rows AS ir
          SET station_id = data.station_id::BIGINT,
              status = data.status,
              errors = '[]'::jsonb,
              applied_at = NOW()
         FROM (VALUES ${placeholders.join(',')}) AS data(row_number, station_id, status)
        WHERE ir.import_id = $${values.length + 1} AND ir.row_number = data.row_number::INTEGER AND ir.status = 'ready'`,
      [...values, importId],
    );
  }
}

