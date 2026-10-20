import { createHash, randomUUID } from 'node:crypto';
import { Transform, TransformCallback } from 'node:stream';

export class DigestTransform extends Transform {
  private readonly hash = createHash('sha256');
  private total = 0;

  get size(): number { return this.total; }
  get checksum(): string { return this.hash.digest('hex'); }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.total += chunk.length;
    this.hash.update(chunk);
    this.push(chunk);
    callback();
  }
}

export function createImportStorageKey(importId: string): string {
  return `imports/${importId}-${randomUUID()}.csv`;
}
