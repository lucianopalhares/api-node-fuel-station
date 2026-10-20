import { ResponsiblePosition } from '../../domain/entities/ResponsiblePosition';
import { ResponsiblePositionRepository } from '../../domain/repositories/ResponsiblePositionRepository';
import { normalizeRequiredText } from '../../../shared/application/validation/InputValidation';

export class EnsureResponsiblePosition {
  constructor(private readonly repository: ResponsiblePositionRepository) {}

  async execute(name: string): Promise<ResponsiblePosition> {
    const normalized = normalizeRequiredText(name, 'cargo do responsável não pode ser vazio');

    const existing = await this.repository.findByName(normalized);
    return existing ?? this.repository.create(normalized);
  }
}
