/** Contrato para criar ou atualizar postos a partir de um lote. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ReadyImportRow } from '../../application/staging/types';
import type { BatchCatalogs, BatchStationResult } from '../../application/batch-apply/types';

export interface StationBatchRepository {
  upsert(
    database: DatabaseClient,
    rows: ReadyImportRow[],
    catalogs: BatchCatalogs,
    responsibleIds: Map<string, string>,
  ): Promise<BatchStationResult[]>;
}

