import type { StationPage } from '../types/station';

export async function getStations(page: number, limit: number, search: string): Promise<StationPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());

  const response = await fetch(`/api/stations?${params}`);
  if (!response.ok) throw new Error('Não foi possível carregar os postos.');
  return response.json() as Promise<StationPage>;
}

export async function exportStations(limit: number): Promise<void> {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`/api/stations/export?${params}`);

  if (!response.ok) {
    throw new Error('Não foi possível exportar os postos.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'stations-export.csv';
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}