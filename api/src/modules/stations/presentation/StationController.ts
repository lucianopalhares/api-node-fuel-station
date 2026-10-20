import { Request, Response } from 'express';
import { ListStations } from '../application/use-cases/ListStations';
import { parseOptionalInteger } from '../../shared/application/validation/InputValidation';

export class StationController {
  constructor(private readonly listStations: ListStations) {}

  async list(request: Request, response: Response): Promise<void> {
    const hasLimit = request.query.limit !== undefined && request.query.limit !== '';
    const limit = parseOptionalInteger(request.query.limit);
    if (hasLimit && limit === undefined) {
      response.status(400).json({ error: 'limit deve ser um número inteiro' });
      return;
    }

    response.json({ data: await this.listStations.execute({ limit }) });
  }
}
