import { Responsible } from '../../domain/entities/Responsible';
import { ResponsibleRepository } from '../../domain/repositories/ResponsibleRepository';

export class ListResponsibles {
  constructor(private readonly repository: ResponsibleRepository) {}

  execute(input: { limit?: number } = {}): Promise<Responsible[]> {
    return this.repository.list(Math.min(Math.max(input.limit ?? 100, 1), 500));
  }
}
