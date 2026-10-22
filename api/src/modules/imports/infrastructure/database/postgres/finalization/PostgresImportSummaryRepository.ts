/** Atualiza status e contadores da importação com consultas agregadas no PostgreSQL. */

import type { DatabaseClient } from '../../../../../shared/infrastructure/database/DatabaseClient';
import type { ImportSummaryRepository } from '../../../../domain/repositories/ImportSummaryRepository';

export class PostgresImportSummaryRepository implements ImportSummaryRepository {
  async markProcessing(database: DatabaseClient, importId: string): Promise<void> {
    await database.query(`UPDATE imports SET status = 'processing', started_at = NOW() WHERE id = $1`, [importId]);
  }

  async complete(database: DatabaseClient, importId: string): Promise<void> {
    await database.query(
      `UPDATE imports AS i
          SET status = CASE WHEN counts.error_rows > 0 THEN 'completed_with_errors' ELSE 'completed' END,
              total_rows = counts.total_rows, imported_rows = counts.imported_rows,
              updated_rows = counts.updated_rows, error_rows = counts.error_rows,
              finished_at = NOW()
         FROM (
           SELECT import_id,
                  COUNT(*)::INTEGER AS total_rows,
                  COUNT(*) FILTER (WHERE status = 'imported')::INTEGER AS imported_rows,
                  COUNT(*) FILTER (WHERE status = 'updated')::INTEGER AS updated_rows,
                  COUNT(*) FILTER (WHERE status = 'invalid')::INTEGER AS error_rows
             FROM import_rows WHERE import_id = $1 GROUP BY import_id
         ) counts
        WHERE i.id = counts.import_id`,
      [importId],
    );
  }

  async fail(database: DatabaseClient, importId: string, reason: string): Promise<void> {
    await database.query(
      `UPDATE imports SET status = 'failed', failure_reason = $2, finished_at = NOW() WHERE id = $1`,
      [importId, reason],
    );
  }
}

