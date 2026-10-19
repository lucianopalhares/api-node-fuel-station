import { ResponsiblePosition } from './ResponsiblePosition';

export type Responsible = {
  id: string;
  cpf: string;
  name: string | null;
  email: string | null;
  position: ResponsiblePosition | null;
};
