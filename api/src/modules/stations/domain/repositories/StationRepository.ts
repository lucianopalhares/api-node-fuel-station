import { Station } from '../entities/Station';

export interface StationRepository {
  list(limit: number, offset: number): Promise<Station[]>;
}
