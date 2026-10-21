import { ValidationError } from '../errors/ValidationError';

const ALLOWED_CSV_MIME_TYPES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
]);

export const CSV_HEADERS = [
  'cnpj', 'nome_posto', 'nome_fantasia', 'bandeira', 'logradouro', 'numero',
  'complemento', 'bairro', 'municipio', 'uf', 'cep', 'cpf_responsavel',
  'nome_responsavel', 'email_responsavel', 'cargo_responsavel', 'combustiveis',
  'status', 'data_inauguracao', 'numero_bicos', 'numero_pistas', 'observacoes',
];

export function validateCsvUpload(filename: string, contentType: string): void {
  const normalizedFilename = filename.trim();
  const normalizedMimeType = contentType.split(';', 1)[0].trim().toLowerCase();

  if (!normalizedFilename.toLowerCase().endsWith('.csv')) {
    throw new ValidationError(
      'INVALID_FILE_EXTENSION',
      'Envie um arquivo com extensão .csv.',
      { field: 'file', received: filename },
    );
  }

  if (!ALLOWED_CSV_MIME_TYPES.has(normalizedMimeType)) {
    throw new ValidationError(
      'INVALID_FILE_TYPE',
      'O arquivo precisa ser um CSV válido.',
      {
        field: 'file',
        received: contentType,
        allowed: [...ALLOWED_CSV_MIME_TYPES],
      },
    );
  }
}

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
