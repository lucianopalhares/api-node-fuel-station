import { ResponsiblePosition } from '../entities/ResponsiblePosition';

export interface ResponsiblePositionRepository {
  findByName(name: string): Promise<ResponsiblePosition | null>;
  create(name: string): Promise<ResponsiblePosition>;
}
