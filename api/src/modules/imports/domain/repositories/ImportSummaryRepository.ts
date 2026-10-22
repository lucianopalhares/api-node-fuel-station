/** Contrato para atualizar o ciclo de vida e o resumo da importação. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';

export interface ImportSummaryRepository {
  markProcessing(database: DatabaseClient, importId: string): Promise<void>;
  complete(database: DatabaseClient, importId: string): Promise<void>;
  fail(database: DatabaseClient, importId: string, reason: string): Promise<void>;
}

