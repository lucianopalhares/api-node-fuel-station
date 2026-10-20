import express from 'express';
import { Pool } from 'pg';

import { AppError } from './modules/shared/errors/AppError';
import { errorHandler } from './modules/shared/errors/errorHandler';

import { ImportCsv } from './modules/imports/application/ImportCsv';
import { S3ObjectStorage } from './modules/imports/infrastructure/S3ObjectStorage';
import { createImportRouter } from './modules/imports/presentation/importRoutes';

import { GetCityByIbgeCode } from './modules/cities/application/use-cases/GetCityByIbgeCode';
import { ListCities } from './modules/cities/application/use-cases/ListCities';
import { PostgresCityRepository } from './modules/cities/infrastructure/postgres/PostgresCityRepository';
import { PostgresDatabaseClient } from './modules/cities/infrastructure/postgres/PostgresDatabaseClient';
import { CityController } from './modules/cities/presentation/CityController';
import { createCityRouter } from './modules/cities/presentation/cityRoutes';

import { GetResponsibleByCpf } from './modules/responsibles/application/use-cases/GetResponsibleByCpf';
import { ListResponsibles } from './modules/responsibles/application/use-cases/ListResponsibles';
import { PostgresResponsibleRepository } from './modules/responsibles/infrastructure/postgres/PostgresResponsibleRepository';
import { ResponsibleController } from './modules/responsibles/presentation/ResponsibleController';
import { createResponsibleRouter } from './modules/responsibles/presentation/responsibleRoutes';

import { ListStations } from './modules/stations/application/use-cases/ListStations';
import { PostgresStationRepository } from './modules/stations/infrastructure/postgres/PostgresStationRepository';
import { StationController } from './modules/stations/presentation/StationController';
import { createStationRouter } from './modules/stations/presentation/stationRoutes';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'ipdv',
  user: process.env.DB_USER ?? 'ipdv',
  password: process.env.DB_PASSWORD ?? 'ipdv',
});

const database = new PostgresDatabaseClient(pool);

const storageBucket = process.env.STORAGE_BUCKET ?? 'imports';

const importController = new ImportCsv(
  database,
  new S3ObjectStorage(storageBucket),
  storageBucket,
);
app.use('/imports', createImportRouter(importController));

const cityRepository = new PostgresCityRepository(database);
const cityController = new CityController(
  new ListCities(cityRepository),
  new GetCityByIbgeCode(cityRepository)
);
app.use('/cities', createCityRouter(cityController));

const responsibleRepository = new PostgresResponsibleRepository(database);
const responsibleController = new ResponsibleController(
  new ListResponsibles(responsibleRepository),
  new GetResponsibleByCpf(responsibleRepository),
);
app.use('/responsibles', createResponsibleRouter(responsibleController));

const stationRepository = new PostgresStationRepository(database);
const stationController = new StationController(
  new ListStations(stationRepository),
);
app.use('/stations', createStationRouter(stationController));

app.get('/health', async (_request, response) => {
  try {
    await database.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'ok' });
  } catch {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use((_request, _response, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'A rota solicitada não existe.'));
});

app.use(errorHandler);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`API listening on port ${port}`);
});

const shutdown = () => {
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
