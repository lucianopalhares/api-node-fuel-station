import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const sqlRoot = path.resolve(currentDirectory, '..', 'sql');
const relativeDirectory = process.argv[2];

if (!relativeDirectory) {
  throw new Error('Informe o diretorio SQL relativo a api/sql.');
}

const targetDirectory = path.resolve(sqlRoot, relativeDirectory);
if (!targetDirectory.startsWith(`${sqlRoot}${path.sep}`)) {
  throw new Error('Diretorio SQL invalido.');
}

const files = (await readdir(targetDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
  .map((entry) => entry.name)
  .sort();

if (files.length === 0) {
  throw new Error(`Nenhum arquivo SQL encontrado em ${relativeDirectory}.`);
}

const client = new Client({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'ipdv',
  user: process.env.DB_USER ?? 'ipdv',
  password: process.env.DB_PASSWORD ?? 'ipdv',
});

await client.connect();

try {
  await client.query('BEGIN');

  for (const file of files) {
    console.log(`Executando ${relativeDirectory}/${file}`);
    const sql = await readFile(path.join(targetDirectory, file), 'utf8');
    await client.query(sql);
  }

  await client.query('COMMIT');
  console.log(`Concluido: ${files.length} arquivo(s).`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
