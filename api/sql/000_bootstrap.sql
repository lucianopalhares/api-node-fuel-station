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
\ir seeders/production/001_catalogs.sql

