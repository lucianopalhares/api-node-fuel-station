// caso de uso pra buscar cidade pelo codigo ibge

import { CityRepository } from '../../domain/repositories/CityRepository';

export class GetCityByIbgeCode {
  constructor(private readonly repository: CityRepository) {}
  execute(ibgeCode: number) { return this.repository.findByIbgeCode(ibgeCode); }
}
