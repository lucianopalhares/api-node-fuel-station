// RabbitMQ conhece apenas transporte e ciclo de vida da mensagem.

import amqp, { type Channel, type ChannelModel, type ConfirmChannel } from 'amqplib';
import { logger } from '../../shared/observability/logger';
import type { QueueConsumer } from '../application/ports/QueueConsumer';
import type { QueuePublisher } from '../application/ports/QueuePublisher';

export class RabbitMqQueue implements QueuePublisher, QueueConsumer {
  private connection?: ChannelModel;
  private publisherChannel?: ConfirmChannel;
  private consumerChannel?: Channel;

  constructor(
    private readonly url = process.env.RABBITMQ_URL ?? 'amqp://ipdv:ipdv@localhost:5672',
  ) {}

  async publish<T>(queueName: string, message: T): Promise<void> {
    const channel = await this.getPublisherChannel();
    await this.assertQueue(channel, queueName);
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
      contentType: 'application/json',
    });
    await channel.waitForConfirms();
  }

  async consume<T>(queueName: string, handler: (message: T) => Promise<void>): Promise<void> {
    const channel = await this.getConsumerChannel();
    await this.assertQueue(channel, queueName);
    await channel.prefetch(1);

    await channel.consume(queueName, async (message) => {
      if (!message) return;

      try {
        const payload = JSON.parse(message.content.toString()) as T;
        await handler(payload);
        channel.ack(message);
      } catch (error) {
        logger.error('queue.message.failed', { queueName, error });
        channel.nack(message, false, false);
      }
    });
  }

  async close(): Promise<void> {
    await this.publisherChannel?.close();
    await this.consumerChannel?.close();
    await this.connection?.close();
  }

  private async getPublisherChannel(): Promise<ConfirmChannel> {
    if (this.publisherChannel) return this.publisherChannel;

    const connection = await this.getConnection();
    this.publisherChannel = await connection.createConfirmChannel();
    return this.publisherChannel;
  }

  private async getConsumerChannel(): Promise<Channel> {
    if (this.consumerChannel) return this.consumerChannel;

    const connection = await this.getConnection();
    this.consumerChannel = await connection.createChannel();
    return this.consumerChannel;
  }

  private async getConnection(): Promise<ChannelModel> {
    if (this.connection) return this.connection;
    this.connection = await amqp.connect(this.url);
    return this.connection;
  }

  private async assertQueue(channel: Channel | ConfirmChannel, queueName: string): Promise<void> {
    await channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': `${queueName}.dlq`,
      },
    });
    await channel.assertQueue(`${queueName}.dlq`, { durable: true });
  }
}
