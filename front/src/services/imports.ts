
import type { ImportDetails, ImportRowStatus, ImportSummary } from '../types/import';

type ImportListResponse = { data: ImportSummary[] };
type ImportDetailsResponse = { data: ImportDetails };

async function parseError(response: Response, fallback: string): Promise<never> {
  const body = await response.json().catch(() => ({} as { message?: string })) as { message?: string };
  throw new Error(body.message || fallback);
}

export async function getImports(limit = 20): Promise<ImportSummary[]> {
  const response = await fetch(`/api/import-results?limit=${limit}`);
  if (!response.ok) await parseError(response, 'Não foi possível carregar as importações.');
  const body = await response.json() as ImportListResponse;
  return body.data;
}

export async function getImportDetails(importId: string, page: number, limit: number, status?: ImportRowStatus): Promise<ImportDetails> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);
  const response = await fetch(`/api/import-results/${encodeURIComponent(importId)}?${params}`);
  if (!response.ok) await parseError(response, 'Não foi possível carregar os detalhes da importação.');
  const body = await response.json() as ImportDetailsResponse;
  return body.data;
}
