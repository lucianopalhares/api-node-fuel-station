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

## Integridade entre cidade e UF

- `stations` passa a armazenar somente `city_ibge_code` como referência obrigatória. Município e UF são derivados de `cities` e `states` na leitura e na exportação, evitando duas fontes de verdade.
- Seeder para popular cidades

## Status do posto

- Permitir guardar status do posto em uma tabela do banco de dados, pois pode ser que existam status diferentes no futuro para o posto.

## Melhora cada linha da importação

`stations` permanece a tabela pra armazenar os postos. Nova tabela `import_rows` registra uma linha para cada linha do CSV, incluindo linhas válidas, duplicadas ou com erro.

`import_rows.raw_data` guarda valores recebidos e `import_rows.normalized_data` registra a representação tratada usada na importação.

`station_imports` e `station_import_fuels` foram removidas porque não representavam todas as linhas do arquivo: a chave dependia do posto e não permitia registrar duplicidades ou linhas sem posto associado.

## Unicidade do arquivo importado

`imports.file_checksum` possui a constraint `imports_file_checksum_unique`, garantindo que dois registros não representem o mesmo arquivo. O campo continua nullable para preservar compatibilidade com registros ou fluxos que podem não possuir checksum; valores não nulos são únicos. A migration é idempotente e falha caso já existam checksums duplicados.

## Combustíveis informados na importação

A coluna `combustiveis` é uma lista de nomes separados por vírgula dentro do campo CSV. O parser deve dividir a lista, remover espaços extras e normalizar cada item. Cada combustível resolvido no catálogo `fuels` — diretamente ou por `fuel_aliases` — será persistido como um vínculo em `station_fuels`. Esse relacionamento permite vários combustíveis para o mesmo posto.

Se qualquer combustível da linha não existir no catálogo, a linha inteira será marcada como `invalid`. O sistema não criará automaticamente um combustível nem persistirá parcialmente o posto, evitando cadastros causados por erros de digitação e mantendo a integridade da foreign key `station_fuels.fuel_id`. O valor original será preservado em `import_rows.raw_data`, e o erro deverá identificar o combustível desconhecido.

## Validação do email do responsável

- O campo `email_responsavel` é opcional: vazio ou composto apenas por espaços é normalizado para `null`.
- Quando preenchido, o email é aparado, convertido para lowercase e validado na aplicação antes da busca ou criação do responsável.
- A validação exige um formato simples `local@dominio.tld` e no máximo 254 caracteres, limite compatível com a coluna `responsibles.email`.

## Módulo para compartilhar validação e tratamento

- Normalizações de texto, dígitos, email, inteiros e limites ficam em `modules/shared/application/validation/InputValidation.ts`.
- Os outros modulos reaproveitam os metodos.

## Módulo para tratamento de erros

- Ter um modulo para acusar erros e ser compartilhado entre os outros modulos para usar-lo.

## Importação com storage S3

- O arquivo da importação é enviado para um bucket S3 local. Em desenvolvimento, o Compose usa o Silo (`pgsty/silo`), compatível com a API e o protocolo do MinIO. A tabela `imports` guarda apenas nome, checksum, tamanho, tipo MIME, bucket, chave do objeto, status e contadores. O CSV é relido do storage em streaming para validar o header e contar as linhas.

- Essa primeira versão prioriza somente a primeira etapa de importação para teste para verificar o recebimento do arquivo.

- Tambem foi mudado de pasta o arquivo de validar alguns dados para uma pasta geral de validação.

## Fila e observabilidade

- A API salva o CSV no storage e publica uma tarefa na fila RabbitMQ `imports`.
- O worker processa a tarefa em segundo plano e atualiza o status da importação.
- Falhas são enviadas para a dead-letter queue `imports.dlq`.
- O caso de uso depende da interface `ImportQueue`, mantendo o broker substituível.
- Os logs da API e do worker são estruturados em JSON e visualizados pelo Dozzle.
- O painel RabbitMQ permite acompanhar filas, mensagens e consumidores.
- As credenciais locais padrão são `ipdv/ipdv`.

# Correção de tabelas faltantes e erro da fila

- A migration `013` adiciona à tabela `imports` os metadados do arquivo no storage.
- A migration `014` permite o status `queued` nas importações.
- O bootstrap executa as migrations `007` a `010` antes da `011` e inclui a `014` depois da `013`.