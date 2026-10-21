// publicar tarefas para o worker de importação.

import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';
import type { ImportJob, ImportQueue } from '../application/ports/ImportQueue';

export class RabbitMqImportQueue implements ImportQueue {
  private connection?: ChannelModel;
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

    const connection = await amqp.connect(this.url);
    const channel = await connection.createConfirmChannel();
    this.connection = connection;
    this.channel = channel;
    await channel.assertQueue(this.queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': `${this.queueName}.dlq`,
      },
    });
    await channel.assertQueue(`${this.queueName}.dlq`, { durable: true });
    return channel;
  }
}
