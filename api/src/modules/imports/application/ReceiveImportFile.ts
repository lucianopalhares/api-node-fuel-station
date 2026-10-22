// recebe o arquivo, salva os metadados e agenda o processamento.

import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { normalizeRequiredText } from '../../shared/validation/InputValidation';
import { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import { logger } from '../../shared/observability/logger';
import { DigestTransform, createImportStorageKey } from '../../shared/utils/ImportFileUtils';
import type { ImportFileStorage } from './ports/ImportFileStorage';
import type { ImportJobPublisher } from './ports/ImportJobPublisher';
import { ConflictError } from '../../shared/errors/ConflictError';
import { AppError } from '../../shared/errors/AppError';

type UploadInput = { filename: string; contentType: string; stream: Readable };
type ReceivedImport = { id: string; status: 'queued'; storageKey: string; fileSize: number };

export class ReceiveImportFile {
  constructor(
    private readonly database: DatabaseClient,
    private readonly storage: ImportFileStorage,
    private readonly bucket: string,
    private readonly jobPublisher: ImportJobPublisher,
    private readonly maxFileSizeBytes: number,
  ) {}

  async execute(input: UploadInput): Promise<ReceivedImport> {
    const filename = normalizeRequiredText(input.filename, 'O nome do arquivo é obrigatório.');
    const importId = await this.createImport(filename);
    const storageKey = createImportStorageKey(importId);
    const contentType = input.contentType || 'text/csv';
    const digest = new DigestTransform();
    const startedAt = Date.now();

    logger.info('import.upload.started', { importId, filename, contentType });
    try {
      const uploaded = await this.upload(storageKey, digest, input.stream, contentType);
      await this.saveMetadata(importId, storageKey, uploaded, contentType);
      await this.jobPublisher.publish({ importId, storageKey });
      logger.info('import.queue.published', { importId, storageKey, durationMs: Date.now() - startedAt });
      return { id: importId, status: 'queued', storageKey, fileSize: uploaded.size };
    } catch (error) {
      logger.error('import.upload.failed', { importId, storageKey, durationMs: Date.now() - startedAt, error });
      await this.markFailed(importId);
      await this.storage.delete(storageKey).catch((cleanupError) => {
        logger.warn('import.upload.cleanup_failed', { importId, storageKey, error: cleanupError });
      });
      throw error;
    }
  }

  private async createImport(filename: string): Promise<string> {
    const result = await this.database.query<{ id: string }>(
      `INSERT INTO imports (filename, status) VALUES ($1, 'queued') RETURNING id`,
      [filename],
    );
    return result.rows[0].id;
  }

  private async upload(key: string, digest: DigestTransform, stream: Readable, contentType: string): Promise<{ size: number; checksum: string }> {
    const upload = this.storage.put(key, digest, contentType);
    const streamPipeline = pipeline(stream, digest);
    const [uploadResult, streamResult] = await Promise.allSettled([upload, streamPipeline]);
    if (streamResult.status === 'rejected') throw streamResult.reason;
    if (uploadResult.status === 'rejected') throw uploadResult.reason;

    const truncated = (stream as Readable & { truncated?: boolean }).truncated === true;
    if (truncated || digest.size > this.maxFileSizeBytes) {
      throw new AppError(413, 'FILE_TOO_LARGE', `O arquivo excede o limite máximo permitido de ${this.maxFileSizeBytes} bytes.`, {
        field: 'file', maxBytes: this.maxFileSizeBytes, receivedBytes: digest.size,
      });
    }
    return { size: digest.size, checksum: digest.checksum };
  }

  private async saveMetadata(importId: string, key: string, uploaded: { size: number; checksum: string }, contentType: string): Promise<void> {
    const existing = await this.database.query<{ id: string }>(
      `SELECT id FROM imports WHERE file_checksum = $1 ORDER BY id LIMIT 1`, [uploaded.checksum],
    );
    if (existing.rows[0]) {
      throw new ConflictError('FILE_ALREADY_IMPORTED', `Este arquivo já foi importado anteriormente. Importação: ${existing.rows[0].id}.`, { importId: existing.rows[0].id });
    }
    try {
      await this.database.query(
        `UPDATE imports SET file_checksum = $1, storage_bucket = $2, storage_key = $3, file_size = $4, content_type = $5 WHERE id = $6`,
        [uploaded.checksum, this.bucket, key, uploaded.size, contentType, importId],
      );
    } catch (error) {
      const postgresError = error as { code?: string; constraint?: string };
      if (postgresError.code === '23505' && postgresError.constraint === 'imports_file_checksum_unique') {
        const concurrentImport = await this.database.query<{ id: string }>(
          `SELECT id FROM imports WHERE file_checksum = $1 ORDER BY id LIMIT 1`, [uploaded.checksum],
        );
        if (concurrentImport.rows[0]) {
          throw new ConflictError('FILE_ALREADY_IMPORTED', `Este arquivo já foi importado anteriormente. Importação: ${concurrentImport.rows[0].id}.`, { importId: concurrentImport.rows[0].id });
        }
      }
      throw error;
    }
  }

  private async markFailed(importId: string, reason = 'Falha ao enviar ou enfileirar o arquivo.'): Promise<void> {
    await this.database.query(
      `UPDATE imports SET status = 'failed', failure_reason = $2, finished_at = NOW() WHERE id = $1`,
      [importId, reason],
    );
  }
}
