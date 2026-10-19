import { Responsible } from '../../domain/entities/Responsible';
import { ResponsibleRepository } from '../../domain/repositories/ResponsibleRepository';

export class GetResponsibleByCpf {
  constructor(private readonly repository: ResponsibleRepository) {}

  execute(cpf: string): Promise<Responsible | null> {
    return this.repository.findByCpf(normalizeCpf(cpf));
  }
}

function normalizeCpf(cpf: string): string {
  return cpf.replace(/\D/g, '');
}
