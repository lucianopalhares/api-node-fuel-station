-- tabela das importações das planilhas

CREATE TABLE IF NOT EXISTS imports (
  id BIGSERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_checksum VARCHAR(64),
  status VARCHAR(20) NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  updated_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  CONSTRAINT imports_status_chk CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed')),
  CONSTRAINT imports_totals_chk CHECK (
    total_rows >= 0 AND imported_rows >= 0 AND updated_rows >= 0 AND
    skipped_rows >= 0 AND error_rows >= 0
  )
);

CREATE INDEX IF NOT EXISTS imports_started_at_idx ON imports (started_at DESC);

CREATE TABLE IF NOT EXISTS import_errors (
  id BIGSERIAL PRIMARY KEY,
  import_id BIGINT NOT NULL REFERENCES imports (id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  cnpj VARCHAR(14),
  field_name VARCHAR(100),
  error_message TEXT NOT NULL,
  raw_data JSONB,
  CONSTRAINT import_errors_row_number_chk CHECK (row_number > 1)
);

CREATE INDEX IF NOT EXISTS import_errors_import_id_idx ON import_errors (import_id);
