-- seed idempotente de catalogos oficiais de producao.
-- Nao insere postos, responsaveis ou cidades de demonstracao.

INSERT INTO brands (name, normalized_name)
VALUES
  ('Petrobras', 'petrobras'),
  ('Shell', 'shell'),
  ('Ipiranga', 'ipiranga'),
  ('Raízen', 'raizen'),
  ('Vibra Energia', 'vibra energia'),
  ('Alesat', 'alesat'),
  ('Atem', 'atem'),
  ('Bandeirante', 'bandeirante'),
  ('Total', 'total'),
  ('Repsol', 'repsol'),
  ('Branca', 'branca')
ON CONFLICT (normalized_name) DO NOTHING;

INSERT INTO fuels (name, normalized_name)
VALUES
  ('Gasolina Comum', 'gasolina comum'),
  ('Gasolina Aditivada', 'gasolina aditivada'),
  ('Etanol', 'etanol'),
  ('Diesel S10', 'diesel s10'),
  ('Diesel Comum', 'diesel comum'),
  ('GNV', 'gnv'),
  ('Arla 32', 'arla 32')
ON CONFLICT (normalized_name) DO NOTHING;

INSERT INTO brand_aliases (brand_id, alias, normalized_alias)
SELECT b.id, v.alias, v.normalized_alias
  FROM brands b
  JOIN (VALUES
    ('Petrobras', 'BR Petrobras', 'br petrobras'),
    ('Raízen', 'Raizen', 'raizen'),
    ('Vibra Energia', 'Vibra', 'vibra'),
    ('Alesat', 'Ale', 'ale')
  ) AS v(brand_name, alias, normalized_alias)
    ON v.brand_name = b.name
ON CONFLICT (normalized_alias) DO NOTHING;

INSERT INTO fuel_aliases (fuel_id, alias, normalized_alias)
SELECT f.id, v.alias, v.normalized_alias
  FROM fuels f
  JOIN (VALUES
    ('Diesel S10', 'Diesel S-10', 'diesel s10'),
    ('Gasolina Comum', 'Gasolina', 'gasolina'),
    ('GNV', 'Gás Natural Veicular', 'gas natural veicular')
  ) AS v(fuel_name, alias, normalized_alias)
    ON v.fuel_name = f.name
ON CONFLICT (normalized_alias) DO NOTHING;
