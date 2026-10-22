# Principais implementações e decisões

**Histórico de decisões:** o arquivo `TIMELINE.md` reúne as decisões tomadas ao longo do desenvolvimento do projeto, incluindo contexto e evolução.

## Arquitetura e organização do código

- É usado um padrão DDD.
- O domínio e os casos de uso dependem de abstrações (`CityRepository` e `DatabaseClient`), enquanto o PostgreSQL fica isolado nos adapters. Assim, a infraestrutura pode ser substituída sem alterar a regra de negócio; o SQL e o schema continuam específicos do PostgreSQL.
- O módulo de imports permanece separado do módulo de filas. Cada um possui responsabilidade diferente.
- Normalizações de texto, dígitos, email, inteiros e limites ficam em `modules/shared/validation/InputValidation.ts`. Os outros módulos reaproveitam os métodos.
- Há um módulo compartilhado para tratamento de erros entre os outros módulos.

## Execução e infraestrutura

- A API usa Node.js `22.23.2`, Express e TypeScript.
- O acesso ao PostgreSQL é feito pelo pacote `pg`.
- A rota `GET /health` executa `SELECT 1` para verificar a conexão com o banco.
- O Dockerfile executa a API.
- O Compose usa os serviços `api` e `db`, com PostgreSQL 18.
- A API conecta ao banco pelo endereço `db:5432`.
- As portas externas são `3261` para a API e `5418` para o PostgreSQL.
- O volume `postgres_data` fica em `/var/lib/postgresql` para persistir os dados.
- As variáveis de ambiente e as credenciais ficam no arquivo `.env`; se ele não for criado, são usados os valores do `docker-compose` como padrão.
- Quando o volume persistente do PostgreSQL fica com erro de credenciais, é necessário recriá-lo com `docker compose down -v` e `docker compose up --build -d`, removendo os dados antigos.

## Banco de dados e modelagem

- O módulo de cidades possui estados, cidades, entidades, use cases, repositories e SQL para criar as tabelas.
- O módulo de responsáveis possui tabelas, use cases, repositories e rotas. O responsável é buscado e salvo verificando conflitos por email e CPF.
- O módulo de postos de combustível possui as tabelas necessárias para postos, tipos de combustível, bandeiras e importações.
- `stations` armazena somente `city_ibge_code` como referência obrigatória. Município e UF são derivados de `cities` e `states` na leitura e na exportação, evitando duas fontes de verdade.
- Os status dos postos ficam em uma tabela própria, pois podem existir status diferentes no futuro.
- As migrations e os seeders são separados para manter a estrutura do banco independente dos dados iniciais, permitindo executar `db:migrate` e `db:seed:production` de forma controlada e idempotente.
- Existem seeders para alimentar dados padrão e um posto de combustível para teste.
- Há um seeder para popular cidades.

## Registro das linhas importadas

- `stations` permanece a tabela para armazenar os postos.
- `import_rows` registra uma linha para cada linha do CSV, incluindo linhas válidas, duplicadas ou com erro.
- `import_rows.raw_data` guarda os valores recebidos e `import_rows.normalized_data` registra a representação tratada usada na importação.
- As tabelas `station_imports` e `station_import_fuels` foram removidas porque não representavam todas as linhas do arquivo: a chave dependia do posto e não permitia registrar duplicidades ou linhas sem posto associado.

## Importação, validação e normalização

- O arquivo da importação é enviado para um bucket S3 local. Em desenvolvimento, o Compose usa o Silo (`pgsty/silo`), compatível com a API e o protocolo do MinIO.
- A tabela `imports` guarda nome, checksum, tamanho, tipo MIME, bucket, chave do objeto, status e contadores.
- O CSV é relido do storage em streaming para validar o header e contar as linhas.
- A coluna `combustiveis` é uma lista de nomes separados por vírgula. O parser divide a lista, remove espaços extras e normaliza cada item.
- Cada combustível informado é criado ou atualizado no catálogo `fuels` usando o nome normalizado. Em seguida, o posto recebe os vínculos correspondentes na tabela `station_fuels`.
- O campo `email_responsavel` é opcional: vazio ou composto apenas por espaços é normalizado para `null`.
- Quando preenchido, o email é aparado, convertido para lowercase e validado na aplicação antes da busca ou criação do responsável.
- A validação do email exige um formato simples `local@dominio.tld` e no máximo 254 caracteres, limite compatível com a coluna `responsibles.email`.
- Os métodos de validar CPF e CNPJ têm opção default para não validar se CPF e CNPJ são verdadeiros, apenas a quantidade de dígitos, porque a planilha de modelo possui CNPJ e CPFs inválidos.
- CEP com 7 dígitos deve considerar que o zero à esquerda foi ignorado e, portanto, é considerado válido.
- CEP, CPF e CNPJ com letras ou caracteres fora das máscaras permitidas são rejeitados.
- `numero_bicos` e `numero_pistas` rejeitam valores acima de `2147483647`, antes da tentativa de gravação no PostgreSQL.
- A validação de datas aceita os formatos `DD/MM/AAAA`, `MM/DD/AAAA` e `AAAA-MM-DD`, convertendo-os para `AAAA-MM-DD` antes do banco.
- Datas inválidas são rejeitadas. Quando dia e mês são menores ou iguais a 12, a interpretação assume o padrão brasileiro por compatibilidade com `docs/example.csv`.

