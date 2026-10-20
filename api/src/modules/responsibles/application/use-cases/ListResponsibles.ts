import { Responsible } from '../../domain/entities/Responsible';
import { ResponsibleRepository } from '../../domain/repositories/ResponsibleRepository';
import { clampInteger } from '../../../shared/validation/InputValidation';

export class ListResponsibles {
  constructor(private readonly repository: ResponsibleRepository) {}

  execute(input: { limit?: number } = {}): Promise<Responsible[]> {
    return this.repository.list(clampInteger(input.limit, 100, 1, 500));
  }
}
