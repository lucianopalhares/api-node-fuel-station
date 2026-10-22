/** Grava ou atualiza postos em lote usando o CNPJ como chave idempotente. */

import type { DatabaseClient } from '../../../../../shared/infrastructure/database/DatabaseClient';
import type { StationBatchRepository } from '../../../../domain/repositories/StationBatchRepository';
import type { ReadyImportRow } from '../../../../application/staging/types';
import type { BatchCatalogs, BatchStationResult } from '../../../../application/batch-apply/types';

export class PostgresStationBatchRepository implements StationBatchRepository {
  async upsert(database: DatabaseClient, rows: ReadyImportRow[], catalogs: BatchCatalogs, responsibleIds: Map<string, string>): Promise<BatchStationResult[]> {
    const effectiveRows = [...new Map(rows.map((row) => [row.normalizedData.cnpj, row])).values()];
    const cnpjs = effectiveRows.map((row) => row.normalizedData.cnpj);
    const existing = await database.query<{ cnpj: string; id: string }>('SELECT cnpj, id FROM stations WHERE cnpj = ANY($1::text[])', [cnpjs]);
    const existingIds = new Set(existing.rows.map((row) => row.cnpj));
    const values: unknown[] = [];
    const placeholders = effectiveRows.map((row, index) => {
      const data = row.normalizedData;
      const cityId = catalogs.cityIds.get(`${normalizeName(data.municipio)}|${data.uf}`);
      const brandId = catalogs.brandIds.get(normalizeName(data.bandeira));
      const statusId = catalogs.statusIds.get(normalizeStatus(data.status));
      const responsibleId = responsibleIds.get(data.cpf_responsavel);
      const offset = index * 16;
      values.push(
        data.cnpj, data.nome_posto, nullable(data.nome_fantasia), brandId,
        nullable(data.logradouro), nullable(data.numero), nullable(data.complemento), nullable(data.bairro),
        cityId, nullable(data.cep), responsibleId, nullable(data.data_inauguracao),
        toInteger(data.numero_bicos), toInteger(data.numero_pistas), nullable(data.observacoes), statusId,
      );
      return `($${offset + 1},$${offset + 2},$${offset + 3},$${offset + 4},$${offset + 5},$${offset + 6},$${offset + 7},$${offset + 8},$${offset + 9},$${offset + 10},$${offset + 11},$${offset + 12},$${offset + 13},$${offset + 14},$${offset + 15},$${offset + 16})`;
    });

    const result = await database.query<{ cnpj: string; id: string }>(
      `INSERT INTO stations (
        cnpj, nome_posto, nome_fantasia, brand_id, logradouro, numero, complemento,
        bairro, city_ibge_code, cep, responsible_id, data_inauguracao,
        numero_bicos, numero_pistas, observacoes, status_id
      ) VALUES ${placeholders.join(',')}
      ON CONFLICT (cnpj) DO UPDATE SET
        nome_posto = EXCLUDED.nome_posto, nome_fantasia = EXCLUDED.nome_fantasia,
        brand_id = EXCLUDED.brand_id, logradouro = EXCLUDED.logradouro, numero = EXCLUDED.numero,
        complemento = EXCLUDED.complemento, bairro = EXCLUDED.bairro, city_ibge_code = EXCLUDED.city_ibge_code,
        cep = EXCLUDED.cep, responsible_id = EXCLUDED.responsible_id,
        data_inauguracao = EXCLUDED.data_inauguracao, numero_bicos = EXCLUDED.numero_bicos,
        numero_pistas = EXCLUDED.numero_pistas, observacoes = EXCLUDED.observacoes,
        status_id = EXCLUDED.status_id, updated_at = NOW()
      RETURNING cnpj, id`,
      values,
    );

    const ids = new Map(result.rows.map((row) => [row.cnpj, row.id]));
    return rows.map((row) => ({
      rowNumber: row.rowNumber,
      cnpj: row.normalizedData.cnpj,
      stationId: ids.get(row.normalizedData.cnpj)!,
      status: existingIds.has(row.normalizedData.cnpj) ? 'updated' : 'imported',
    }));
  }
}

function nullable(value: string): string | null { return value || null; }
function toInteger(value: string): number | null { return value ? Number(value) : null; }
function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}
function normalizeStatus(value: string): string {
  const normalized = normalizeName(value);
  return normalized === 'manutencao' ? 'em manutencao' : normalized;
}

