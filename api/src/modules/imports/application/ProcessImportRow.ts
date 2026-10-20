import { logger } from '../../shared/observability/logger';
import { RowError, StationImportPersister, type CsvStationRow, type PersistedRow } from './StationImportPersister';

export class ProcessImportRow {
  constructor(private readonly persister: StationImportPersister) {}

  async execute(importId: string, rowNumber: number, row: CsvStationRow): Promise<PersistedRow> {
    const startedAt = Date.now();
    try {
      const result = await this.persister.persist(importId, rowNumber, row);
      logger.info('import.row.persisted', {
        importId,
        rowNumber,
        stationId: result.stationId,
        operation: result.status,
        durationMs: Date.now() - startedAt,
      });
      return result;
    } catch (error) {
      logger.warn('import.row.invalid', {
        importId,
        rowNumber,
        field: error instanceof RowError ? error.field : 'row',
        message: error instanceof Error ? error.message : 'Erro ao persistir a linha.',
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }
}
