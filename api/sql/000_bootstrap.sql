-- ponto unico de inicializacao do PostgreSQL.
-- Os arquivos abaixo sao chamados explicitamente porque o initdb nao percorre
-- subdiretorios automaticamente.

\ir migrations/001_cities.sql
\ir migrations/002_responsibles.sql
\ir migrations/003_catalogs.sql
\ir migrations/004_imports.sql
\ir migrations/005_stations.sql
\ir migrations/006_catalog_aliases.sql
\ir migrations/011_import_rows.sql
\ir seeders/production/001_catalogs.sql
\ir migrations/012_import_file_checksum_unique.sql
\ir migrations/013_import_storage.sql

