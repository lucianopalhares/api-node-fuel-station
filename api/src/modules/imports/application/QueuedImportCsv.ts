// armazenar o upload e enfileirar 

import type { Readable } from 'node:stream';
import { normalizeRequiredText } from '../../shared/validation/InputValidation';
import { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import { DigestTransform, createImportStorageKey } from '../../shared/utils/ImportFileUtils';
import { S3ObjectStorage } from '../infrastructure/S3ObjectStorage';
import type { ImportQueue } from './ports/ImportQueue';

export class QueuedImportCsv {
  constructor(
    private readonly database: DatabaseClient,
    private readonly storage: S3ObjectStorage,
    private readonly bucket: string,
    private readonly queue: ImportQueue,
  ) {}

  async execute(input: {
    filename: string;
    contentType: string;
    stream: Readable;
  }): Promise<{ id: string; status: 'queued'; storageKey: string; fileSize: number }> {
    const filename = normalizeRequiredText(input.filename, 'O nome do arquivo é obrigatório.');
    const created = await this.database.query<{ id: string }>(
      `INSERT INTO imports (filename, status) VALUES ($1, 'queued') RETURNING id`,
      [filename],
    );
    const id = created.rows[0].id;
    const storageKey = createImportStorageKey(id);
    const digest = new DigestTransform();
    const contentType = input.contentType || 'text/csv';

    try {
      const upload = this.storage.put(storageKey, digest, contentType);
      input.stream.pipe(digest);
      await upload;
      await this.database.query(
        `UPDATE imports
            SET file_checksum = $1, storage_bucket = $2, storage_key = $3,
                file_size = $4, content_type = $5
          WHERE id = $6`,
        [digest.checksum, this.bucket, storageKey, digest.size, contentType, id],
      );
      await this.queue.publish({ importId: id, storageKey });
      return { id, status: 'queued', storageKey, fileSize: digest.size };
    } catch (error) {
      await this.database.query(
        `UPDATE imports SET status = 'failed', finished_at = NOW() WHERE id = $1`,
        [id],
      );
      throw error;
    }
  }
}
