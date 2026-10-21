import { createApp } from './app';
import { loadConfig } from './config/env';
import { createDependencies } from './infrastructure/dependencies';
import { logger } from './modules/shared/observability/logger';

const config = loadConfig();
const dependencies = createDependencies(config);
const app = createApp(dependencies);

const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info('API listening', { port: config.port });
});

let isShuttingDown = false;

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info('API shutting down');

  server.close(() => {
    void dependencies.importQueue.close().finally(() =>
      dependencies.pool.end().finally(() => process.exit(0)),
    );
  });
};

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  shutdown();
});
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  shutdown();
});
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
