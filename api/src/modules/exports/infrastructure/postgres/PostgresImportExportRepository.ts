import { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type {
  ImportExportMetadata,
  ImportExportRepository,
  ImportExportRow,
} from '../../domain/repositories/ImportExportRepository';

type ImportMetadataRow = {
  id: string;
  filename: string;
};

type ImportExportRowData = {
  row_number: number;
  raw_data: Record<string, unknown>;
};

export class PostgresImportExportRepository implements ImportExportRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findMetadata(importId: string): Promise<ImportExportMetadata | null> {
    const result = await this.database.query<ImportMetadataRow>(
      `SELECT id, filename
         FROM imports
        WHERE id = $1`,
      [importId],
    );

    const row = result.rows[0];
    return row ? { id: row.id, filename: row.filename } : null;
  }

  async listRows(importId: string, afterRowNumber: number, limit: number): Promise<ImportExportRow[]> {
    const result = await this.database.query<ImportExportRowData>(
      `SELECT row_number, raw_data
         FROM import_rows
        WHERE import_id = $1
          AND row_number > $2
          AND status IN ('imported', 'updated')
        ORDER BY row_number ASC
        LIMIT $3`,
      [importId, afterRowNumber, limit],
    );

    return result.rows.map((row) => ({
      rowNumber: row.row_number,
      rawData: row.raw_data,
    }));
  }
}
