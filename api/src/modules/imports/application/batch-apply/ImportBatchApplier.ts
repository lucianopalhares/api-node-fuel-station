/** pega em lote de 500 as linhas prontas pra serem salvas */

import type { ImportStagingRepository } from '../../domain/repositories/ImportStagingRepository';
import type { CatalogBatchRepository } from '../../domain/repositories/CatalogBatchRepository';
import type { ResponsibleBatchRepository } from '../../domain/repositories/ResponsibleBatchRepository';
import type { StationBatchRepository } from '../../domain/repositories/StationBatchRepository';
import type { StationFuelBatchRepository } from '../../domain/repositories/StationFuelBatchRepository';
import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ReadyImportRow } from '../staging/types';

const DEFAULT_BATCH_SIZE = 500;

export class ImportBatchApplier {
  constructor(
    private readonly database: DatabaseClient,
    private readonly staging: ImportStagingRepository,
    private readonly catalogs: CatalogBatchRepository,
    private readonly responsibles: ResponsibleBatchRepository,
    private readonly stations: StationBatchRepository,
    private readonly stationFuels: StationFuelBatchRepository,
    private readonly batchSize = DEFAULT_BATCH_SIZE,
  ) {}

  async execute(importId: string): Promise<{ importedRows: number; updatedRows: number; invalidRows: number }> {
    let afterRowNumber = 1;
    let importedRows = 0;
    let updatedRows = 0;
    let invalidRows = 0;

    while (true) {
      const rows = await this.staging.listReadyBatch(importId, afterRowNumber, this.batchSize);
      if (!rows.length) break;
      afterRowNumber = rows[rows.length - 1].rowNumber;

      const result = await this.applyBatch(importId, rows);
      importedRows += result.importedRows;
      updatedRows += result.updatedRows;
      invalidRows += result.invalidRows;
    }

    return { importedRows, updatedRows, invalidRows };
  }

  private async applyBatch(importId: string, rows: ReadyImportRow[]): Promise<{ importedRows: number; updatedRows: number; invalidRows: number }> {
    return this.database.transaction(async (database) => {
      const catalogs = await this.catalogs.resolve(database, rows);
      const applicable = rows.filter((row) => this.hasRequiredCatalogs(row, catalogs));
      const rejected = rows.filter((row) => !applicable.includes(row));

      if (rejected.length) {
        await this.staging.markInvalid(database, importId, rejected.map((row) => ({
          rowNumber: row.rowNumber,
          errors: [{ field: 'catalog', message: 'Cidade, bandeira, combustível, cargo ou status não encontrado.' }],
        })));
      }
      if (!applicable.length) return { importedRows: 0, updatedRows: 0, invalidRows: rejected.length };

      const responsibleIds = await this.responsibles.upsert(database, applicable, catalogs);
      const stations = await this.stations.upsert(database, applicable, catalogs, responsibleIds);
      await this.stationFuels.replace(database, applicable, stations, catalogs);
      await this.staging.markApplied(database, importId, stations);

      return {
        importedRows: stations.filter((station) => station.status === 'imported').length,
        updatedRows: stations.filter((station) => station.status === 'updated').length,
        invalidRows: rejected.length,
      };
    });
  }

  private hasRequiredCatalogs(row: ReadyImportRow, catalogs: { cityIds: Map<string, number>; brandIds: Map<string, string>; fuelIds: Map<string, string>; statusIds: Map<string, string>; positionIds: Map<string, string> }): boolean {
    const data = row.normalizedData;
    const cityKey = `${normalizeName(data.municipio)}|${data.uf}`;
    const fuels = data.combustiveis.split(',').map((fuel) => normalizeName(fuel));
    return Boolean(
      catalogs.cityIds.has(cityKey)
      && catalogs.brandIds.has(normalizeName(data.bandeira))
      && catalogs.statusIds.has(normalizeStatus(data.status))
      && catalogs.positionIds.has(normalizeName(data.cargo_responsavel))
      && fuels.every((fuel) => catalogs.fuelIds.has(fuel)),
    );
  }
}

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeStatus(value: string): string {
  const normalized = normalizeName(value);
  return normalized === 'manutencao' ? 'em manutencao' : normalized;
}

