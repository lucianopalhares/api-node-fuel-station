# Planilha de Postos

## Sobre

Aplicação para importar, consultar e exportar dados de postos de combustível via planilhas CSV. Os dados importados ficam armazenados no banco de dados PostgreSQL e podem ser exportados novamente em um arquivo compatível.

## Stack

API em Node.js `22.23.2`, Express e TypeScript. O PostgreSQL é acessado com `pg`.

## Executar

```sh
cp .env.example .env
docker compose up --build
```

- API: <http://localhost:3261>
- Healthcheck da API e do banco: <http://localhost:3261/health>
- PostgreSQL: porta `5418` no host (porta `5432` no container)

O Compose inicia apenas a API e o banco. Os dados do PostgreSQL ficam no volume `postgres_data`.

Parar os containers sem apagar os dados:

```sh
docker compose down
```

Remover também o volume e os dados do banco:

```sh
docker compose down -v
```

