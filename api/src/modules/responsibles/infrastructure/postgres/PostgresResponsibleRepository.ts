import { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import { Responsible } from '../../domain/entities/Responsible';
import { ResponsibleInput, ResponsibleRepository } from '../../domain/repositories/ResponsibleRepository';

type ResponsibleRow = {
  id: string;
  cpf: string;
  name: string | null;
  email: string | null;
  position_id: string | null;
  position_name: string | null;
};

export class PostgresResponsibleRepository implements ResponsibleRepository {
  constructor(private readonly database: DatabaseClient) {}

  async list(limit: number): Promise<Responsible[]> {
    const result = await this.database.query<ResponsibleRow>(
      `SELECT r.id, r.cpf, r.name, r.email,
              rp.id AS position_id, rp.name AS position_name
         FROM responsibles r
         LEFT JOIN responsible_positions rp ON rp.id = r.position_id
        ORDER BY r.name NULLS LAST, r.cpf
        LIMIT $1`,
      [limit],
    );
    return result.rows.map(toResponsible);
  }

  async findByCpf(cpf: string): Promise<Responsible | null> {
    const result = await this.database.query<ResponsibleRow>(
      `SELECT r.id, r.cpf, r.name, r.email,
              rp.id AS position_id, rp.name AS position_name
         FROM responsibles r
         LEFT JOIN responsible_positions rp ON rp.id = r.position_id
        WHERE r.cpf = $1`,
      [cpf],
    );
    return result.rows[0] ? toResponsible(result.rows[0]) : null;
  }

  async create(input: ResponsibleInput): Promise<Responsible> {
    await this.database.query<ResponsibleRow>(
      `INSERT INTO responsibles (cpf, name, email, position_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, cpf, name, email, position_id`,
      [input.cpf, input.name ?? null, input.email ?? null, input.positionId ?? null],
    );
    const responsible = await this.findByCpf(input.cpf);
    if (!responsible) throw new Error('responsável criado não pôde ser recuperado');
    return responsible;
  }
}

function toResponsible(row: ResponsibleRow): Responsible {
  return {
    id: row.id,
    cpf: row.cpf,
    name: row.name,
    email: row.email,
    position: row.position_id && row.position_name
      ? { id: row.position_id, name: row.position_name }
      : null,
  };
}
