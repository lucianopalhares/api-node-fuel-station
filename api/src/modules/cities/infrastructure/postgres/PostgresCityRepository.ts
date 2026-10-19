// buscar cidade no banco de dados

import { Pool } from 'pg';
import { City } from '../../domain/entities/City';
import { CityRepository, CitySearch } from '../../domain/repositories/CityRepository';

type CityRow = { ibge_code: number; name: string; state_ibge_code: number; abbreviation: string; state_name: string; region: string };

export class PostgresCityRepository implements CityRepository {
  constructor(private readonly pool: Pool) {}

  async list(search: CitySearch): Promise<City[]> {
    const values: unknown[] = [];
    const conditions: string[] = [];
    if (search.stateAbbreviation) { values.push(search.stateAbbreviation); conditions.push(`s.abbreviation = $${values.length}`); }
    if (search.normalizedName) { values.push(`%${search.normalizedName}%`); conditions.push(`c.normalized_name LIKE $${values.length}`); }
    values.push(search.limit);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await this.pool.query<CityRow>(
      `SELECT c.ibge_code, c.name, s.ibge_code AS state_ibge_code, s.abbreviation,
              s.name AS state_name, s.region
         FROM cities c JOIN states s ON s.id = c.state_id ${where}
        ORDER BY s.abbreviation, c.name LIMIT $${values.length}`,
      values,
    );
    return result.rows.map(toCity);
  }

  async findByIbgeCode(ibgeCode: number): Promise<City | null> {
    const result = await this.pool.query<CityRow>(
      `SELECT c.ibge_code, c.name, s.ibge_code AS state_ibge_code, s.abbreviation,
              s.name AS state_name, s.region
         FROM cities c JOIN states s ON s.id = c.state_id WHERE c.ibge_code = $1`,
      [ibgeCode],
    );
    return result.rows[0] ? toCity(result.rows[0]) : null;
  }
}

function toCity(row: CityRow): City {
  return {
    ibgeCode: row.ibge_code,
    name: row.name,
    state: { ibgeCode: row.state_ibge_code, abbreviation: row.abbreviation.trim(), name: row.state_name, region: row.region },
  };
}
