-- combustiveis informados em cada linha de cada importacao.

CREATE TABLE IF NOT EXISTS station_import_fuels (
  import_id BIGINT NOT NULL,
  station_id BIGINT NOT NULL,
  fuel_id BIGINT NOT NULL REFERENCES fuels (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (import_id, station_id, fuel_id),
  FOREIGN KEY (import_id, station_id)
    REFERENCES station_imports (import_id, station_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS station_import_fuels_fuel_id_idx
  ON station_import_fuels (fuel_id);
