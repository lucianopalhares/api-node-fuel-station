import type { Request, Response } from 'express';
import { once } from 'node:events';
import { logger } from '../../shared/observability/logger';
import { createCsvHeader, serializeCsvRecord } from '../../shared/utils/CsvExportUtils';
import { ExportImport } from '../application/ExportImport';
import type { ImportExportRowStatus } from '../domain/repositories/ImportExportRepository';
import { ValidationError } from '../../shared/errors/ValidationError';

export class ExportController {
  constructor(private readonly exportImport: ExportImport) {}

  async download(
    request: Request,
    response: Response,
    status: ImportExportRowStatus = 'successful',
  ): Promise<void> {
    const rawImportId = request.params.importId;
    if (typeof rawImportId !== 'string') {
      throw new ValidationError(
        'INVALID_IMPORT_ID',
        'O identificador da importação é inválido.',
        { field: 'importId' },
      );
    }
    const importId = rawImportId;
    const document = await this.exportImport.execute(importId, status);

    let exportedRows = 0;
    let bytesWritten = 0;
    const startedAt = Date.now();

    response.status(200);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);

    try {
      bytesWritten += await this.writeChunk(response, createCsvHeader());
      for await (const row of document.rows) {
        const chunk = serializeCsvRecord(row);
        bytesWritten += await this.writeChunk(response, chunk);
        exportedRows += 1;
      }
      response.end();
      logger.info('import.export.response.completed', {
        importId,
        exportedRows,
        bytesWritten,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      logger.error('import.export.response.failed', {
        importId,
        exportedRows,
        bytesWritten,
        durationMs: Date.now() - startedAt,
        error,
      });
      if (!response.headersSent) throw error;
      response.destroy(error instanceof Error ? error : undefined);
    }
  }

  private async writeChunk(response: Response, chunk: string): Promise<number> {
    if (response.write(chunk)) return Buffer.byteLength(chunk, 'utf8');
    await once(response, 'drain');
    return Buffer.byteLength(chunk, 'utf8');
  }
}
