// consumir a fila de importações em um processo separado da API.

import { Pool } from 'pg';
import { logger } from './modules/shared/observability/logger';
import { PostgresDatabaseClient } from './modules/shared/infrastructure/database/PostgresDatabaseClient';
import { S3ObjectStorage } from './modules/imports/infrastructure/S3ObjectStorage';
import { ProcessImport } from './modules/imports/application/ProcessImport';
import type { ImportJob } from './modules/imports/application/ports/ImportJobPublisher';
import { RabbitMqQueue } from './modules/queue/infrastructure/RabbitMqQueue';

async function main(): Promise<void> {
  const queueName = process.env.RABBITMQ_IMPORT_QUEUE ?? 'imports';
  const rabbitUrl = process.env.RABBITMQ_URL ?? 'amqp://ipdv:ipdv@localhost:5672';
  const bucket = process.env.STORAGE_BUCKET ?? 'imports';
  const pool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'ipdv',
    user: process.env.DB_USER ?? 'ipdv',
    password: process.env.DB_PASSWORD ?? 'ipdv',
  });

  const database = new PostgresDatabaseClient(pool);
  const processor = new ProcessImport(database, new S3ObjectStorage(bucket));
  const queue = new RabbitMqQueue(rabbitUrl);

  logger.info('Import worker started', { queue: queueName });
  await queue.consume<ImportJob>(queueName, async (job) => {
    logger.info('Import job started', { importId: job.importId });
    await processor.execute(job.importId, job.storageKey);
    logger.info('Import job completed', { importId: job.importId });
  });

  const shutdown = async () => {
    await queue.close();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void main().catch((error) => {
  logger.error('Import worker could not start', { error });
  process.exit(1);
});
