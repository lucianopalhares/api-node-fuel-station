import express from 'express';
import { Pool } from 'pg';

import { GetCityByIbgeCode } from './modules/cities/application/use-cases/GetCityByIbgeCode';
import { ListCities } from './modules/cities/application/use-cases/ListCities';
import { PostgresCityRepository } from './modules/cities/infrastructure/postgres/PostgresCityRepository';
import { PostgresDatabaseClient } from './modules/cities/infrastructure/postgres/PostgresDatabaseClient';
import { CityController } from './modules/cities/presentation/CityController';
import { createCityRouter } from './modules/cities/presentation/cityRoutes';

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
const cityRepository = new PostgresCityRepository(database);
const cityController = new CityController(new ListCities(cityRepository), new GetCityByIbgeCode(cityRepository));
app.use('/cities', createCityRouter(cityController));

app.get('/health', async (_request, response) => {
  try {
    await database.query('SELECT 1');
    response.status(200).json({ status: 'ok', database: 'ok' });
  } catch {
    response.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

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
