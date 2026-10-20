import type { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import { normalizeRequiredText } from '../../shared/validation/InputValidation';
import { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import { DigestTransform, createImportStorageKey } from '../../shared/utils/ImportFileUtils';
import { validateCsvHeaders } from '../../shared/validation/CsvImportValidation';
import { S3ObjectStorage } from '../infrastructure/S3ObjectStorage';

export class ImportCsv {
  constructor(
    private readonly database: DatabaseClient,
    private readonly storage: S3ObjectStorage,
    private readonly bucket: string,
  ) {}

  async execute(input: {
    filename: string;
    contentType: string;
    stream: Readable;
  }): Promise<{ id: string; storageKey: string; totalRows: number; fileSize: number }> {
    const filename = normalizeRequiredText(input.filename, 'O nome do arquivo é obrigatório.');
    const created = await this.database.query<{ id: string }>(
      `INSERT INTO imports (filename, status) VALUES ($1, 'processing') RETURNING id`,
      [filename],
    );
    const id = created.rows[0].id;
    const storageKey = createImportStorageKey(id);
    const digest = new DigestTransform();

    try {
      const upload = this.storage.put(storageKey, digest, input.contentType || 'text/csv');
      input.stream.pipe(digest);
      await upload;

      const rows = await this.countRows(storageKey);

      await this.database.query(
        `UPDATE imports
            SET status = 'completed', file_checksum = $1, storage_bucket = $2,
                storage_key = $3, file_size = $4, content_type = $5,
                total_rows = $6, imported_rows = $6, finished_at = NOW()
          WHERE id = $7`,
        [digest.checksum, this.bucket, storageKey, digest.size, input.contentType || 'text/csv', rows, id],
      );

      return { id, storageKey, totalRows: rows, fileSize: digest.size };
    } catch (error) {
      await this.database.query(
        `UPDATE imports SET status = 'failed', finished_at = NOW() WHERE id = $1`,
        [id],
      );
      throw error;
    }
  }

  private async countRows(key: string): Promise<number> {
    const source = await this.storage.get(key);
    const parser = parse({
      bom: true,
      delimiter: ';',
      columns: (headers: string[]) => {
        return validateCsvHeaders(headers);
      },
      skip_empty_lines: true,
      relax_column_count: false,
    });
    source.pipe(parser);
    let rows = 0;
    for await (const _row of parser) rows += 1;
    return rows;
  }
}
