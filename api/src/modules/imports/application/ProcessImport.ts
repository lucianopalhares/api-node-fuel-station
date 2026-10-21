import { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import { logger } from '../../shared/observability/logger';
import { CsvImportReader } from './CsvImportReader';
import { ImportProgress } from './ImportProgress';
import { ProcessImportRow } from './ProcessImportRow';
import { RowError, StationImportPersister, type CsvStationRow } from './StationImportPersister';
import type { ImportFileStorage } from './ports/ImportFileStorage';

export class ProcessImport {
  private readonly reader: CsvImportReader;
  private readonly rowProcessor: ProcessImportRow;

  constructor(
    private readonly database: DatabaseClient,
    storage: ImportFileStorage,
    persister = new StationImportPersister(database),
  ) {
    this.reader = new CsvImportReader(storage);
    this.rowProcessor = new ProcessImportRow(persister);
  }

  async execute(importId: string, storageKey: string): Promise<void> {
    const startedAt = Date.now();
    await this.markProcessing(importId);
    logger.info('import.processing.started', { importId, storageKey });

    try {
      const rows = await this.reader.read(storageKey, importId);
      const progress = new ImportProgress(importId);
      await this.processRows(importId, rows, progress);
      await this.complete(importId, progress);
      logger.info('import.processing.completed', {
        importId,
        ...progress.summary(),
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      logger.error('import.processing.failed', { importId, storageKey, durationMs: Date.now() - startedAt, error });
      await this.markFailed(importId);
      throw error;
    }
  }

  private async processRows(
    importId: string,
    rows: AsyncIterable<CsvStationRow>,
    progress: ImportProgress,
  ): Promise<void> {
    for await (const row of rows) {
      const rowNumber = progress.nextRow();
      try {
        const result = await this.rowProcessor.execute(importId, rowNumber, row);
        if (result.status === 'updated') progress.updated();
        else progress.imported();
      } catch (error) {
        progress.invalid();
        await this.recordInvalidRow(importId, rowNumber, row, error);
      }
    }
  }

  private async recordInvalidRow(importId: string, rowNumber: number, row: CsvStationRow, error: unknown): Promise<void> {
    const field = error instanceof RowError ? error.field : 'row';
    const message = error instanceof Error ? error.message : 'Erro ao persistir a linha.';
    await this.database.query(
      `INSERT INTO import_rows (import_id, row_number, raw_data, status, errors)
       VALUES ($1, $2, $3::jsonb, 'invalid', $4::jsonb)
       ON CONFLICT (import_id, row_number) DO UPDATE SET
         raw_data = EXCLUDED.raw_data, status = EXCLUDED.status, errors = EXCLUDED.errors`,
      [importId, rowNumber, JSON.stringify(row), JSON.stringify([{ field, message }])],
    );
  }

  private async markProcessing(importId: string): Promise<void> {
    await this.database.query(
      `UPDATE imports SET status = 'processing', started_at = NOW() WHERE id = $1`,
      [importId],
    );
  }

  private async complete(importId: string, progress: ImportProgress): Promise<void> {
    const summary = progress.summary();
    await this.database.query(
      `UPDATE imports
          SET status = CASE WHEN $1 > 0 THEN 'completed_with_errors' ELSE 'completed' END,
              total_rows = $2, imported_rows = $3, updated_rows = $4,
              error_rows = $1, finished_at = NOW()
        WHERE id = $5`,
      [summary.errorRows, summary.totalRows, summary.importedRows, summary.updatedRows, importId],
    );
  }

  private async markFailed(importId: string, reason = 'Falha durante o processamento do arquivo.'): Promise<void> {
    await this.database.query(
      `UPDATE imports
          SET status = 'failed', failure_reason = $2, finished_at = NOW()
        WHERE id = $1`,
      [importId, reason],
    );
  }
}
