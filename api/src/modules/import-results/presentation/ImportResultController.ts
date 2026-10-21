
import type { Request, Response } from 'express';
import { GetImportDetails, importRowStatuses, type ImportRowStatus } from '../application/GetImportDetails';
import { ListImports } from '../application/ListImports';
import { clampInteger, parseOptionalInteger } from '../../shared/validation/InputValidation';
import { ValidationError } from '../../shared/errors/ValidationError';

export class ImportResultController {
  constructor(
    private readonly listImports: ListImports,
    private readonly getImportDetails: GetImportDetails,
  ) {}

  async list(request: Request, response: Response): Promise<void> {
    const limit = this.parsePositiveInteger(request.query.limit, 'limit', 20, 100);
    response.json({ data: await this.listImports.execute(limit) });
  }

  async detail(request: Request, response: Response): Promise<void> {
    const page = this.parsePositiveInteger(request.query.page, 'page', 1, Number.MAX_SAFE_INTEGER);
    const limit = this.parsePositiveInteger(request.query.limit, 'limit', 50, 100);
    const status = this.parseStatus(request.query.status);

    response.json({
      data: await this.getImportDetails.execute({
        importId: this.parseRouteImportId(request.params.importId),
        page,
        limit,
        status,
      }),
    });
  }

  private parseRouteImportId(value: string | string[]): string {
    if (typeof value !== 'string') {
      throw new ValidationError(
        'INVALID_IMPORT_ID',
        'O identificador da importação é inválido.',
        { field: 'importId' },
      );
    }
    return value;
  }

  private parsePositiveInteger(value: unknown, field: string, fallback: number, maximum: number): number {
    if (value === undefined || value === '') return fallback;
    const parsed = parseOptionalInteger(value);
    if (parsed === undefined || parsed < 1) {
      throw new ValidationError('INVALID_IMPORT_PARAMETER', `O parâmetro ${field} deve ser um inteiro positivo.`, { field });
    }
    return clampInteger(parsed, fallback, 1, maximum);
  }

  private parseStatus(value: unknown): ImportRowStatus | undefined {
    if (value === undefined || value === '') return undefined;
    if (typeof value !== 'string' || !importRowStatuses.includes(value as ImportRowStatus)) {
      throw new ValidationError('INVALID_IMPORT_ROW_STATUS', 'Status de linha inválido.', {
        field: 'status',
        allowed: importRowStatuses,
      });
    }
    return value as ImportRowStatus;
  }
}
