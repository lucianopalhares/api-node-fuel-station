import { Responsible } from '../../domain/entities/Responsible';
import { ResponsibleInput, ResponsibleRepository } from '../../domain/repositories/ResponsibleRepository';
import {
  isValidEmail,
  normalizeDigits,
  normalizeOptionalText,
} from '../../../shared/application/validation/InputValidation';

export class EnsureResponsible {
  constructor(private readonly repository: ResponsibleRepository) {}

  async execute(input: ResponsibleInput): Promise<Responsible> {
    const normalized = normalizeInput(input);
    const existing = await this.repository.findByCpf(normalized.cpf);

    if (existing) {
      assertNoConflict(existing, normalized);
      return existing;
    }

    return this.repository.create(normalized);
  }
}

function normalizeInput(input: ResponsibleInput): ResponsibleInput {
  const cpf = normalizeDigits(input.cpf);
  if (cpf.length !== 11) throw new Error('CPF do responsável deve conter 11 dígitos');

  const email = normalizeOptionalText(input.email)?.toLowerCase() ?? null;
  if (email !== null && !isValidEmail(email)) {
    throw new Error('email do responsável inválido');
  }

  return {
    cpf,
    name: normalizeOptionalText(input.name),
    email,
    positionId: input.positionId ?? null,
  };
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : null;
}

function assertNoConflict(existing: Responsible, incoming: ResponsibleInput): void {
  const conflicts = [
    ['nome', existing.name, incoming.name],
    ['email', existing.email, incoming.email],
  ].filter(([, current, next]) => current !== null && next !== null && current !== next);

  if (conflicts.length > 0) {
    throw new Error(`dados conflitantes para o CPF ${incoming.cpf}`);
  }
}
