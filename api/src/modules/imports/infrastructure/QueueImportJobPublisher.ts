// adapta o contrato de importação para a fila.

import type { QueuePublisher } from '../../queue/application/ports/QueuePublisher';
import type { ImportJob, ImportJobPublisher } from '../application/ports/ImportJobPublisher';

export class QueueImportJobPublisher implements ImportJobPublisher {
  constructor(
    private readonly queue: QueuePublisher,
    private readonly queueName = process.env.RABBITMQ_IMPORT_QUEUE ?? 'imports',
  ) {}

  publish(job: ImportJob): Promise<void> {
    return this.queue.publish(this.queueName, job);
  }
}
