import type { CsvExportRecord } from '../../shared/utils/CsvExportUtils';
import type {
  StationExportCursor,
  StationExportRepository,
} from '../domain/repositories/StationExportRepository';

const DEFAULT_LIMIT = 1_000;
const MAX_LIMIT = 10_000;
const PAGE_SIZE = 500;

export type StationExportDocument = {
  filename: string;
  rows: AsyncIterable<CsvExportRecord>;
};

export class ExportStations {
  constructor(private readonly repository: StationExportRepository) {}

  execute(input: { limit?: number } = {}): StationExportDocument {
    const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

    return {
      filename: 'stations-export.csv',
      rows: this.readRows(limit),
    };
  }

  private async *readRows(limit: number): AsyncIterable<CsvExportRecord> {
    let cursor: StationExportCursor | undefined;
    let exportedRows = 0;

    while (exportedRows < limit) {
      const pageLimit = Math.min(PAGE_SIZE, limit - exportedRows);
      const page = await this.repository.listPage(cursor, pageLimit);

      if (page.length === 0) return;

      for (const row of page) {
        cursor = row.cursor;
        exportedRows += 1;
        yield row.record;
      }

      if (page.length < pageLimit) return;
    }
  }
}

export const stationExportLimits = {
  default: DEFAULT_LIMIT,
  maximum: MAX_LIMIT,
};
