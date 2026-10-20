-- tabela do posto de combustivel

CREATE TABLE IF NOT EXISTS stations (
  id BIGSERIAL PRIMARY KEY,
  cnpj VARCHAR(14) NOT NULL UNIQUE,
  nome_posto VARCHAR(200) NOT NULL,
  nome_fantasia VARCHAR(150),
  brand_id BIGINT REFERENCES brands (id),
  logradouro VARCHAR(200),
  numero VARCHAR(30),
  complemento VARCHAR(120),
  bairro VARCHAR(120),
  city_ibge_code INTEGER REFERENCES cities (ibge_code),
  municipio VARCHAR(150) NOT NULL,
  uf CHAR(2) NOT NULL,
  cep VARCHAR(8),
  responsible_id BIGINT REFERENCES responsibles (id),
  status VARCHAR(30) NOT NULL,
  data_inauguracao DATE,
  numero_bicos INTEGER,
  numero_pistas INTEGER,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stations_cnpj_format_chk CHECK (cnpj ~ '^[0-9]{14}$'),
  CONSTRAINT stations_uf_format_chk CHECK (uf ~ '^[A-Z]{2}$'),
  CONSTRAINT stations_cep_format_chk CHECK (cep IS NULL OR cep ~ '^[0-9]{8}$'),
  CONSTRAINT stations_numero_bicos_chk CHECK (numero_bicos IS NULL OR numero_bicos >= 0),
  CONSTRAINT stations_numero_pistas_chk CHECK (numero_pistas IS NULL OR numero_pistas >= 0)
);

CREATE INDEX IF NOT EXISTS stations_municipio_uf_idx ON stations (municipio, uf);
CREATE INDEX IF NOT EXISTS stations_brand_id_idx ON stations (brand_id);
CREATE INDEX IF NOT EXISTS stations_responsible_id_idx ON stations (responsible_id);

-- relacionar posto de combustivel com o tipo de combustivel que ele usa

CREATE TABLE IF NOT EXISTS station_fuels (
  station_id BIGINT NOT NULL REFERENCES stations (id) ON DELETE CASCADE,
  fuel_id BIGINT NOT NULL REFERENCES fuels (id),
  PRIMARY KEY (station_id, fuel_id)
);
