
import { describe, expect, it } from 'vitest';
import {
  CSV_HEADERS,
  validateCsvHeaders,
  validateCsvUpload,
} from '../../src/modules/shared/validation/CsvImportValidation';

describe('CsvImportValidation', () => {
  it('aceita extensão CSV e parâmetros do MIME', () => {
    expect(() => validateCsvUpload(' postos.CSV ', 'text/csv; charset=utf-8')).not.toThrow();
  });

  it('rejeita extensão ou MIME incompatíveis', () => {
    expect(() => validateCsvUpload('postos.txt', 'text/csv'))
      .toThrowError(expect.objectContaining({ code: 'INVALID_FILE_EXTENSION' }));
    expect(() => validateCsvUpload('postos.csv', 'application/json'))
      .toThrowError(expect.objectContaining({ code: 'INVALID_FILE_TYPE' }));
  });

  it('aceita o header exato e rejeita ordem ou colunas diferentes', () => {
    expect(validateCsvHeaders([...CSV_HEADERS])).toEqual(CSV_HEADERS);
    expect(() => validateCsvHeaders([...CSV_HEADERS].reverse()))
      .toThrowError(expect.objectContaining({ code: 'INVALID_CSV_HEADER' }));
  });
});


