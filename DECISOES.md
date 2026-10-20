# Principais implementações e decisões

Registra aqui o que de principal foi concluído e as decisões tomadas.

## Fase 1 — Esqueleto da API

- Criada a pasta `api/` com Node.js `22.23.2`, Express e TypeScript.
- Configurado o acesso ao PostgreSQL pelo pacote `pg`.
- Adicionada a rota `GET /health`, que executa `SELECT 1` pra verificar a conexão com o banco.

## Fase 2 — Docker da API e do banco

- Criado um Dockerfile pra executar a API.
- Criado o Compose com os serviços `api` e `db`, com PostgreSQL 18.
- A API conecta ao banco pelo endereço `db:5432`.
- Publicadas as portas externas `3261` para a API e `5418` para o PostgreSQL.
- Adicionado o volume `postgres_data` em `/var/lib/postgresql` para persistir os dados.
- Variaveis de ambiente no arquivo `.env`; assim como credenciais. Se ele nao for criado, usa valores do docker-compose como padrão.

## Fase 3 — Instruções iniciais

- Criado o README sobre o projeto.
- Incluída uma nota de que as funcionalidades do desafio ainda não foram implementadas.
- Quando o volume persistente do PostgreSQL estiver com erro de credenciais, precisa recriar com `docker compose down -v` e `docker compose up --build -d`, pra remover os dados dantigos.

## Inicia DDD e Módulo de cidades

- Inicia um padrão DDD.
- Modulo de cidades com estados, usando use cases, entidades e repository.
- Sql para criar tabelas de cidades e estados.

## Acesso a dados

- O domínio e os casos de uso dependem de abstrações (`CityRepository` e `DatabaseClient`), enquanto o PostgreSQL fica isolado nos adapters. Assim, a infraestrutura pode ser substituída sem alterar a regra de negócio; o SQL e o schema continuam específicos do PostgreSQL.

## Modulo de responsavel

- Implementa o modulo de responsavel, com sql para criar tabelas assim como use cases , repository e rotas. E busca no banco assim como salvar o responsavel e verificar se nao existe conflito de um responsavel por email e cpf.

## Modulo posto de combustivel

- Implementa o modulo de posto de combustivel. Cria as tabelas necessarias de posto de combustivel, de tipos de combustivel, de bandeira do combustivel e da importacao da planilha.

## Seeder e Migrations

- As migrations e os seeders foram separados para manter a estrutura do banco independente dos dados iniciais, permitindo executar `db:migrate` e `db:seed:production` de forma controlada e idempotente.
- Seeders para alimentar dados padroes e ja um posto de combustivel pra teste.




