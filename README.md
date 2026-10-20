# Planilha de Postos

## Sobre

Aplicação para importar, consultar e exportar dados de postos de combustível via planilhas CSV. Os dados importados ficam armazenados no banco de dados PostgreSQL e podem ser exportados novamente em um arquivo compatível.

## Stack

API em Node.js `22.23.2`, Express e TypeScript. O PostgreSQL é acessado com `pg`.

## Executar migrations e seeders

```sh
cp .env.example .env
docker compose up --build
```

Primeiro, construa a imagem e inicie o PostgreSQL:

```sh
docker compose build api
docker compose up -d db
```

- API: <http://localhost:3261>
- Healthcheck da API e do banco: <http://localhost:3261/health>
- PostgreSQL: porta `5418` no host (porta `5432` no container)

Depois que o banco estiver disponível, execute os comandos npm dentro do
container da API:

### Executar migrations e seeders

```sh
docker compose run --rm api npm run db:migrate
docker compose run --rm api npm run db:seed:production
docker compose run --rm api npm run db:seed:fixtures
docker compose up -d api
```

O comando `db:seed:fixtures` deve ser usado somente em desenvolvimento e
testes. Ele cria uma importação concluída, um posto e suas relações. O arquivo
`seeders/fixtures/one-station.csv` continua disponível para testar o endpoint
real de importação e não deve ser usado em produção.


O Compose inicia apenas a API e o banco. Os dados do PostgreSQL ficam no volume `postgres_data`.

Parar os containers sem apagar os dados:

```sh
docker compose down
```

Remover também o volume e os dados do banco:

```sh
docker compose down -v
```


