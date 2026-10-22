/** salva responsáveis, de um lote em um upsert no PostgreSQL. */

import type { DatabaseClient } from '../../../../../shared/infrastructure/database/DatabaseClient';
import type { ResponsibleBatchRepository } from '../../../../domain/repositories/ResponsibleBatchRepository';
import type { ReadyImportRow } from '../../../../application/staging/types';
import type { BatchCatalogs } from '../../../../application/batch-apply/types';

export class PostgresResponsibleBatchRepository implements ResponsibleBatchRepository {
  async upsert(database: DatabaseClient, rows: ReadyImportRow[], catalogs: BatchCatalogs): Promise<Map<string, string>> {
    const distinct = [...new Map(rows.map((row) => [row.normalizedData.cpf_responsavel, row])).values()];
    const values: unknown[] = [];
    const placeholders = distinct.map((row, index) => {
      const data = row.normalizedData;
      const offset = index * 4;
      values.push(data.cpf_responsavel, nullable(data.nome_responsavel), nullable(data.email_responsavel), catalogs.positionIds.get(normalizeName(data.cargo_responsavel)));
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`;
    });

    await database.query(
      `INSERT INTO responsibles (cpf, name, email, position_id)
       VALUES ${placeholders.join(',')}
       ON CONFLICT (cpf) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email,
         position_id = EXCLUDED.position_id, updated_at = NOW()`,
      values,
    );

    const result = await database.query<{ cpf: string; id: string }>(
      'SELECT cpf, id FROM responsibles WHERE cpf = ANY($1::text[])',
      [distinct.map((row) => row.normalizedData.cpf_responsavel)],
    );
    return new Map(result.rows.map((row) => [row.cpf, row.id]));
  }
}

function nullable(value: string): string | null { return value || null; }
function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

