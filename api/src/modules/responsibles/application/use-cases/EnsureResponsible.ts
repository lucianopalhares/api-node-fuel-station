import { Responsible } from '../../domain/entities/Responsible';
import { ResponsibleInput, ResponsibleRepository } from '../../domain/repositories/ResponsibleRepository';
import {
  hasExactDigits,
  isValidEmail,
  normalizeDigits,
  normalizeOptionalText,
} from '../../../shared/validation/InputValidation';

import { ConflictError } from '../../../shared/errors/ConflictError';
import { ValidationError } from '../../../shared/errors/ValidationError';

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

  if (!hasExactDigits(cpf, 11)) {
    throw new ValidationError(
      'INVALID_CPF',
      'O CPF do responsável deve conter 11 dígitos.',
      { field: 'cpf' },
    );
  }

  const email = normalizeOptionalText(input.email)?.toLowerCase() ?? null;
  if (email !== null && !isValidEmail(email)) {
    throw new ValidationError(
      'INVALID_EMAIL',
      'O email do responsável é inválido.',
      { field: 'email' },
    );
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
    throw new ConflictError(
      'RESPONSIBLE_DATA_CONFLICT',
      'Já existe um responsável com esse CPF e dados diferentes.',
      { field: 'cpf' },
    );
  }
}
