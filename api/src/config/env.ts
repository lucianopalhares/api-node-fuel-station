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
};

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
  };
}
