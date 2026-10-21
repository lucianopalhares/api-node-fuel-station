import { Station } from '../entities/Station';

export interface StationRepository {
  list(limit: number, offset: number, search?: string): Promise<Station[]>;
}
