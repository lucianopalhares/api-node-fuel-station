// Arquivo novo: /home/dev/dev/desafios/ipdv/api/src/modules/imports/application/ports/ImportQueue.ts
// Operação: criar.
// Motivo: definir a porta de aplicação que desacopla os casos de uso do broker escolhido.

export type ImportJob = {
  importId: string;
  storageKey: string;
};

export interface ImportQueue {
  publish(job: ImportJob): Promise<void>;
}
