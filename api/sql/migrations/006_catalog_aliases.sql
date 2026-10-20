-- aliases aceitos durante a normalizacao da importacao.

CREATE TABLE IF NOT EXISTS brand_aliases (
  id BIGSERIAL PRIMARY KEY,
  brand_id BIGINT NOT NULL REFERENCES brands (id) ON DELETE CASCADE,
  alias VARCHAR(120) NOT NULL,
  normalized_alias VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS brand_aliases_brand_id_idx
  ON brand_aliases (brand_id);

CREATE TABLE IF NOT EXISTS fuel_aliases (
  id BIGSERIAL PRIMARY KEY,
  fuel_id BIGINT NOT NULL REFERENCES fuels (id) ON DELETE CASCADE,
  alias VARCHAR(80) NOT NULL,
  normalized_alias VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fuel_aliases_fuel_id_idx
  ON fuel_aliases (fuel_id);
