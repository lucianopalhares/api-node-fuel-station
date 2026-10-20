// buscar cidades.

import { City } from '../../domain/entities/City';
import { CityRepository } from '../../domain/repositories/CityRepository';
import { clampInteger, normalizeOptionalText } from '../../../shared/application/validation/InputValidation';

export class ListCities {
  constructor(private readonly repository: CityRepository) {}

  execute(input: { state?: string; search?: string; limit?: number }): Promise<City[]> {
    const state = normalizeOptionalText(input.state)?.toUpperCase();

    return this.repository.list({
      stateAbbreviation: state,
      normalizedName: normalizeOptionalText(input.search) ?? undefined,
      limit: clampInteger(input.limit, 100, 1, 500),
    });
  }
}
