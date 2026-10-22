/** Contrato para armazenar, consultar e atualizar linhas da área de staging. */

import type { ReadyImportRow, StagingRow } from '../../application/staging/types';
import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';

export interface ImportStagingRepository {
  insertBatch(rows: StagingRow[]): Promise<void>;
  listReadyBatch(importId: string, afterRowNumber: number, limit: number): Promise<ReadyImportRow[]>;
  markInvalid(database: DatabaseClient, importId: string, rows: Array<{ rowNumber: number; errors: Array<{ field: string; message: string }> }>): Promise<void>;
  markApplied(database: DatabaseClient, importId: string, rows: Array<{ rowNumber: number; stationId: string; status: 'imported' | 'updated' }>): Promise<void>;
}

