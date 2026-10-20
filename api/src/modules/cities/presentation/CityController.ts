// controller pra lidar com os endpoints de cidade

import { Request, Response } from 'express';
import { GetCityByIbgeCode } from '../application/use-cases/GetCityByIbgeCode';
import { ListCities } from '../application/use-cases/ListCities';
import { parseOptionalInteger } from '../../shared/application/validation/InputValidation';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ValidationError } from '../../shared/errors/ValidationError';

export class CityController {
  constructor(private readonly listCities: ListCities, private readonly getCityByIbgeCode: GetCityByIbgeCode) {}

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

    const cities = await this.listCities.execute({
      state: typeof request.query.state === 'string' ? request.query.state : undefined,
      search: typeof request.query.search === 'string' ? request.query.search : undefined,
      limit,
    });

    response.json({ data: cities });
  }

  async getByIbgeCode(request: Request, response: Response): Promise<void> {
    const ibgeCode = parseOptionalInteger(request.params.ibgeCode);

    if (ibgeCode === undefined) {
      throw new ValidationError(
        'INVALID_IBGE_CODE',
        'O código IBGE informado é inválido.',
        { field: 'ibgeCode' },
      );
    }

    const city = await this.getCityByIbgeCode.execute(ibgeCode);

    if (!city) {
      throw new NotFoundError('CITY_NOT_FOUND', 'Cidade não encontrada.');
    }
    
    response.json(city);
  }
}
