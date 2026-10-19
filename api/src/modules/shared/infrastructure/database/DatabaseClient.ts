// definir a porta sem expor pg no resto da aplicação.

export interface DatabaseClient {
  query<T>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
}
