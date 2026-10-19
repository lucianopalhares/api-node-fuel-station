// adaptar pg.Pool ao contrato compartilhado de acesso de dados.

import { Pool } from 'pg';
import { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';

export class PostgresDatabaseClient implements DatabaseClient {
  constructor(private readonly pool: Pool) {}

  async query<T>(text: string, values: unknown[] = []): Promise<{ rows: T[] }> {
    const result = await this.pool.query(text, values);
    return { rows: result.rows as T[] };
  }
}
