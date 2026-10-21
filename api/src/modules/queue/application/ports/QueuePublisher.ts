// contrato para publicar mensagens em uma fila.

export interface QueuePublisher {
  publish<T>(queueName: string, message: T): Promise<void>;
}
