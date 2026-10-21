import { Pool } from 'pg';

import { GetCityByIbgeCode } from '../modules/cities/application/use-cases/GetCityByIbgeCode';
import { ListCities } from '../modules/cities/application/use-cases/ListCities';
import { PostgresCityRepository } from '../modules/cities/infrastructure/postgres/PostgresCityRepository';
import { CityController } from '../modules/cities/presentation/CityController';
import { PostgresDatabaseClient } from '../modules/shared/infrastructure/database/PostgresDatabaseClient';

import { GetResponsibleByCpf } from '../modules/responsibles/application/use-cases/GetResponsibleByCpf';
import { ListResponsibles } from '../modules/responsibles/application/use-cases/ListResponsibles';
import { PostgresResponsibleRepository } from '../modules/responsibles/infrastructure/postgres/PostgresResponsibleRepository';
import { ResponsibleController } from '../modules/responsibles/presentation/ResponsibleController';

import { ExportImport } from '../modules/exports/application/ExportImport';
import { PostgresImportExportRepository } from '../modules/exports/infrastructure/postgres/PostgresImportExportRepository';
import { ExportController } from '../modules/exports/presentation/ExportController';

import { GetImportDetails } from '../modules/import-results/application/GetImportDetails';
import { ListImports } from '../modules/import-results/application/ListImports';
import { ImportResultController } from '../modules/import-results/presentation/ImportResultController';

import { ReceiveImportFile } from '../modules/imports/application/ReceiveImportFile';
import { QueueImportJobPublisher } from '../modules/imports/infrastructure/QueueImportJobPublisher';
import { S3ObjectStorage } from '../modules/imports/infrastructure/S3ObjectStorage';
import { RabbitMqQueue } from '../modules/queue/infrastructure/RabbitMqQueue';

import { ListStations } from '../modules/stations/application/use-cases/ListStations';
import { PostgresStationRepository } from '../modules/stations/infrastructure/postgres/PostgresStationRepository';
import { StationController } from '../modules/stations/presentation/StationController';

import { ExportStations } from '../modules/station-exports/application/ExportStations';
import { PostgresStationExportRepository } from '../modules/station-exports/infrastructure/postgres/PostgresStationExportRepository';
import { StationExportController } from '../modules/station-exports/presentation/StationExportController';

import type { AppConfig } from '../config/env';

export type AppDependencies = {
  pool: Pool;
  database: PostgresDatabaseClient;
  importQueue: RabbitMqQueue;
  importController: ReceiveImportFile;
  maxImportFileSizeBytes: number;
  cityController: CityController;
  responsibleController: ResponsibleController;
  stationController: StationController;
  stationExportController: StationExportController;
  importResultController: ImportResultController;
  exportController: ExportController;
};

export function createDependencies(config: AppConfig): AppDependencies {
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });
  const database = new PostgresDatabaseClient(pool);
  const importQueue = new RabbitMqQueue();

  const cityRepository = new PostgresCityRepository(database);
  const responsibleRepository = new PostgresResponsibleRepository(database);
  const stationRepository = new PostgresStationRepository(database);

  return {
    pool,
    database,
    importQueue,
    importController: new ReceiveImportFile(
      database,
      new S3ObjectStorage(config.storageBucket),
      config.storageBucket,
      new QueueImportJobPublisher(importQueue),
      config.maxImportFileSizeBytes,
    ),
    maxImportFileSizeBytes: config.maxImportFileSizeBytes,
    cityController: new CityController(
      new ListCities(cityRepository),
      new GetCityByIbgeCode(cityRepository),
    ),
    responsibleController: new ResponsibleController(
      new ListResponsibles(responsibleRepository),
      new GetResponsibleByCpf(responsibleRepository),
    ),
    stationController: new StationController(
      new ListStations(stationRepository),
    ),
    stationExportController: new StationExportController(
      new ExportStations(new PostgresStationExportRepository(database)),
    ),
    importResultController: new ImportResultController(
      new ListImports(database),
      new GetImportDetails(database),
    ),
    exportController: new ExportController(
      new ExportImport(new PostgresImportExportRepository(database)),
    ),
  };
}
