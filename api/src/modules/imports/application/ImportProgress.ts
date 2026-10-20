import { logger } from '../../shared/observability/logger';

export class ImportProgress {
  private totalRows = 0;
  private importedRows = 0;
  private updatedRows = 0;
  private errorRows = 0;

  constructor(private readonly importId: string) {}

  nextRow(): number {
    this.totalRows += 1;
    return this.totalRows + 1;
  }

  imported(): void {
    this.importedRows += 1;
    this.logProgress();
  }

  updated(): void {
    this.updatedRows += 1;
    this.logProgress();
  }

  invalid(): void {
    this.errorRows += 1;
    this.logProgress();
  }

  summary() {
    return {
      totalRows: this.totalRows,
      importedRows: this.importedRows,
      updatedRows: this.updatedRows,
      errorRows: this.errorRows,
    };
  }

  private logProgress(): void {
    if (this.totalRows % 500 !== 0) return;
    logger.info('import.processing.progress', {
      importId: this.importId,
      processedRows: this.totalRows,
      ...this.summary(),
    });
  }
}
