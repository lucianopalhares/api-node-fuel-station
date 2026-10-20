import { Request, Response } from 'express';
import { ListStations } from '../application/use-cases/ListStations';
import { parseOptionalInteger } from '../../shared/validation/InputValidation';
import { ValidationError } from '../../shared/errors/ValidationError';

export class StationController {
  constructor(private readonly listStations: ListStations) {}

  async list(request: Request, response: Response): Promise<void> {
    const hasLimit = request.query.limit !== undefined && request.query.limit !== '';
    const limit = parseOptionalInteger(request.query.limit);

    if (hasLimit && limit === undefined) {
      throw new ValidationError(
        'INVALID_LIMIT',
        'O limite deve ser informado como um número inteiro.',
        { field: 'limit' },
      );
    }

    response.json({ data: await this.listStations.execute({ limit }) });
  }
}
