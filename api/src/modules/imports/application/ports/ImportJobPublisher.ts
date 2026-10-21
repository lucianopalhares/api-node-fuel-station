// contrato que o caso de uso de importação precisa.

export type ImportJob = {
  importId: string;
  storageKey: string;
};

export interface ImportJobPublisher {
  publish(job: ImportJob): Promise<void>;
}
