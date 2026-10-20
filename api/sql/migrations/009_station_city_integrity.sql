-- Garante que toda station tenha uma cidade válida e evita duplicar município/UF.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM stations s
     WHERE s.city_ibge_code IS NULL
        OR NOT EXISTS (
             SELECT 1
               FROM cities c
              WHERE c.ibge_code = s.city_ibge_code
           )
  ) THEN
    RAISE EXCEPTION
      'Não foi possível normalizar stations: existem registros sem city_ibge_code válido.';
  END IF;
END
$$;

DROP INDEX IF EXISTS stations_municipio_uf_idx;

ALTER TABLE stations
  ALTER COLUMN city_ibge_code SET NOT NULL,
  DROP COLUMN IF EXISTS municipio,
  DROP COLUMN IF EXISTS uf;
