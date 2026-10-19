// buscar cidades.

import { City } from '../../domain/entities/City';
import { CityRepository } from '../../domain/repositories/CityRepository';

export class ListCities {
  constructor(private readonly repository: CityRepository) {}

  execute(input: { state?: string; search?: string; limit?: number }): Promise<City[]> {
    return this.repository.list({
      stateAbbreviation: input.state?.trim().toUpperCase(),
      normalizedName: input.search?.trim() || undefined,
      limit: Math.min(Math.max(input.limit ?? 100, 1), 500),
    });
  }
}
