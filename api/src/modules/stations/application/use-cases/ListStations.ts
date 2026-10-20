import { Station } from '../../domain/entities/Station';
import { StationRepository } from '../../domain/repositories/StationRepository';
import { clampInteger } from '../../../shared/validation/InputValidation';

export class ListStations {
  constructor(private readonly repository: StationRepository) {}

  execute(input: { limit?: number } = {}): Promise<Station[]> {
    return this.repository.list(clampInteger(input.limit, 100, 1, 500));
  }
}
