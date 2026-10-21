export type AppConfig = {
  port: number;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  storageBucket: string;
  maxImportFileSizeBytes: number;
};

const DEFAULT_MAX_IMPORT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function loadMaxImportFileSizeBytes(): number {
  const configured = Number(process.env.MAX_IMPORT_FILE_SIZE_BYTES);

  return Number.isSafeInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_IMPORT_FILE_SIZE_BYTES;
}

export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 3000),
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      name: process.env.DB_NAME ?? 'ipdv',
      user: process.env.DB_USER ?? 'ipdv',
      password: process.env.DB_PASSWORD ?? 'ipdv',
    },
    storageBucket: process.env.STORAGE_BUCKET ?? 'imports',
    maxImportFileSizeBytes: loadMaxImportFileSizeBytes(),
  };
}
