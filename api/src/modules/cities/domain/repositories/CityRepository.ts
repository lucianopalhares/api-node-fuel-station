// contrato pra lidar com a cidades no banco de dados

import { City } from '../entities/City';

export type CitySearch = { stateAbbreviation?: string; normalizedName?: string; limit: number };

export interface CityRepository {
  list(search: CitySearch): Promise<City[]>;
  findByIbgeCode(ibgeCode: number): Promise<City | null>;
}
