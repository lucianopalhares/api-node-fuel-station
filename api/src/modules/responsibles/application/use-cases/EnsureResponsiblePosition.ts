import { ResponsiblePosition } from '../../domain/entities/ResponsiblePosition';
import { ResponsiblePositionRepository } from '../../domain/repositories/ResponsiblePositionRepository';

export class EnsureResponsiblePosition {
  constructor(private readonly repository: ResponsiblePositionRepository) {}

  async execute(name: string): Promise<ResponsiblePosition> {
    const normalized = name.trim().replace(/\s+/g, ' ');
    if (!normalized) throw new Error('cargo do responsável não pode ser vazio');

    const existing = await this.repository.findByName(normalized);
    return existing ?? this.repository.create(normalized);
  }
}
