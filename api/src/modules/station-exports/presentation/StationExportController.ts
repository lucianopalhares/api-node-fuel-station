import type { Request, Response } from 'express';
import { once } from 'node:events';
import { createCsvHeader, serializeCsvRecord } from '../../shared/utils/CsvExportUtils';
import { parseOptionalInteger } from '../../shared/validation/InputValidation';
import { ValidationError } from '../../shared/errors/ValidationError';
import { ExportStations, stationExportLimits } from '../application/ExportStations';

export class StationExportController {
  constructor(private readonly exportStations: ExportStations) {}

  async download(request: Request, response: Response): Promise<void> {
    const hasLimit = request.query.limit !== undefined && request.query.limit !== '';
    const limit = parseOptionalInteger(request.query.limit);

    if (hasLimit && (limit === undefined || limit < 1)) {
      throw new ValidationError(
        'INVALID_LIMIT',
        'O limite deve ser um número inteiro maior que zero.',
        { field: 'limit' },
      );
    }

    const document = this.exportStations.execute({
      limit: Math.min(limit ?? stationExportLimits.default, stationExportLimits.maximum),
    });

    response.status(200);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    await this.writeCsv(response, document.rows);
  }

  private async writeCsv(response: Response, rows: AsyncIterable<Record<string, unknown>>): Promise<void> {
    await this.writeChunk(response, createCsvHeader());
    for await (const row of rows) {
      await this.writeChunk(response, serializeCsvRecord(row));
    }
    response.end();
  }

  private async writeChunk(response: Response, chunk: string): Promise<void> {
    if (response.write(chunk)) return;
    await once(response, 'drain');
  }
}
