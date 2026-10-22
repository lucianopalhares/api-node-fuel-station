/** tipos entre validação e gravação do staging da importação. */

export type CsvStationRow = Record<string, string>;

export type StagingRow = {
  importId: string;
  rowNumber: number;
  rawData: CsvStationRow;
  normalizedData: CsvStationRow | null;
  status: 'ready' | 'invalid';
  errors: Array<{ field: string; message: string }>;
};

export type ReadyImportRow = StagingRow & {
  normalizedData: CsvStationRow;
  status: 'ready';
};

