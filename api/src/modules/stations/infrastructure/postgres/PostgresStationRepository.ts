import { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import { Station } from '../../domain/entities/Station';
import { StationRepository } from '../../domain/repositories/StationRepository';

type StationRow = {
  id: string;
  cnpj: string;
  legal_name: string;
  trade_name: string | null;
  brand_id: string | null;
  brand_name: string | null;
  street: string | null;
  address_number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city_ibge_code: number | null;
  city: string;
  state: string;
  postal_code: string | null;
  responsible_id: string | null;
  responsible_cpf: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  responsible_position: string | null;
  fuels: string[] | null;
  status: string;
  opening_date: string | null;
  pump_count: number | null;
  lane_count: number | null;
  notes: string | null;
  updated_at: string;
  last_import_id: string | null;
  last_import_date: string | null;
};

export class PostgresStationRepository implements StationRepository {
  constructor(private readonly database: DatabaseClient) {}

  async list(limit: number, offset: number, search?: string): Promise<Station[]> {
    const searchPattern = search ? `%${search}%` : null;
    const result = await this.database.query<StationRow>(
      `SELECT s.id,
              s.cnpj,
              s.nome_posto AS legal_name,
              s.nome_fantasia AS trade_name,
              b.id AS brand_id,
              b.name AS brand_name,
              s.logradouro AS street,
              s.numero AS address_number,
              s.complemento AS complement,
              s.bairro AS neighborhood,
              c.ibge_code AS city_ibge_code,
              c.name AS city,
              st.abbreviation AS state,
              s.cep AS postal_code,
              r.id AS responsible_id,
              r.cpf AS responsible_cpf,
              r.name AS responsible_name,
              r.email AS responsible_email,
              rp.name AS responsible_position,
              COALESCE(ARRAY_AGG(f.name ORDER BY f.name) FILTER (WHERE f.id IS NOT NULL), ARRAY[]::VARCHAR[]) AS fuels,
              ss.name AS status,
              s.data_inauguracao::TEXT AS opening_date,
              s.numero_bicos AS pump_count,
              s.numero_pistas AS lane_count,
              s.observacoes AS notes,
              s.updated_at::TEXT AS updated_at,
              last_import.id AS last_import_id,
              last_import.imported_at::TEXT AS last_import_date
        FROM stations s
        JOIN station_statuses ss ON ss.id = s.status_id
        LEFT JOIN brands b ON b.id = s.brand_id
        JOIN cities c ON c.ibge_code = s.city_ibge_code
        JOIN states st ON st.id = c.state_id
        LEFT JOIN responsibles r ON r.id = s.responsible_id
        LEFT JOIN responsible_positions rp ON rp.id = r.position_id
        LEFT JOIN station_fuels sf ON sf.station_id = s.id
        LEFT JOIN fuels f ON f.id = sf.fuel_id
        LEFT JOIN LATERAL (
          SELECT i.id,
                 COALESCE(i.finished_at, i.started_at) AS imported_at
            FROM import_rows ir
            JOIN imports i ON i.id = ir.import_id
           WHERE ir.station_id = s.id
             AND ir.status IN ('imported', 'updated')
           ORDER BY COALESCE(i.finished_at, i.started_at) DESC NULLS LAST, i.id DESC
           LIMIT 1
        ) last_import ON TRUE
        WHERE ($1::TEXT IS NULL
          OR s.cnpj ILIKE $1
          OR s.nome_posto ILIKE $1
          OR s.nome_fantasia ILIKE $1
          OR b.name ILIKE $1
          OR c.name ILIKE $1
          OR st.abbreviation ILIKE $1)
        GROUP BY s.id, b.id, c.ibge_code, st.abbreviation, r.id, rp.id, ss.id,
                 s.updated_at,
                 last_import.id, last_import.imported_at
        ORDER BY s.nome_fantasia NULLS LAST, s.nome_posto, s.cnpj
        LIMIT $2 OFFSET $3`,
      [searchPattern, limit, offset],
    );

    return result.rows.map(toStation);
  }
}

function toStation(row: StationRow): Station {
  return {
    id: row.id,
    cnpj: row.cnpj,
    legalName: row.legal_name,
    tradeName: row.trade_name,
    brand: row.brand_id && row.brand_name ? { id: row.brand_id, name: row.brand_name } : null,
    address: {
      street: row.street,
      number: row.address_number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      cityIbgeCode: row.city_ibge_code,
      city: row.city,
      state: row.state.trim(),
      postalCode: row.postal_code,
    },
    responsible: row.responsible_id && row.responsible_cpf
      ? {
          id: row.responsible_id,
          cpf: row.responsible_cpf,
          name: row.responsible_name,
          email: row.responsible_email,
          position: row.responsible_position,
        }
      : null,
    fuels: row.fuels ?? [],
    status: row.status,
    openingDate: row.opening_date,
    pumpCount: row.pump_count,
    laneCount: row.lane_count,
    notes: row.notes,
    updatedAt: row.updated_at,
    lastImport: row.last_import_id && row.last_import_date
      ? { id: row.last_import_id, date: row.last_import_date }
      : null,
  };
}
