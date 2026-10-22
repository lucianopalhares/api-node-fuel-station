
import { describe, expect, it } from 'vitest';
import {
  hasExactDigits,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  normalizeCep,
} from '../../src/modules/shared/validation/InputValidation';

describe('InputValidation', () => {
  it('normaliza CNPJ exportado em notação científica', () => {
    expect(normalizeCnpj('1,02346E+13')).toBe('10234600000000');
  });

  it('preserva documentos como texto e completa CEP de sete dígitos', () => {
    expect(normalizeCep('1310100')).toBe('01310100');
    expect(hasExactDigits('01310-100', 8)).toBe(true);
  });

  it('rejeita sequências repetidas e aceita quantidade correta de dígitos', () => {
    expect(isValidCpf('12345678901')).toBe(true);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCnpj('10234600000000')).toBe(true);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });
});


