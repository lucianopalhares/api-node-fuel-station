/** resolve e salva catalogos: combustiveis, bandeiras, cidades, cargo do responsavel, etc.. de um lote no PostgreSQL. */

import type { DatabaseClient } from '../../../../../shared/infrastructure/database/DatabaseClient';
import type { CatalogBatchRepository } from '../../../../domain/repositories/CatalogBatchRepository';
import type { ReadyImportRow } from '../../../../application/staging/types';
import type { BatchCatalogs } from '../../../../application/batch-apply/types';

export class PostgresCatalogBatchRepository implements CatalogBatchRepository {
  async resolve(database: DatabaseClient, rows: ReadyImportRow[]): Promise<BatchCatalogs> {
    const brands = unique(rows.map((row) => row.normalizedData.bandeira));
    const fuels = unique(rows.flatMap((row) => row.normalizedData.combustiveis.split(',')));
    const positions = unique(rows.map((row) => row.normalizedData.cargo_responsavel));
    const cityNames = unique(rows.map((row) => normalizeName(row.normalizedData.municipio)));
    const states = unique(rows.map((row) => row.normalizedData.uf));
    const statuses = unique(rows.map((row) => normalizeStatus(row.normalizedData.status)));

    await insertNamed(database, 'brands', brands);
    await insertNamed(database, 'fuels', fuels);
    await insertNamed(database, 'responsible_positions', positions);

    const [brandRows, fuelRows, positionRows, cityRows, statusRows] = await Promise.all([
      database.query<{ normalized_name: string; id: string }>('SELECT normalized_name, id FROM brands WHERE normalized_name = ANY($1::text[])', [brands.map(normalizeName)]),
      database.query<{ normalized_name: string; id: string }>('SELECT normalized_name, id FROM fuels WHERE normalized_name = ANY($1::text[])', [fuels.map(normalizeName)]),
      database.query<{ name: string; id: string }>('SELECT name, id FROM responsible_positions WHERE name = ANY($1::text[])', [positions]),
      database.query<{ normalized_name: string; abbreviation: string; ibge_code: number }>(
        `SELECT c.normalized_name, s.abbreviation, c.ibge_code
           FROM cities c JOIN states s ON s.id = c.state_id
          WHERE c.normalized_name = ANY($1::text[]) AND s.abbreviation = ANY($2::text[])`,
        [cityNames, states],
      ),
      database.query<{ normalized_name: string; id: string }>('SELECT normalized_name, id FROM station_statuses WHERE normalized_name = ANY($1::text[])', [statuses]),
    ]);

    return {
      brandIds: new Map(brandRows.rows.map((row) => [row.normalized_name, row.id])),
      fuelIds: new Map(fuelRows.rows.map((row) => [row.normalized_name, row.id])),
      positionIds: new Map(positionRows.rows.map((row) => [normalizeName(row.name), row.id])),
      cityIds: new Map(cityRows.rows.map((row) => [`${row.normalized_name}|${row.abbreviation}`, row.ibge_code])),
      statusIds: new Map(statusRows.rows.map((row) => [row.normalized_name, row.id])),
    };
  }
}

async function insertNamed(database: DatabaseClient, table: 'brands' | 'fuels' | 'responsible_positions', values: string[]): Promise<void> {
  if (!values.length) return;
  const params: unknown[] = [];
  const placeholders = values.map((value, index) => {
    const offset = index * 2;
    params.push(value, normalizeName(value));
    return `($${offset + 1}, $${offset + 2})`;
  });
  const normalizedColumn = table === 'responsible_positions' ? 'name' : 'normalized_name';
  const update = table === 'responsible_positions' ? 'name = EXCLUDED.name' : 'name = EXCLUDED.name';
  const columns = table === 'responsible_positions' ? '(name)' : '(name, normalized_name)';
  const prepared = table === 'responsible_positions'
    ? values.map((value, index) => `$${index + 1}`).join(',')
    : placeholders.join(',');

  if (table === 'responsible_positions') {
    await database.query(
      `INSERT INTO ${table} ${columns} VALUES ${values.map((_, index) => `($${index + 1})`).join(',')}
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name`,
      values,
    );
    return;
  }

  await database.query(
    `INSERT INTO ${table} ${columns} VALUES ${prepared}
     ON CONFLICT (${normalizedColumn}) DO UPDATE SET ${update}`,
    params,
  );
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeStatus(value: string): string {
  const normalized = normalizeName(value);
  return normalized === 'manutencao' ? 'em manutencao' : normalized;
}

