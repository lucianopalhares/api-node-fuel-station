/** lê o CSV em streaming, valida as linhas e grava o staging em lotes e 1000 linhas. */

import type { CsvImportReader } from '../CsvImportReader';
import { ImportRowValidator } from './ImportRowValidator';
import type { ImportStagingRepository } from '../../domain/repositories/ImportStagingRepository';
import type { CsvStationRow, StagingRow } from './types';

const DEFAULT_BATCH_SIZE = 1_000;

export class CsvImportStager {
  constructor(
    private readonly reader: CsvImportReader,
    private readonly staging: ImportStagingRepository,
    private readonly validator = new ImportRowValidator(),
    private readonly batchSize = DEFAULT_BATCH_SIZE,
  ) {}

  async execute(importId: string, storageKey: string): Promise<{ totalRows: number; invalidRows: number }> {
    const rows = await this.reader.read(storageKey, importId);
    const batch: StagingRow[] = [];
    let totalRows = 0;
    let invalidRows = 0;

    for await (const raw of rows as AsyncIterable<CsvStationRow>) {
      totalRows += 1;
      const result = this.validator.validate(raw);
      if ('errors' in result) invalidRows += 1;
      batch.push({
        importId,
        rowNumber: totalRows + 1,
        rawData: raw,
        normalizedData: 'normalized' in result ? result.normalized : null,
        status: 'errors' in result ? 'invalid' : 'ready',
        errors: 'errors' in result ? result.errors : [],
      });

      if (batch.length >= this.batchSize) {
        await this.staging.insertBatch(batch.splice(0));
      }
    }

    if (batch.length) await this.staging.insertBatch(batch);
    return { totalRows, invalidRows };
  }
}

