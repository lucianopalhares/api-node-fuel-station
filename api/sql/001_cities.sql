-- tabelas de estados e municípios.

CREATE TABLE IF NOT EXISTS states (
  id BIGSERIAL PRIMARY KEY,
  ibge_code INTEGER NOT NULL UNIQUE,
  abbreviation CHAR(2) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
  ibge_code INTEGER PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  normalized_name VARCHAR(150) NOT NULL,
  state_id BIGINT NOT NULL REFERENCES states (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cities_state_id_idx ON cities (state_id);
CREATE INDEX IF NOT EXISTS cities_normalized_name_idx ON cities (normalized_name);
