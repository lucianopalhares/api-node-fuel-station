import express from 'express';

import type { AppDependencies } from './infrastructure/dependencies';
import { AppError } from './modules/shared/errors/AppError';
import { errorHandler } from './modules/shared/errors/errorHandler';
import { logger } from './modules/shared/observability/logger';
import { registerRoutes } from './routes';

export function createApp(dependencies: AppDependencies): express.Express {
  const app = express();

  app.use((request, response, next) => {
    const startedAt = Date.now();
    response.on('finish', () => logger.info('HTTP request completed', {
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    }));
    next();
  });

  registerRoutes(app, dependencies);

  app.get('/health', async (_request, response) => {
    try {
      await dependencies.database.query('SELECT 1');
      response.status(200).json({ status: 'ok', database: 'ok' });
    } catch {
      response.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  app.use((_request, _response, next) => {
    next(new AppError(404, 'ROUTE_NOT_FOUND', 'A rota solicitada não existe.'));
  });

  app.use(errorHandler);

  return app;
}
