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
