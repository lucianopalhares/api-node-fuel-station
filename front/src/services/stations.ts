import type { StationPage } from '../types/station';

export async function getStations(page: number, limit: number, search: string): Promise<StationPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());

  const response = await fetch(`/api/stations?${params}`);
  if (!response.ok) throw new Error('Não foi possível carregar os postos.');
  return response.json() as Promise<StationPage>;
}
