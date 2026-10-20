import { NotFoundError } from '../../shared/errors/NotFoundError';
import { logger } from '../../shared/observability/logger';
import type { CsvExportRecord } from '../../shared/utils/CsvExportUtils';
import type {
  ImportExportRepository,
  ImportExportRow,
} from '../domain/repositories/ImportExportRepository';

const EXPORT_BATCH_SIZE = 500;

export type ImportExportDocument = {
  filename: string;
  rows: AsyncIterable<CsvExportRecord>;
};

export class ExportImport {
  constructor(private readonly repository: ImportExportRepository) {}

  async execute(importId: string): Promise<ImportExportDocument> {
    const metadata = await this.repository.findMetadata(importId);
    if (!metadata) {
      throw new NotFoundError('IMPORT_NOT_FOUND', 'Importação não encontrada.');
    }

    logger.info('import.export.started', {
      importId,
      filename: metadata.filename,
      batchSize: EXPORT_BATCH_SIZE,
    });

    return {
      filename: buildExportFilename(metadata.filename, importId),
      rows: this.readRows(importId),
    };
  }

  private async *readRows(importId: string): AsyncIterable<CsvExportRecord> {
    let afterRowNumber = 1;
    let batchNumber = 0;
    let exportedRows = 0;

    while (true) {
      const rows = await this.repository.listRows(importId, afterRowNumber, EXPORT_BATCH_SIZE);
      if (rows.length === 0) break;

      batchNumber += 1;
      for (const row of rows) {
        afterRowNumber = row.rowNumber;
        exportedRows += 1;
        yield this.toExportRecord(row);
      }

      logger.info('import.export.batch.completed', {
        importId,
        batchNumber,
        batchRows: rows.length,
        exportedRows,
        lastRowNumber: afterRowNumber,
      });

      if (rows.length < EXPORT_BATCH_SIZE) break;
    }

    logger.info('import.export.completed', {
      importId,
      exportedRows,
      batchCount: batchNumber,
    });
  }

  private toExportRecord(row: ImportExportRow): CsvExportRecord {
    return row.rawData;
  }
}

function buildExportFilename(originalFilename: string, importId: string): string {
  const baseName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `export-${importId}-${baseName || 'import.csv'}`;
}
