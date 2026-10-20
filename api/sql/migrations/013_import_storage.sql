-- a API persiste os metadados do arquivo no storage na tabela imports.

ALTER TABLE imports
  ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(255),
  ADD COLUMN IF NOT EXISTS storage_key TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS content_type VARCHAR(255);
