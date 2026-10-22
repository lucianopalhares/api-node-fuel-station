/** Contrato para criar ou atualizar responsáveis de um lote. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ReadyImportRow } from '../../application/staging/types';
import type { BatchCatalogs } from '../../application/batch-apply/types';

export interface ResponsibleBatchRepository {
  upsert(database: DatabaseClient, rows: ReadyImportRow[], catalogs: BatchCatalogs): Promise<Map<string, string>>;
}

