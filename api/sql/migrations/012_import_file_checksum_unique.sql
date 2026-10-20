-- Arquivo novo: migration idempotente para garantir uma importação por checksum.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'imports_file_checksum_unique'
       AND conrelid = 'imports'::regclass
  ) THEN
    ALTER TABLE imports
      ADD CONSTRAINT imports_file_checksum_unique UNIQUE (file_checksum);
  END IF;
END
$$;
