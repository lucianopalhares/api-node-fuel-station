export type Station = {
  id: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  brand: { id: string; name: string } | null;
  address: {
    city: string;
    state: string;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    cityIbgeCode: number | null;
    postalCode: string | null;
  };
  responsible: {
    id: string;
    cpf: string;
    name: string | null;
    email: string | null;
    position: string | null;
  } | null;
  status: string;
  fuels: string[];
  openingDate: string | null;
  pumpCount: number | null;
  laneCount: number | null;
  notes: string | null;
  updatedAt: string;
  lastImport: { id: string; date: string } | null;
};

export type StationPage = {
  data: Station[];
  pagination: { page: number; limit: number; hasNext: boolean };
};
