import { Station } from '../../domain/entities/Station';
import { StationRepository } from '../../domain/repositories/StationRepository';

export class ListStations {
  constructor(private readonly repository: StationRepository) {}

  execute(input: { limit?: number } = {}): Promise<Station[]> {
    return this.repository.list(Math.min(Math.max(input.limit ?? 100, 1), 500));
  }
}
