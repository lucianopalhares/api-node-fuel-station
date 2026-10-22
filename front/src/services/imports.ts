
import type { ImportDetails, ImportRowStatus, ImportSummary } from '../types/import';

type ImportListResponse = { data: ImportSummary[] };
type ImportDetailsResponse = { data: ImportDetails };

async function parseError(response: Response, fallback: string): Promise<never> {
  const body = await response.json().catch(() => ({} as {
    error?: { message?: string; details?: { received?: string; expected?: string[] } };
    message?: string;
  })) as {
    error?: { message?: string; details?: { received?: string; expected?: string[] } };
    message?: string;
  };

  const message = body.error?.message || body.message || fallback;
  const details = body.error?.details;
  if (details?.received && details.expected?.length) {
    throw new Error(`${message} Confira o header esperado: ${details.expected.join('; ')}.`);
  }
  throw new Error(message);
}

export type ReceivedImport = {
  id: string;
  status: string;
  storageKey: string;
  fileSize: number;
};

type ReceivedImportResponse = { data: ReceivedImport };

export async function uploadStations(file: File): Promise<ReceivedImport> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/imports', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    await parseError(response, 'Não foi possível enviar o arquivo.');
  }

  const body = await response.json() as ReceivedImportResponse;
  return body.data;
}

export async function getImports(limit = 20, importId?: string): Promise<ImportSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (importId) params.set('importId', importId);
  const response = await fetch(`/api/import-results?${params}`);

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

export function getImportErrorExportUrl(importId: string): string {
  return `/api/imports/${encodeURIComponent(importId)}/errors/export`;
}

export function getImportExportUrl(importId: string): string {
  return `/api/imports/${encodeURIComponent(importId)}/export`;
}
