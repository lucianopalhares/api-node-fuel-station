/** atualiza o resumo final da importação depois que todos os lotes terminam. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ImportSummaryRepository } from '../../domain/repositories/ImportSummaryRepository';

export class ImportFinalizer {
  constructor(
    private readonly database: DatabaseClient,
    private readonly summaries: ImportSummaryRepository,
  ) {}

  async markProcessing(importId: string): Promise<void> {
    await this.summaries.markProcessing(this.database, importId);
  }

  async complete(importId: string): Promise<void> {
    await this.summaries.complete(this.database, importId);
  }

  async fail(importId: string, reason: string): Promise<void> {
    await this.summaries.fail(this.database, importId, reason);
  }
}

