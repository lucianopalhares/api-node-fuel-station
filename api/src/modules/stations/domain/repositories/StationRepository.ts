import { Station } from '../entities/Station';

export interface StationRepository {
  list(limit: number): Promise<Station[]>;
}
