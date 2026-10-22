
import { describe, expect, it } from 'vitest';
import { ImportRowValidator } from '../../src/modules/imports/application/staging/ImportRowValidator';
import { validStationRow } from './fixtures';

describe('ImportRowValidator', () => {
  const validator = new ImportRowValidator();

  it('normaliza uma linha válida antes do staging', () => {
    const result = validator.validate(validStationRow());

    expect(result).toEqual({
      normalized: expect.objectContaining({
        cnpj: '10234600000000',
        nome_posto: 'Posto Leste',
        uf: 'SP',
        cep: '01310100',
        cpf_responsavel: '12345600110',
        email_responsavel: 'maria.ferreira@exemplo.com',
        combustiveis: 'Gasolina Comum,Etanol,Diesel S10',
        data_inauguracao: '1990-01-01',
      }),
    });
  });

  it.each([
    ['cnpj', 'CNPJ contém caracteres inválidos.'],
    ['cep', 'CEP deve conter 8 dígitos.'],
    ['email_responsavel', 'Email inválido.'],
    ['combustiveis', 'Ao menos um combustível é obrigatório.'],
    ['numero_bicos', 'O valor deve ser um inteiro não negativo até 2147483647.'],
  ])('retorna erro de campo para entrada inválida em %s', (field, message) => {
    const values = {
      cnpj: { cnpj: 'abc' },
      cep: { cep: '123' },
      email_responsavel: { email_responsavel: 'invalido' },
      combustiveis: { combustiveis: ' , ' },
      numero_bicos: { numero_bicos: '2147483648' },
    } as const;
    const result = validator.validate(validStationRow(values[field as keyof typeof values]));

    expect(result).toEqual({ errors: [{ field, message }] });
  });

  it('aceita campos numéricos vazios e rejeita data inválida', () => {
    const result = validator.validate(validStationRow({ numero_bicos: '', numero_pistas: '', data_inauguracao: '31/02/2024' }));

    expect(result).toEqual({
      errors: [{ field: 'data_inauguracao', message: 'A data informada não existe no calendário.' }],
    });
  });
});


