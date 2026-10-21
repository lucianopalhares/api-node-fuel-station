export type StationBrand = {
  id: string;
  name: string;
};

export type StationResponsible = {
  id: string;
  cpf: string;
  name: string | null;
  email: string | null;
  position: string | null;
};

export type Station = {
  id: string;
  cnpj: string;
  legalName: string;
  tradeName: string | null;
  brand: StationBrand | null;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    cityIbgeCode: number | null;
    city: string;
    state: string;
    postalCode: string | null;
  };
  responsible: StationResponsible | null;
  fuels: string[];
  status: string;
  openingDate: string | null;
  pumpCount: number | null;
  laneCount: number | null;
  notes: string | null;
  updatedAt: string;
  lastImport: { id: string; date: string } | null;
};
