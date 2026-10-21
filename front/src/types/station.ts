export type Station = {
  id: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  brand: { id: string; name: string } | null;
  address: { city: string; state: string; street: string | null; number: string | null };
  status: string;
  fuels: string[];
};

export type StationPage = {
  data: Station[];
  pagination: { page: number; limit: number; hasNext: boolean };
};
