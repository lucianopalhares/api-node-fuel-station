import { Request, Response } from 'express';
import { ListStations } from '../application/use-cases/ListStations';
import { parseOptionalInteger } from '../../shared/validation/InputValidation';
import { ValidationError } from '../../shared/errors/ValidationError';

export class StationController {
  constructor(private readonly listStations: ListStations) {}

  async list(request: Request, response: Response): Promise<void> {
    const hasPage = request.query.page !== undefined && request.query.page !== '';
    const hasLimit = request.query.limit !== undefined && request.query.limit !== '';
    const page = parseOptionalInteger(request.query.page);
    const limit = parseOptionalInteger(request.query.limit);

    if (hasPage && (page === undefined || page < 1)) {
      throw new ValidationError(
        'INVALID_PAGE',
        'A página deve ser informada como um número inteiro maior que zero.',
        { field: 'page' },
      );
    }

    if (hasLimit && (limit === undefined || limit < 1)) {
      throw new ValidationError(
        'INVALID_LIMIT',
        'O limite deve ser informado como um número inteiro maior que zero.',
        { field: 'limit' },
      );
    }

    response.json(await this.listStations.execute({ page, limit }));
  }
}
