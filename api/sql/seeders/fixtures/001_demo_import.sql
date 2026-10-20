-- fixture idempotente: uma importacao concluida com um posto e dependencias.

DO $$
DECLARE
  v_import_id BIGINT;
  v_station_id BIGINT;
  v_brand_id BIGINT;
  v_responsible_id BIGINT;
  v_position_id BIGINT;
  v_checksum CONSTANT VARCHAR(64) := 'fixture-one-station-v1';
BEGIN
  SELECT id INTO v_brand_id
    FROM brands
   WHERE normalized_name = 'petrobras';

  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Bandeira Petrobras nao encontrada; execute o seeder de producao antes da fixture';
  END IF;

  INSERT INTO responsible_positions (name)
  VALUES ('Gerente de Posto')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_position_id
    FROM responsible_positions
   WHERE name = 'Gerente de Posto';

  INSERT INTO responsibles (cpf, name, email, position_id)
  VALUES (
    '12345600110',
    'Maria Silva Ferreira',
    'maria.fixture@grupoabast.com.br',
    v_position_id
  )
  ON CONFLICT (cpf) DO NOTHING;

  SELECT id INTO v_responsible_id
    FROM responsibles
   WHERE cpf = '12345600110';

  INSERT INTO imports (
    filename,
    file_checksum,
    status,
    total_rows,
    imported_rows,
    started_at,
    finished_at
  )
  SELECT
    'one-station.csv',
    v_checksum,
    'completed',
    1,
    1,
    NOW(),
    NOW()
  WHERE NOT EXISTS (
    SELECT 1
      FROM imports
     WHERE file_checksum = v_checksum
  )
  RETURNING id INTO v_import_id;

  IF v_import_id IS NULL THEN
    SELECT id INTO v_import_id
      FROM imports
     WHERE file_checksum = v_checksum
     ORDER BY id
     LIMIT 1;
  END IF;

  INSERT INTO stations (
    cnpj,
    nome_posto,
    nome_fantasia,
    brand_id,
    logradouro,
    numero,
    bairro,
    municipio,
    uf,
    cep,
    responsible_id,
    status,
    data_inauguracao,
    numero_bicos,
    numero_pistas,
    observacoes
  )
  VALUES (
    '10234600000001',
    'Petrobras Comércio de Combustíveis Ltda - Fixture',
    'Posto Fixture Central',
    v_brand_id,
    'Rua Augusta',
    '100',
    'Moema',
    'São Paulo',
    'SP',
    '01301000',
    v_responsible_id,
    'ativo',
    DATE '2020-01-01',
    8,
    4,
    'Fixture controlada para validar a importação ponta a ponta.'
  )
  ON CONFLICT (cnpj) DO NOTHING;

  SELECT id INTO v_station_id
    FROM stations
   WHERE cnpj = '10234600000001';

  INSERT INTO station_fuels (station_id, fuel_id)
  SELECT v_station_id, id
    FROM fuels
   WHERE normalized_name IN ('gasolina comum', 'etanol', 'diesel s10')
  ON CONFLICT (station_id, fuel_id) DO NOTHING;

  INSERT INTO station_imports (
    import_id,
    station_id,
    responsible_id,
    source_row_number
  )
  VALUES (v_import_id, v_station_id, v_responsible_id, 2)
  ON CONFLICT (import_id, station_id) DO NOTHING;

  INSERT INTO station_import_fuels (import_id, station_id, fuel_id)
  SELECT v_import_id, v_station_id, id
    FROM fuels
   WHERE normalized_name IN ('gasolina comum', 'etanol', 'diesel s10')
  ON CONFLICT (import_id, station_id, fuel_id) DO NOTHING;
END $$;
