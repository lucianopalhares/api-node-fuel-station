
import type { CsvStationRow } from '../../../src/modules/imports/application/staging/types';

export function validStationRow(overrides: Partial<CsvStationRow> = {}): CsvStationRow {
  return {
    cnpj: '1.02346E+13',
    nome_posto: '  Posto   Leste  ',
    nome_fantasia: 'Posto Leste',
    bandeira: 'Petrobras',
    logradouro: 'Rua Augusta',
    numero: '100',
    complemento: '',
    bairro: 'Moema',
    municipio: 'São Paulo',
    uf: 'sp',
    cep: '1310100',
    cpf_responsavel: '123.456.001-10',
    nome_responsavel: 'Maria Silva Ferreira',
    email_responsavel: ' MARIA.FERREIRA@EXEMPLO.COM ',
    cargo_responsavel: 'Gerente de Posto',
    combustiveis: ' Gasolina Comum,  Etanol ,Diesel S10 ',
    status: 'ativo',
    data_inauguracao: '01/01/1990',
    numero_bicos: '4',
    numero_pistas: '2',
    observacoes: 'Observação',
    ...overrides,
  };
}


