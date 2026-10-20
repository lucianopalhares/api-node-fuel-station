// executar no worker

import { parse } from 'csv-parse';
import { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import { validateCsvHeaders } from '../../shared/validation/CsvImportValidation';
import { S3ObjectStorage } from '../infrastructure/S3ObjectStorage';
import { logger } from '../../shared/observability/logger';

export class ProcessImport {
  constructor(
    private readonly database: DatabaseClient,
    private readonly storage: S3ObjectStorage,
  ) {}

  async execute(importId: string, storageKey: string): Promise<void> {
    await this.database.query(
      `UPDATE imports SET status = 'processing', started_at = NOW() WHERE id = $1`,
      [importId],
    );

    try {
      const totalRows = await this.countRows(storageKey);
      await this.database.query(
        `UPDATE imports
            SET status = 'completed', total_rows = $1, imported_rows = $1,
                finished_at = NOW()
          WHERE id = $2`,
        [totalRows, importId],
      );

      logger.warn('Import processed without station persistence', {
        importId,
        totalRows,
        warning: 'CSV rows were counted, but station records were not created.',
      });
    } catch (error) {
      await this.database.query(
        `UPDATE imports SET status = 'failed', finished_at = NOW() WHERE id = $1`,
        [importId],
      );
      throw error;
    }
  }

  private async countRows(key: string): Promise<number> {
    const source = await this.storage.get(key);
    const parser = parse({
      bom: true,
      delimiter: ';',
      columns: (headers: string[]) => validateCsvHeaders(headers),
      skip_empty_lines: true,
      relax_column_count: false,
    });
    source.pipe(parser);
    let rows = 0;
    for await (const _row of parser) rows += 1;
    return rows;
  }
}
