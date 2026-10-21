import { Station } from '../../domain/entities/Station';
import { StationRepository } from '../../domain/repositories/StationRepository';
import { clampInteger } from '../../../shared/validation/InputValidation';

export class ListStations {
  constructor(private readonly repository: StationRepository) {}

  async execute(input: { page?: number; limit?: number; search?: string } = {}): Promise<{
    data: Station[];
    pagination: { page: number; limit: number; hasNext: boolean };
  }> {
    const page = clampInteger(input.page, 1, 1, Number.MAX_SAFE_INTEGER);
    const limit = clampInteger(input.limit, 100, 1, 500);
    const stations = await this.repository.list(limit + 1, (page - 1) * limit, input.search);

    return {
      data: stations.slice(0, limit),
      pagination: { page, limit, hasNext: stations.length > limit },
    };
  }
}

