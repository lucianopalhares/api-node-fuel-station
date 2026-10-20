-- vincula cada posto as importacoes que o produziram ou atualizaram.

CREATE TABLE IF NOT EXISTS station_imports (
  import_id BIGINT NOT NULL REFERENCES imports (id) ON DELETE CASCADE,
  station_id BIGINT NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
  responsible_id BIGINT REFERENCES responsibles (id),
  source_row_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (import_id, station_id),
  CONSTRAINT station_imports_source_row_chk CHECK (source_row_number > 1)
);

CREATE INDEX IF NOT EXISTS station_imports_station_id_idx
  ON station_imports (station_id);

ALTER TABLE station_imports
  ADD COLUMN IF NOT EXISTS responsible_id BIGINT REFERENCES responsibles (id);

CREATE INDEX IF NOT EXISTS station_imports_responsible_id_idx
  ON station_imports (responsible_id);
