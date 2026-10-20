# Planilha de Postos

## Sobre

Aplicação para importar, consultar e exportar dados de postos de combustível via planilhas CSV. Os dados importados ficam armazenados no banco de dados PostgreSQL e podem ser exportados novamente em um arquivo compatível.

## Stack

API em Node.js `22.23.2`, Express e TypeScript. O PostgreSQL é acessado com `pg`.

## Executar migrations e seeders

Copie as variáveis de ambiente e construa a imagem da API:

```sh
cp .env.example .env
docker compose build api
```

Em seguida, inicie somente o PostgreSQL:

```sh
docker compose up -d db
```

- API: <http://localhost:3261>
- Healthcheck da API e do banco: <http://localhost:3261/health>
- PostgreSQL: porta `5418` no host (porta `5432` no container)

Depois que o banco estiver disponível, execute os comandos npm dentro do
container da API:

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

## Observabilidade

Use o Dozzle em `http://localhost:9999` para ver os logs da API e do worker em tempo real. Ele ajuda a ver erros de requisição e falhas no processamento.

Use o painel RabbitMQ em `http://localhost:15673` para acompanhar a fila `imports`, mensagens pendentes, consumidores ativos e a fila de erros `imports.dlq`. Permite verificar se a importação foi publicada, processada ou encaminhada para erro.

As credenciais do RabbitMQ são `ipdv/ipdv`.

### Endereços

```text
API:       http://localhost:3261
Dozzle:    http://localhost:9999
RabbitMQ:  http://localhost:15673
```

RabbitMQ:

```text
usuário: ipdv
senha:   ipdv
```

## Testar importação

```sh
curl -i -F file=@docs/example.csv http://localhost:3261/imports
```

A resposta esperada é `202 Accepted` com status `queued`.

Para acompanhar o processamento:

```sh
docker compose logs -f api worker rabbitmq
```

No RabbitMQ, verifique as filas `imports` e `imports.dlq`. No Dozzle, consulte os logs da API e do worker.


