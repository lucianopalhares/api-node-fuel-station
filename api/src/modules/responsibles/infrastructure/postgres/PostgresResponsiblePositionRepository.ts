import { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import { ResponsiblePosition } from '../../domain/entities/ResponsiblePosition';
import { ResponsiblePositionRepository } from '../../domain/repositories/ResponsiblePositionRepository';

type PositionRow = { id: string; name: string };

export class PostgresResponsiblePositionRepository implements ResponsiblePositionRepository {
  constructor(private readonly database: DatabaseClient) {}

  async findByName(name: string): Promise<ResponsiblePosition | null> {
    const result = await this.database.query<PositionRow>(
      'SELECT id, name FROM responsible_positions WHERE name = $1',
      [name],
    );
    return result.rows[0] ?? null;
  }

  async create(name: string): Promise<ResponsiblePosition> {
    const result = await this.database.query<PositionRow>(
      `INSERT INTO responsible_positions (name)
       VALUES ($1)
       RETURNING id, name`,
      [name],
    );
    return result.rows[0];
  }
}
