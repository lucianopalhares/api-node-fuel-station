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
    city_ibge_code,
    cep,
    responsible_id,
    status_id,
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
    3550308,
    '01301000',
    v_responsible_id,
    (SELECT id FROM station_statuses WHERE normalized_name = 'ativo'),
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

  INSERT INTO import_rows (
    import_id,
    row_number,
    station_id,
    raw_data,
    normalized_data,
    status
  )
  VALUES (
    v_import_id,
    2,
    v_station_id,
    jsonb_build_object(
      'cnpj', '10234600000001',
      'nome_posto', 'Petrobras Comércio de Combustíveis Ltda - Fixture',
      'nome_fantasia', 'Posto Fixture Central',
      'bandeira', 'Petrobras',
      'logradouro', 'Rua Augusta',
      'numero', '100',
      'complemento', NULL,
      'bairro', 'Moema',
      'municipio', 'São Paulo',
      'uf', 'SP',
      'cep', '01301000',
      'cpf_responsavel', '12345600110',
      'nome_responsavel', 'Maria Silva Ferreira',
      'email_responsavel', 'maria.fixture@grupoabast.com.br',
      'cargo_responsavel', 'Gerente de Posto',
      'combustiveis', 'Gasolina Comum,Etanol,Diesel S10',
      'status', 'ativo',
      'data_inauguracao', '01/01/2020',
      'numero_bicos', '8',
      'numero_pistas', '4',
      'observacoes', 'Fixture controlada para validar a importação ponta a ponta.'
    ),
    jsonb_build_object(
      'cnpj', '10234600000001',
      'nome_posto', 'Petrobras Comércio de Combustíveis Ltda - Fixture',
      'nome_fantasia', 'Posto Fixture Central',
      'bandeira', 'Petrobras',
      'logradouro', 'Rua Augusta',
      'numero', '100',
      'complemento', NULL,
      'bairro', 'Moema',
      'municipio', 'São Paulo',
      'uf', 'SP',
      'cep', '01301000',
      'cpf_responsavel', '12345600110',
      'nome_responsavel', 'Maria Silva Ferreira',
      'email_responsavel', 'maria.fixture@grupoabast.com.br',
      'cargo_responsavel', 'Gerente de Posto',
      'status', 'ativo',
      'data_inauguracao', '2020-01-01',
      'numero_bicos', 8,
      'numero_pistas', 4,
      'combustiveis', jsonb_build_array('Gasolina Comum', 'Etanol', 'Diesel S10'),
      'observacoes', 'Fixture controlada para validar a importação ponta a ponta.'
    ),
    'imported'
  )
  ON CONFLICT (import_id, row_number) DO NOTHING;
END $$;
