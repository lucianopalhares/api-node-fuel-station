-- seed idempotente dos status operacionais dos postos.

INSERT INTO station_statuses (name, normalized_name)
VALUES
  ('Ativo', 'ativo'),
  ('Inativo', 'inativo'),
  ('Em manutenção', 'em manutencao'),
  ('Temporariamente fechado', 'temporariamente fechado'),
  ('Interditado', 'interditado')
ON CONFLICT (normalized_name) DO UPDATE
  SET name = EXCLUDED.name;
