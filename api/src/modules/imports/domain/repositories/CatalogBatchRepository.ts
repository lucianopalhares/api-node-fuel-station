/** Contrato para resolver cidades e catálogos distintos de um lote. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ReadyImportRow } from '../../application/staging/types';
import type { BatchCatalogs } from '../../application/batch-apply/types';

export interface CatalogBatchRepository {
  resolve(database: DatabaseClient, rows: ReadyImportRow[]): Promise<BatchCatalogs>;
}

