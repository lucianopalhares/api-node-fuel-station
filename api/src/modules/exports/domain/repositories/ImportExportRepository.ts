import type { CsvExportRecord } from '../../../shared/utils/CsvExportUtils';

export type ImportExportMetadata = {
  id: string;
  filename: string;
};

export type ImportExportRow = {
  rowNumber: number;
  rawData: CsvExportRecord;
};

export type ImportExportRowStatus = 'successful' | 'invalid';

export interface ImportExportRepository {
  findMetadata(importId: string): Promise<ImportExportMetadata | null>;
  listRows(
    importId: string,
    afterRowNumber: number,
    limit: number,
    status?: ImportExportRowStatus,
  ): Promise<ImportExportRow[]>;
}
