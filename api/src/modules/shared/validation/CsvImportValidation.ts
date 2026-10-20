import { ValidationError } from '../errors/ValidationError';

export const CSV_HEADERS = [
  'cnpj', 'nome_posto', 'nome_fantasia', 'bandeira', 'logradouro', 'numero',
  'complemento', 'bairro', 'municipio', 'uf', 'cep', 'cpf_responsavel',
  'nome_responsavel', 'email_responsavel', 'cargo_responsavel', 'combustiveis',
  'status', 'data_inauguracao', 'numero_bicos', 'numero_pistas', 'observacoes',
];

export function validateCsvHeaders(headers: string[]): string[] {
  const normalized = headers.map((header) => header.trim());
  const valid = JSON.stringify(normalized) === JSON.stringify(CSV_HEADERS);

  if (!valid) {
    throw new ValidationError(
      'INVALID_CSV_HEADER',
      'O header do CSV não corresponde ao formato esperado.',
      { expected: CSV_HEADERS, received: normalized },
    );
  }

  return normalized;
}
