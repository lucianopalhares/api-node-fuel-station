
import { describe, expect, it } from 'vitest';
import { isValidDate, normalizeDate } from '../../src/modules/shared/validation/DateValidation';

describe('DateValidation', () => {
  it('normaliza os formatos aceitos pela importação', () => {
    expect(normalizeDate('01/02/1990')).toBe('1990-02-01');
    expect(normalizeDate('1990-02-01')).toBe('1990-02-01');
    expect(normalizeDate('01/13/1990')).toBe('1990-01-13');
  });

  it('rejeita datas inexistentes e aceita 29 de fevereiro em ano bissexto', () => {
    expect(isValidDate('29/02/2024')).toBe(true);
    expect(isValidDate('29/02/2023')).toBe(false);
    expect(isValidDate('31/04/2024')).toBe(false);
  });
});


