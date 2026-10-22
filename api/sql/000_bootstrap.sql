-- ponto unico de inicializacao do PostgreSQL.
-- Os arquivos abaixo sao chamados explicitamente porque o initdb nao percorre
-- subdiretorios automaticamente.

\ir migrations/001_cities.sql
\ir migrations/002_responsibles.sql
\ir migrations/003_catalogs.sql
\ir migrations/004_imports.sql
\ir migrations/005_stations.sql
\ir migrations/006_catalog_aliases.sql
\ir migrations/007_station_import_links.sql
\ir migrations/008_station_import_fuels.sql
\ir migrations/009_station_city_integrity.sql
\ir migrations/010_station_statuses.sql
\ir migrations/011_import_rows.sql
\ir seeders/production/001_catalogs.sql
\ir migrations/012_import_file_checksum_unique.sql
\ir migrations/013_import_storage.sql
\ir migrations/014_import_queue.sql
\ir migrations/017_station_updated_at_export_index.sql
\ir migrations/018_import_batch_staging.sql

