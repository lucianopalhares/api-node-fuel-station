// contrato para consumir mensagens de uma fila.

export interface QueueConsumer {
  consume<T>(queueName: string, handler: (message: T) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}
