// contrato de storage usada pela importação.

import type { Readable } from 'node:stream';

export interface ImportFileStorage {
  put(key: string, body: Readable, contentType: string): Promise<void>;
  get(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
}
