// publicar tarefas para o worker de importação.

import amqp, { type ConfirmChannel, type Connection } from 'amqplib';
import type { ImportJob, ImportQueue } from '../application/ports/ImportQueue';

export class RabbitMqImportQueue implements ImportQueue {
  private connection?: Connection;
  private channel?: ConfirmChannel;

  constructor(
    private readonly url = process.env.RABBITMQ_URL ?? 'amqp://ipdv:ipdv@localhost:5672',
    private readonly queueName = process.env.RABBITMQ_IMPORT_QUEUE ?? 'imports',
  ) {}

  async publish(job: ImportJob): Promise<void> {
    const channel = await this.getChannel();
    channel.sendToQueue(this.queueName, Buffer.from(JSON.stringify(job)), {
      persistent: true,
      contentType: 'application/json',
    });
    await channel.waitForConfirms();
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) return this.channel;

    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createConfirmChannel();
    await this.channel.assertQueue(this.queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': `${this.queueName}.dlq`,
      },
    });
    await this.channel.assertQueue(`${this.queueName}.dlq`, { durable: true });
    return this.channel;
  }
}
