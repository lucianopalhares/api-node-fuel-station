//  normalizar uma linha do CSV e persistir o posto e seus relacionamentos.

import { DatabaseClient } from '../../shared/infrastructure/database/DatabaseClient';
import {
  hasExactDigits,
  isValidCnpj,
  isValidCpf,
  isValidEmail,
  normalizeCnpj,
  normalizeCep,
} from '../../shared/validation/InputValidation';
import { InvalidDateError, normalizeDate } from '../../shared/validation/DateValidation';

export type CsvStationRow = Record<string, string>;

export type PersistedRow = {
  status: 'imported' | 'updated';
  stationId: string;
  normalized: CsvStationRow;
};

export class StationImportPersister {
  constructor(private readonly database: DatabaseClient) {}

  async persist(importId: string, rowNumber: number, raw: CsvStationRow): Promise<PersistedRow> {
    const normalized = normalizeRow(raw);
    validateRow(normalized);

    return this.database.transaction(async (database) => {

      const city = await database.query<{ ibge_code: number }>(
        `SELECT c.ibge_code
          FROM cities c
          JOIN states s ON s.id = c.state_id
          WHERE c.normalized_name = $1 AND s.abbreviation = $2`,
        [normalizeName(normalized.municipio), normalized.uf],
      );
      if (!city.rows[0]) throw new RowError('A cidade não foi encontrada no catálogo IBGE.', 'municipio');

      const brandId = await ensureCatalog(database, 'brands', normalized.bandeira);
      const fuelIds = await Promise.all(
        splitList(normalized.combustiveis).map((fuel) => ensureCatalog(database, 'fuels', fuel)),
      );
      const statusId = await ensureStatus(database, normalized.status);
      const responsibleId = await ensureResponsible(database, normalized);

      const existing = await database.query<{ id: string }>(
        'SELECT id FROM stations WHERE cnpj = $1',
        [normalized.cnpj],
      );
      const station = await database.query<{ id: string }>(
        `INSERT INTO stations (
          cnpj, nome_posto, nome_fantasia, brand_id, logradouro, numero, complemento,
          bairro, city_ibge_code, cep, responsible_id, data_inauguracao,
          numero_bicos, numero_pistas, observacoes, status_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (cnpj) DO UPDATE SET
          nome_posto = EXCLUDED.nome_posto,
          nome_fantasia = EXCLUDED.nome_fantasia,
          brand_id = EXCLUDED.brand_id,
          logradouro = EXCLUDED.logradouro,
          numero = EXCLUDED.numero,
          complemento = EXCLUDED.complemento,
          bairro = EXCLUDED.bairro,
          city_ibge_code = EXCLUDED.city_ibge_code,
          cep = EXCLUDED.cep,
          responsible_id = EXCLUDED.responsible_id,
          data_inauguracao = EXCLUDED.data_inauguracao,
          numero_bicos = EXCLUDED.numero_bicos,
          numero_pistas = EXCLUDED.numero_pistas,
          observacoes = EXCLUDED.observacoes,
          status_id = EXCLUDED.status_id,
          updated_at = NOW()
        RETURNING id`,
        [
          normalized.cnpj, normalized.nome_posto, nullable(normalized.nome_fantasia), brandId,
          nullable(normalized.logradouro), nullable(normalized.numero), nullable(normalized.complemento),
          nullable(normalized.bairro), city.rows[0].ibge_code, nullable(normalized.cep), responsibleId,
          nullable(normalized.data_inauguracao), toInteger(normalized.numero_bicos), toInteger(normalized.numero_pistas),
          nullable(normalized.observacoes), statusId,
        ],
      );
      const stationId = station.rows[0].id;

      await database.query('DELETE FROM station_fuels WHERE station_id = $1', [stationId]);
      for (const fuelId of fuelIds) {
        await database.query(
          'INSERT INTO station_fuels (station_id, fuel_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [stationId, fuelId],
        );
      }
      await database.query(
        `INSERT INTO import_rows (import_id, row_number, station_id, raw_data, normalized_data, status)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
        ON CONFLICT (import_id, row_number) DO UPDATE SET
          station_id = EXCLUDED.station_id, raw_data = EXCLUDED.raw_data,
          normalized_data = EXCLUDED.normalized_data, status = EXCLUDED.status`,
        [importId, rowNumber, stationId, JSON.stringify(raw), JSON.stringify(normalized), existing.rows[0] ? 'updated' : 'imported'],
      );

      return { status: existing.rows[0] ? 'updated' : 'imported', stationId, normalized };
    });
  }
}

export class RowError extends Error {
  constructor(message: string, public readonly field: string) {
    super(message);
    this.name = 'RowError';
  }
}