## Unicidade, duplicidades e transações

- `imports.file_checksum` possui a constraint `imports_file_checksum_unique`, garantindo que dois registros não representem o mesmo arquivo. O campo continua nullable para preservar compatibilidade com registros ou fluxos que podem não possuir checksum; valores não nulos são únicos.
- A migration de unicidade é idempotente e falha caso já existam checksums duplicados.
- Cada linha do CSV é processada em uma transação PostgreSQL própria.
- A criação ou atualização do posto, dos responsáveis e catálogos, a remoção e inserção dos combustíveis e o registro em `import_rows` são confirmados juntos.
- Se qualquer etapa falhar, a transação executa rollback. A linha inválida é registrada como `invalid` depois da reversão.
- Quando o mesmo CNPJ aparece mais de uma vez no mesmo CSV, as ocorrências são processadas na ordem do arquivo. O posto é atualizado pelos dados da última ocorrência válida, e cada linha permanece registrada em `import_rows`, com status `imported` ou `updated`. Se uma ocorrência for inválida, ela é registrada como `invalid` sem desfazer o processamento das demais linhas.

## Fila e observabilidade

- A API salva o CSV no storage e publica uma tarefa na fila RabbitMQ `imports`.
- O worker processa a tarefa em segundo plano e atualiza o status da importação.
- Falhas são enviadas para a dead-letter queue `imports.dlq`.
- O caso de uso depende da interface `ImportQueue`, mantendo o broker substituível.
- Os logs da API e do worker são estruturados em JSON e visualizados pelo Dozzle.
- O painel RabbitMQ permite acompanhar filas, mensagens e consumidores.
- As credenciais locais padrão são `ipdv/ipdv`.
- A migration `013` adiciona à tabela `imports` os metadados do arquivo no storage.
- A migration `014` permite o status `queued` nas importações.
- O bootstrap executa as migrations `007` a `010` antes da `011` e inclui a `014` depois da `013`.

## Limites e recebimento do arquivo

- O endpoint de importação limita cada arquivo a 10 MiB por padrão, usando o limite `fileSize` do Busboy.
- O valor pode ser alterado por `MAX_IMPORT_FILE_SIZE_BYTES`.
- Quando o stream é truncado, a API responde HTTP 413 com o código `FILE_TOO_LARGE`, marca a importação como erro, não publica a mensagem no RabbitMQ e tenta remover o objeto parcial do storage.
- A importação aceita somente nomes terminados em `.csv`, sem diferenciar maiúsculas e minúsculas.
- Os MIME types aceitos são `text/csv`, `application/csv` e `application/vnd.ms-excel`.
- Parâmetros adicionais do MIME, como `charset=utf-8`, são removidos antes da comparação.
- A validação é feita antes do upload para o storage, retornando `INVALID_FILE_EXTENSION` ou `INVALID_FILE_TYPE` quando aplicável.

## Exportação

- A exportação geral de postos consulta a tabela `stations`, em vez de depender de uma importação específica.
- A ordenação é `updated_at DESC, id DESC` para priorizar os postos modificados mais recentemente.
- O endpoint aceita `limit`, com padrão de 1.000 e máximo de 10.000 registros.
- A consulta usa paginação por chave composta (`updated_at`, `id`) em lotes de 500.
- A exportação de uma importação busca os dados relacionados ao `id` da importação.

## Frontend

- O frontend usa Vue 3 e exibe os postos de combustível de forma simples.
- A página de importações exibe as importações, as linhas processadas, as linhas com erro e as linhas com sucesso.
- Na página `/stations`, há um botão para exportar postos com padrão de 100 registros, permitindo alterar a quantidade.
- Os postos exportados pela tela são ordenados pela data decrescente de alteração.
- As datas da listagem usam `stations.updated_at` e a última linha de `import_rows` com status `imported` ou `updated`.
- O link da importação usa `importId` na URL, exibindo a data da última importação em cada linha de posto e permitindo abrir a importação específica para visualizar seus detalhes.
- Na tela de importações, as importações com erros parciais ou erros possuem um botão para baixar uma planilha somente com as linhas de erro, permitindo corrigi-las e tentar uma nova importação.
