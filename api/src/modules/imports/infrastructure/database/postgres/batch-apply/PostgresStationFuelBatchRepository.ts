/** Substitui os vínculos de combustíveis dos postos usando inserts agrupados. */

import type { DatabaseClient } from '../../../../../shared/infrastructure/database/DatabaseClient';
import type { StationFuelBatchRepository } from '../../../../domain/repositories/StationFuelBatchRepository';
import type { ReadyImportRow } from '../../../../application/staging/types';
import type { BatchCatalogs, BatchStationResult } from '../../../../application/batch-apply/types';

export class PostgresStationFuelBatchRepository implements StationFuelBatchRepository {
  async replace(database: DatabaseClient, rows: ReadyImportRow[], stations: BatchStationResult[], catalogs: BatchCatalogs): Promise<void> {
    const stationIds = stations.map((station) => station.stationId);
    await database.query('DELETE FROM station_fuels WHERE station_id = ANY($1::BIGINT[])', [stationIds]);

    const effectiveRows = [...new Map(rows.map((row) => [row.normalizedData.cnpj, row])).values()];
    const stationByCnpj = new Map(stations.map((station) => [station.cnpj, station.stationId]));
    const values: unknown[] = [];
    const pairs = effectiveRows.flatMap((row) => this.fuels(row).map((fuel) => ({ stationId: stationByCnpj.get(row.normalizedData.cnpj)!, fuelId: catalogs.fuelIds.get(normalizeName(fuel))! })));
    if (!pairs.length) return;

    const placeholders = pairs.map((pair, index) => {
      const offset = index * 2;
      values.push(pair.stationId, pair.fuelId);
      return `($${offset + 1}, $${offset + 2})`;
    });
    await database.query(
      `INSERT INTO station_fuels (station_id, fuel_id) VALUES ${placeholders.join(',')} ON CONFLICT DO NOTHING`,
      values,
    );
  }

  private fuels(row: ReadyImportRow): string[] {
    return row.normalizedData.combustiveis.split(',').map((fuel) => fuel.trim()).filter(Boolean);
  }
}

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

