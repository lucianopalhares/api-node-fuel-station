/*
  manter o adapter PostgreSQL na infraestrutura compartilhada, fora do módulo de cidades.
*/

import { Pool } from 'pg';
import { DatabaseClient } from './DatabaseClient';

export class PostgresDatabaseClient implements DatabaseClient {
  constructor(private readonly pool: Pool) {}

  async query<T>(text: string, values: unknown[] = []): Promise<{ rows: T[] }> {
    const result = await this.pool.query(text, values);
    return { rows: result.rows as T[] };
  }

  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    const transactionClient: DatabaseClient = {
      query: async <R>(text: string, values: unknown[] = []) => {
        const result = await client.query(text, values);
        return { rows: result.rows as R[] };
      },
      transaction: async <R>(nestedCallback: (nestedClient: DatabaseClient) => Promise<R>) =>
        nestedCallback(transactionClient),
    };

    try {
      await client.query('BEGIN');
      const result = await callback(transactionClient);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
