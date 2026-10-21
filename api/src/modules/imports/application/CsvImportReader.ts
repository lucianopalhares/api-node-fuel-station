// concentrar a leitura, configuração do parser e validação do header.

import { parse } from 'csv-parse';
import type { Readable } from 'node:stream';
import { validateCsvHeaders } from '../../shared/validation/CsvImportValidation';
import { logger } from '../../shared/observability/logger';
import type { ImportFileStorage } from './ports/ImportFileStorage';
import type { CsvStationRow } from './StationImportPersister';

export class CsvImportReader {
  constructor(private readonly storage: ImportFileStorage) {}

  async read(storageKey: string, importId: string): Promise<AsyncIterable<CsvStationRow>> {
    const source = await this.storage.get(storageKey);
    const parser = parse({
      bom: true,
      delimiter: ';',
      columns: (headers: string[]) => {
        const validated = validateCsvHeaders(headers);
        logger.info('import.csv.headers.validated', {
          importId,
          columnCount: headers.length,
          columns: headers,
        });
        return validated;
      },
      skip_empty_lines: true,
      relax_column_count: false,
    });

    source.pipe(parser);
    logger.info('import.csv.reader.started', { importId, storageKey });
    return parser as AsyncIterable<CsvStationRow>;
  }
}
