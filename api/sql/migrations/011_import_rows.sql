-- substitui station_imports/station_import_fuels por uma linha por linha do CSV.

CREATE TABLE IF NOT EXISTS import_rows (
  id BIGSERIAL PRIMARY KEY,
  import_id BIGINT NOT NULL REFERENCES imports (id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  station_id BIGINT REFERENCES stations (id) ON DELETE SET NULL,
  raw_data JSONB NOT NULL,
  normalized_data JSONB,
  status VARCHAR(20) NOT NULL,
  errors JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT import_rows_row_number_chk CHECK (row_number > 1),
  CONSTRAINT import_rows_status_chk CHECK (
    status IN ('imported', 'updated', 'skipped', 'invalid')
  ),
  CONSTRAINT import_rows_import_row_unique UNIQUE (import_id, row_number)
);

CREATE INDEX IF NOT EXISTS import_rows_import_id_idx
  ON import_rows (import_id);

CREATE INDEX IF NOT EXISTS import_rows_station_id_idx
  ON import_rows (station_id);

-- Preserva os vínculos já existentes quando esta migration for aplicada sobre
-- um banco que tenha as tabelas anteriores. O conteúdo original não pode ser
-- reconstruído retroativamente, por isso registramos sua procedência.
DO $$
BEGIN
  IF to_regclass('public.station_imports') IS NOT NULL THEN
    EXECUTE $migration$
      INSERT INTO import_rows (
        import_id,
        row_number,
        station_id,
        raw_data,
        normalized_data,
        status
      )
      SELECT
        si.import_id,
        si.source_row_number,
        si.station_id,
        jsonb_build_object('source_row_number', si.source_row_number),
        NULL,
        'imported'
      FROM station_imports si
      ON CONFLICT (import_id, row_number) DO NOTHING
    $migration$;
  END IF;
END $$;

-- As tabelas antigas deixam de ser usadas; import_rows concentra a auditoria
-- de linhas válidas e inválidas em uma única estrutura.
DROP TABLE IF EXISTS station_import_fuels;
DROP TABLE IF EXISTS station_imports;
