// controller pra lidar com os endpoints de cidade

import { Request, Response } from 'express';
import { GetCityByIbgeCode } from '../application/use-cases/GetCityByIbgeCode';
import { ListCities } from '../application/use-cases/ListCities';

export class CityController {
  constructor(private readonly listCities: ListCities, private readonly getCityByIbgeCode: GetCityByIbgeCode) {}

  async list(request: Request, response: Response): Promise<void> {
    const limit = request.query.limit ? Number(request.query.limit) : undefined;

    if (limit !== undefined && !Number.isInteger(limit)) { response.status(400).json({ error: 'limit deve ser um número inteiro' }); return; }

    const cities = await this.listCities.execute({
      state: typeof request.query.state === 'string' ? request.query.state : undefined,
      search: typeof request.query.search === 'string' ? request.query.search : undefined,
      limit,
    });

    response.json({ data: cities });
  }

  async getByIbgeCode(request: Request, response: Response): Promise<void> {
    const ibgeCode = Number(request.params.ibgeCode);

    if (!Number.isInteger(ibgeCode)) { response.status(400).json({ error: 'código IBGE inválido' }); return; }

    const city = await this.getCityByIbgeCode.execute(ibgeCode);

    if (!city) { response.status(404).json({ error: 'cidade não encontrada' }); return; }
    
    response.json(city);
  }
}
