// consumir a fila de importações em um processo separado da API.

import { Pool } from 'pg';
import amqp from 'amqplib';
import { logger } from './modules/shared/observability/logger';
import { PostgresDatabaseClient } from './modules/shared/infrastructure/database/PostgresDatabaseClient';
import { S3ObjectStorage } from './modules/imports/infrastructure/S3ObjectStorage';
import { ProcessImport } from './modules/imports/application/ProcessImport';

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
  const connection = await amqp.connect(rabbitUrl);
  const channel = await connection.createChannel();
  await channel.assertQueue(queueName, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': `${queueName}.dlq`,
    },
  });
  await channel.assertQueue(`${queueName}.dlq`, { durable: true });
  await channel.prefetch(1);

  logger.info('Import worker started', { queue: queueName });

  await channel.consume(queueName, async (message) => {
    if (!message) return;

    try {
      const job = JSON.parse(message.content.toString()) as { importId: string; storageKey: string };
      logger.info('Import job started', { importId: job.importId });
      await processor.execute(job.importId, job.storageKey);
      channel.ack(message);
      logger.info('Import job completed', { importId: job.importId });
    } catch (error) {
      logger.error('Import job failed; sending to dead-letter queue', { error });
      channel.nack(message, false, false);
    }
  });

  const shutdown = async () => {
    await channel.close();
    await connection.close();
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
