import { NotFoundError } from '../../shared/errors/NotFoundError';
import { logger } from '../../shared/observability/logger';
import type { CsvExportRecord } from '../../shared/utils/CsvExportUtils';
import type {
  ImportExportRepository,
  ImportExportRow,
  ImportExportRowStatus,
} from '../domain/repositories/ImportExportRepository';

import { normalizeCep } from '../../shared/validation/InputValidation';

const EXPORT_BATCH_SIZE = 500;

export type ImportExportDocument = {
  filename: string;
  rows: AsyncIterable<CsvExportRecord>;
};

export class ExportImport {
  constructor(private readonly repository: ImportExportRepository) {}

  async execute(importId: string, status: ImportExportRowStatus = 'successful'): Promise<ImportExportDocument> {
    const metadata = await this.repository.findMetadata(importId);
    if (!metadata) {
      throw new NotFoundError('IMPORT_NOT_FOUND', 'Importação não encontrada.');
    }

    logger.info('import.export.started', {
      importId,
      filename: metadata.filename,
      status,
      batchSize: EXPORT_BATCH_SIZE,
    });

    return {
      filename: buildExportFilename(metadata.filename, importId, status),
      rows: this.readRows(importId, status),
    };
  }

  private async *readRows(importId: string, status: ImportExportRowStatus): AsyncIterable<CsvExportRecord> {
    let afterRowNumber = 1;
    let batchNumber = 0;
    let exportedRows = 0;

    while (true) {
      const rows = await this.repository.listRows(importId, afterRowNumber, EXPORT_BATCH_SIZE, status);
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
    const record = row.rawData;
    const cep = typeof record.cep === 'string'
      ? record.cep
      : String(record.cep ?? '');

    return { ...record, cep: normalizeCep(cep) };
  }
}

function buildExportFilename(
  originalFilename: string,
  importId: string,
  status: ImportExportRowStatus,
): string {
  const baseName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const prefix = status === 'invalid' ? 'linhas-com-erro' : 'export';
  return `${prefix}-${importId}-${baseName || 'import.csv'}`;
}
