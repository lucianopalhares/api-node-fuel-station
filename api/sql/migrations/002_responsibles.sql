-- estrutura tabela do responsavel com o cargo

CREATE TABLE IF NOT EXISTS responsible_positions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS responsibles (
  id BIGSERIAL PRIMARY KEY,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  name VARCHAR(150),
  email VARCHAR(254),
  position_id BIGINT REFERENCES responsible_positions (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT responsibles_cpf_format_chk CHECK (cpf ~ '^[0-9]{11}$')
);

CREATE INDEX IF NOT EXISTS responsibles_name_idx ON responsibles (name);
CREATE INDEX IF NOT EXISTS responsibles_position_id_idx ON responsibles (position_id);