function normalizeRow(row: CsvStationRow): CsvStationRow {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value?.trim().replace(/\s+/g, ' ') ?? '']),
  );

  assertAllowedCharacters(normalized.cnpj, /^[\d\s.,/+Ee-]+$/, 'cnpj', 'CNPJ contém caracteres inválidos.');
  assertAllowedCharacters(normalized.cpf_responsavel, /^[\d\s.-]+$/, 'cpf_responsavel', 'CPF contém caracteres inválidos.');
  assertAllowedCharacters(normalized.cep, /^[\d\s-]+$/, 'cep', 'CEP contém caracteres inválidos.');

  normalized.cnpj = normalizeCnpj(normalized.cnpj);
  normalized.cpf_responsavel = normalized.cpf_responsavel.replace(/\D/g, '');
  normalized.cep = normalizeCep(normalized.cep);
  normalized.uf = normalized.uf.toUpperCase();
  normalized.email_responsavel = normalized.email_responsavel.toLowerCase();

  try {
    normalized.data_inauguracao = normalizeDate(normalized.data_inauguracao);
  } catch (error) {
    if (error instanceof InvalidDateError) {
      throw new RowError(error.message, 'data_inauguracao');
    }
    throw error;
  }

  normalized.combustiveis = splitList(normalized.combustiveis).join(',');
  return normalized;
}

function assertAllowedCharacters(value: string, pattern: RegExp, field: string, message: string): void {
  if (value && !pattern.test(value)) throw new RowError(message, field);
}

function validateRow(row: CsvStationRow): void {
  if (!isValidCnpj(row.cnpj)) throw new RowError('CNPJ inválido.', 'cnpj');
  if (!row.nome_posto) throw new RowError('Nome do posto é obrigatório.', 'nome_posto');
  if (!row.bandeira) throw new RowError('Bandeira é obrigatória.', 'bandeira');
  if (!row.logradouro) throw new RowError('Logradouro é obrigatório.', 'logradouro');
  if (!row.bairro) throw new RowError('Bairro é obrigatório.', 'bairro');
  if (!row.municipio) throw new RowError('Município é obrigatório.', 'municipio');
  if (!/^[A-Z]{2}$/.test(row.uf)) {
    throw new RowError('UF deve conter duas letras.', 'uf');
  }
  if (!hasExactDigits(row.cep, 8)) throw new RowError('CEP deve conter 8 dígitos.', 'cep');
  if (!isValidCpf(row.cpf_responsavel)) {
    throw new RowError('CPF inválido.', 'cpf_responsavel');
  }
  if (!row.nome_responsavel) {
    throw new RowError('Nome do responsável é obrigatório.', 'nome_responsavel');
  }
  if (row.email_responsavel && !isValidEmail(row.email_responsavel)) {
    throw new RowError('Email inválido.', 'email_responsavel');
  }
  if (!row.combustiveis || splitList(row.combustiveis).length === 0) {
    throw new RowError('Ao menos um combustível é obrigatório.', 'combustiveis');
  }
  if (!row.status) throw new RowError('Status é obrigatório.', 'status');

  const maxPostgresInteger = 2147483647n;
  for (const field of ['numero_bicos', 'numero_pistas']) {
    if (!row[field]) continue;
    if (!/^\d+$/.test(row[field]) || BigInt(row[field]) > maxPostgresInteger) {
      throw new RowError('O valor deve ser um inteiro não negativo até 2147483647.', field);
    }
  }
}

async function ensureCatalog(database: DatabaseClient, table: 'brands' | 'fuels', value: string): Promise<string> {
  const name = value.trim();
  const result = await database.query<{ id: string }>(
    `INSERT INTO ${table} (name, normalized_name) VALUES ($1, $2)
     ON CONFLICT (normalized_name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [name, normalizeName(name)],
  );
  return result.rows[0].id;
}

async function ensureStatus(database: DatabaseClient, value: string): Promise<string> {
  const normalized = normalizeName(value);
  const result = await database.query<{ id: string }>(
    'SELECT id FROM station_statuses WHERE normalized_name = $1',
    [normalized === 'manutencao' ? 'em manutencao' : normalized],
  );
  if (!result.rows[0]) throw new RowError('Status não cadastrado no catálogo.', 'status');
  return result.rows[0].id;
}

async function ensureResponsible(database: DatabaseClient, row: CsvStationRow): Promise<string> {
  const position = await database.query<{ id: string }>(
    `INSERT INTO responsible_positions (name) VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [row.cargo_responsavel],
  );
  const responsible = await database.query<{ id: string }>(
    `INSERT INTO responsibles (cpf, name, email, position_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (cpf) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
       position_id = EXCLUDED.position_id, updated_at = NOW() RETURNING id`,
    [row.cpf_responsavel, nullable(row.nome_responsavel), nullable(row.email_responsavel), position.rows[0].id],
  );
  return responsible.rows[0].id;
}

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function splitList(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function nullable(value: string): string | null { return value || null; }
function toInteger(value: string): number | null { return value ? Number(value) : null; }
