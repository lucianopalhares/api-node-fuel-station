import type { CsvExportRecord } from '../../../shared/utils/CsvExportUtils';

export type StationExportCursor = {
  updatedAt: string;
  id: string;
};

export type StationExportRow = {
  cursor: StationExportCursor;
  record: CsvExportRecord;
};

export interface StationExportRepository {
  listPage(
    cursor: StationExportCursor | undefined,
    limit: number,
  ): Promise<StationExportRow[]>;
}
