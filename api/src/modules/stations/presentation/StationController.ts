import { Request, Response } from 'express';
import { ListStations } from '../application/use-cases/ListStations';

export class StationController {
  constructor(private readonly listStations: ListStations) {}

  async list(request: Request, response: Response): Promise<void> {
    const limit = request.query.limit ? Number(request.query.limit) : undefined;
    if (limit !== undefined && !Number.isInteger(limit)) {
      response.status(400).json({ error: 'limit deve ser um número inteiro' });
      return;
    }

    response.json({ data: await this.listStations.execute({ limit }) });
  }
}
