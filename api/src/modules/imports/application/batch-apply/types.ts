/** Tipos usados na aplicação de um lote validado nas tabelas definitivas. */

import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type { ReadyImportRow } from '../staging/types';

export type BatchCatalogs = {
  cityIds: Map<string, number>;
  brandIds: Map<string, string>;
  fuelIds: Map<string, string>;
  statusIds: Map<string, string>;
  positionIds: Map<string, string>;
};

export type BatchStationResult = {
  rowNumber: number;
  cnpj: string;
  stationId: string;
  status: 'imported' | 'updated';
};

export type BatchRepositoryContext = {
  database: DatabaseClient;
  rows: ReadyImportRow[];
  catalogs: BatchCatalogs;
};

