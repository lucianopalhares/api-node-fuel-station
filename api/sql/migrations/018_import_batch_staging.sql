-- Operação: replace da constraint de status e insert dos índices.
-- Arquivo original: /home/dev/dev/desafios/ipdv/api/sql/migrations/011_import_rows.sql
-- Motivo: permitir que import_rows funcione como staging antes da aplicação definitiva.

ALTER TABLE import_rows
  DROP CONSTRAINT IF EXISTS import_rows_status_chk;

ALTER TABLE import_rows
  ADD CONSTRAINT import_rows_status_chk CHECK (
    status IN ('pending', 'ready', 'imported', 'updated', 'skipped', 'invalid')
  );

ALTER TABLE import_rows
  ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS import_rows_ready_cursor_idx
  ON import_rows (import_id, status, row_number);

