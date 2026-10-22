/** valida e normaliza uma linha sem acessar banco, storage ou fila. */

import {
  hasExactDigits,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  normalizeCnpj,
  normalizeCep,
} from '../../../shared/validation/InputValidation';
import { InvalidDateError, normalizeDate } from '../../../shared/validation/DateValidation';
import type { CsvStationRow } from './types';

export type ValidationIssue = { field: string; message: string };

export class ImportRowValidator {
  validate(raw: CsvStationRow): { normalized: CsvStationRow } | { errors: ValidationIssue[] } {
    try {
      const normalized = Object.fromEntries(
        Object.entries(raw).map(([key, value]) => [key, value?.trim().replace(/\s+/g, ' ') ?? '']),
      );

      this.assertAllowed(normalized.cnpj, /^[\d\s.,/+Ee-]+$/, 'cnpj', 'CNPJ contém caracteres inválidos.');
      this.assertAllowed(normalized.cpf_responsavel, /^[\d\s.-]+$/, 'cpf_responsavel', 'CPF contém caracteres inválidos.');
      this.assertAllowed(normalized.cep, /^[\d\s-]+$/, 'cep', 'CEP contém caracteres inválidos.');

      normalized.cnpj = normalizeCnpj(normalized.cnpj);
      normalized.cpf_responsavel = normalized.cpf_responsavel.replace(/\D/g, '');
      normalized.cep = normalizeCep(normalized.cep);
      normalized.uf = normalized.uf.toUpperCase();
      normalized.email_responsavel = normalized.email_responsavel.toLowerCase();
      normalized.data_inauguracao = this.normalizeDate(normalized.data_inauguracao);
      normalized.combustiveis = this.splitList(normalized.combustiveis).join(',');

      this.validateRequired(normalized);
      return { normalized };
    } catch (error) {
      const issue = error instanceof RowValidationError
        ? { field: error.field, message: error.message }
        : { field: 'row', message: error instanceof Error ? error.message : 'Linha inválida.' };
      return { errors: [issue] };
    }
  }

  private validateRequired(row: CsvStationRow): void {
    if (!isValidCnpj(row.cnpj)) throw new RowValidationError('cnpj', 'CNPJ inválido.');
    if (!row.nome_posto) throw new RowValidationError('nome_posto', 'Nome do posto é obrigatório.');
    if (!row.bandeira) throw new RowValidationError('bandeira', 'Bandeira é obrigatória.');
    if (!row.logradouro) throw new RowValidationError('logradouro', 'Logradouro é obrigatório.');
    if (!row.bairro) throw new RowValidationError('bairro', 'Bairro é obrigatório.');
    if (!row.municipio) throw new RowValidationError('municipio', 'Município é obrigatório.');
    if (!/^[A-Z]{2}$/.test(row.uf)) throw new RowValidationError('uf', 'UF deve conter duas letras.');
    if (!hasExactDigits(row.cep, 8)) throw new RowValidationError('cep', 'CEP deve conter 8 dígitos.');
    if (!isValidCpf(row.cpf_responsavel)) throw new RowValidationError('cpf_responsavel', 'CPF inválido.');
    if (!row.nome_responsavel) throw new RowValidationError('nome_responsavel', 'Nome do responsável é obrigatório.');
    if (row.email_responsavel && !isValidEmail(row.email_responsavel)) {
      throw new RowValidationError('email_responsavel', 'Email inválido.');
    }
    if (!this.splitList(row.combustiveis).length) throw new RowValidationError('combustiveis', 'Ao menos um combustível é obrigatório.');
    if (!row.status) throw new RowValidationError('status', 'Status é obrigatório.');

    for (const field of ['numero_bicos', 'numero_pistas']) {
      if (row[field] && (!/^\d+$/.test(row[field]) || BigInt(row[field]) > 2147483647n)) {
        throw new RowValidationError(field, 'O valor deve ser um inteiro não negativo até 2147483647.');
      }
    }
  }

  private normalizeDate(value: string): string {
    try {
      return normalizeDate(value);
    } catch (error) {
      if (error instanceof InvalidDateError) throw new RowValidationError('data_inauguracao', error.message);
      throw error;
    }
  }

  private assertAllowed(value: string, pattern: RegExp, field: string, message: string): void {
    if (value && !pattern.test(value)) throw new RowValidationError(field, message);
  }

  private splitList(value: string): string[] {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}

export class RowValidationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = 'RowValidationError';
  }
}

