/** Monta o pipeline de staging e aplicação em lote usado pelo worker de importação. */

import type { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import type { ImportFileStorage } from '../application/ports/ImportFileStorage';
import { CsvImportReader } from '../application/CsvImportReader';
import { ProcessImport } from '../application/ProcessImport';
import { CsvImportStager } from '../application/staging/CsvImportStager';
import { ImportBatchApplier } from '../application/batch-apply/ImportBatchApplier';
import { ImportFinalizer } from '../application/finalization/ImportFinalizer';
import { PostgresImportStagingRepository } from './database/postgres/staging/PostgresImportStagingRepository';
import { PostgresCatalogBatchRepository } from './database/postgres/batch-apply/PostgresCatalogBatchRepository';
import { PostgresResponsibleBatchRepository } from './database/postgres/batch-apply/PostgresResponsibleBatchRepository';
import { PostgresStationBatchRepository } from './database/postgres/batch-apply/PostgresStationBatchRepository';
import { PostgresStationFuelBatchRepository } from './database/postgres/batch-apply/PostgresStationFuelBatchRepository';
import { PostgresImportSummaryRepository } from './database/postgres/finalization/PostgresImportSummaryRepository';

export function createBatchImportProcessor(database: DatabaseClient, storage: ImportFileStorage): ProcessImport {
  const stagingRepository = new PostgresImportStagingRepository(database);
  const stager = new CsvImportStager(new CsvImportReader(storage), stagingRepository);
  const applier = new ImportBatchApplier(
    database,
    stagingRepository,
    new PostgresCatalogBatchRepository(),
    new PostgresResponsibleBatchRepository(),
    new PostgresStationBatchRepository(),
    new PostgresStationFuelBatchRepository(),
  );
  const finalizer = new ImportFinalizer(database, new PostgresImportSummaryRepository());
  return new ProcessImport(stager, applier, finalizer);
}

