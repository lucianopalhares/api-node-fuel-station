import type { DatabaseClient } from '../../../shared/infrastructure/database/DatabaseClient';
import type {
  StationExportCursor,
  StationExportRepository,
  StationExportRow,
} from '../../domain/repositories/StationExportRepository';

type StationExportDatabaseRow = {
  id: string;
  updated_at: string;
  cnpj: string;
  nome_posto: string;
  nome_fantasia: string | null;
  bandeira: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string;
  uf: string;
  cep: string | null;
  cpf_responsavel: string | null;
  nome_responsavel: string | null;
  email_responsavel: string | null;
  cargo_responsavel: string | null;
  combustiveis: string[] | null;
  status: string;
  data_inauguracao: string | null;
  numero_bicos: number | null;
  numero_pistas: number | null;
  observacoes: string | null;
};

export class PostgresStationExportRepository implements StationExportRepository {
  constructor(private readonly database: DatabaseClient) {}

  async listPage(
    cursor: StationExportCursor | undefined,
    limit: number,
  ): Promise<StationExportRow[]> {
    const result = await this.database.query<StationExportDatabaseRow>(
      `SELECT s.id::TEXT,
              s.updated_at::TEXT AS updated_at,
              s.cnpj,
              s.nome_posto,
              s.nome_fantasia,
              b.name AS bandeira,
              s.logradouro,
              s.numero,
              s.complemento,
              s.bairro,
              c.name AS municipio,
              st.abbreviation AS uf,
              s.cep,
              r.cpf AS cpf_responsavel,
              r.name AS nome_responsavel,
              r.email AS email_responsavel,
              rp.name AS cargo_responsavel,
              COALESCE(
                ARRAY_AGG(f.name ORDER BY f.name) FILTER (WHERE f.id IS NOT NULL),
                ARRAY[]::VARCHAR[]
              ) AS combustiveis,
              ss.name AS status,
              TO_CHAR(s.data_inauguracao, 'DD/MM/YYYY') AS data_inauguracao,
              s.numero_bicos,
              s.numero_pistas,
              s.observacoes
         FROM stations s
         JOIN station_statuses ss ON ss.id = s.status_id
         LEFT JOIN brands b ON b.id = s.brand_id
         LEFT JOIN cities c ON c.ibge_code = s.city_ibge_code
         LEFT JOIN states st ON st.id = c.state_id
         LEFT JOIN responsibles r ON r.id = s.responsible_id
         LEFT JOIN responsible_positions rp ON rp.id = r.position_id
         LEFT JOIN station_fuels sf ON sf.station_id = s.id
         LEFT JOIN fuels f ON f.id = sf.fuel_id
        WHERE ($1::TIMESTAMPTZ IS NULL
           OR s.updated_at < $1::TIMESTAMPTZ
           OR (s.updated_at = $1::TIMESTAMPTZ AND s.id < $2::BIGINT))
        GROUP BY s.id, b.id, c.ibge_code, st.id, r.id, rp.id, ss.id
        ORDER BY s.updated_at DESC, s.id DESC
        LIMIT $3`,
      [cursor?.updatedAt ?? null, cursor?.id ?? null, limit],
    );

    return result.rows.map((row) => ({
      cursor: { updatedAt: row.updated_at, id: row.id },
      record: {
        cnpj: row.cnpj,
        nome_posto: row.nome_posto,
        nome_fantasia: row.nome_fantasia,
        bandeira: row.bandeira,
        logradouro: row.logradouro,
        numero: row.numero,
        complemento: row.complemento,
        bairro: row.bairro,
        municipio: row.municipio,
        uf: row.uf,
        cep: row.cep,
        cpf_responsavel: row.cpf_responsavel,
        nome_responsavel: row.nome_responsavel,
        email_responsavel: row.email_responsavel,
        cargo_responsavel: row.cargo_responsavel,
        combustiveis: row.combustiveis?.join(',') ?? '',
        status: row.status,
        data_inauguracao: row.data_inauguracao,
        numero_bicos: row.numero_bicos,
        numero_pistas: row.numero_pistas,
        observacoes: row.observacoes,
      },
    }));
  }
}
