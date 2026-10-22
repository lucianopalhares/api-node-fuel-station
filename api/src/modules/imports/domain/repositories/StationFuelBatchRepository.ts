/** Contrato para substituir, em lote, os combustíveis vinculados aos postos. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ReadyImportRow } from '../../application/staging/types';
import type { BatchCatalogs, BatchStationResult } from '../../application/batch-apply/types';

export interface StationFuelBatchRepository {
  replace(
    database: DatabaseClient,
    rows: ReadyImportRow[],
    stations: BatchStationResult[],
    catalogs: BatchCatalogs,
  ): Promise<void>;
}

