-- catálogo de status operacionais dos postos.

CREATE TABLE IF NOT EXISTS station_statuses (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  normalized_name VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO station_statuses (name, normalized_name)
VALUES
  ('Ativo', 'ativo'),
  ('Inativo', 'inativo'),
  ('Em manutenção', 'em manutencao'),
  ('Temporariamente fechado', 'temporariamente fechado'),
  ('Interditado', 'interditado')
ON CONFLICT (normalized_name) DO NOTHING;

ALTER TABLE stations
  ADD COLUMN IF NOT EXISTS status_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'stations'
       AND column_name = 'status'
  ) THEN
    UPDATE stations s
       SET status_id = ss.id
      FROM station_statuses ss
     WHERE ss.normalized_name = CASE lower(trim(s.status::TEXT))
       WHEN 'manutenção' THEN 'em manutencao'
       WHEN 'em manutenção' THEN 'em manutencao'
       WHEN 'manutencao' THEN 'em manutencao'
       ELSE lower(trim(s.status::TEXT))
     END;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM stations WHERE status_id IS NULL) THEN
    RAISE EXCEPTION
      'Existem postos com status sem correspondência no catálogo station_statuses.';
  END IF;
END
$$;

ALTER TABLE stations
  ALTER COLUMN status_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'stations_status_id_fkey'
       AND conrelid = 'stations'::regclass
  ) THEN
    ALTER TABLE stations
      ADD CONSTRAINT stations_status_id_fkey
      FOREIGN KEY (status_id) REFERENCES station_statuses (id);
  END IF;
END
$$;

ALTER TABLE stations
  DROP COLUMN IF EXISTS status;

CREATE INDEX IF NOT EXISTS station_statuses_normalized_name_idx
  ON station_statuses (normalized_name);
CREATE INDEX IF NOT EXISTS stations_status_id_idx
  ON stations (status_id);
