/** orquestra staging, aplicação em lotes e fechamento do processamento da importação. */

import { logger } from '../../shared/observability/logger';
import type { CsvImportStager } from './staging/CsvImportStager';
import type { ImportBatchApplier } from './batch-apply/ImportBatchApplier';
import type { ImportFinalizer } from './finalization/ImportFinalizer';

export class ProcessImport {
  constructor(
    private readonly stager: CsvImportStager,
    private readonly applier: ImportBatchApplier,
    private readonly finalizer: ImportFinalizer,
  ) {}

  async execute(importId: string, storageKey: string): Promise<void> {
    const startedAt = Date.now();
    await this.finalizer.markProcessing(importId);
    logger.info('import.processing.started', { importId, storageKey });

    try {
      const staged = await this.stager.execute(importId, storageKey);
      const applied = await this.applier.execute(importId);
      await this.finalizer.complete(importId);
      logger.info('import.processing.completed', {
        importId,
        ...staged,
        ...applied,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      logger.error('import.processing.failed', {
        importId,
        storageKey,
        durationMs: Date.now() - startedAt,
        error,
      });
      await this.finalizer.fail(importId, 'Falha durante o processamento do arquivo.');
      throw error;
    }
  }
}

