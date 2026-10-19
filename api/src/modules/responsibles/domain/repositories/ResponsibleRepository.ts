import { Responsible } from '../entities/Responsible';

export type ResponsibleInput = {
  cpf: string;
  name?: string | null;
  email?: string | null;
  positionId?: string | null;
};

export interface ResponsibleRepository {
  list(limit: number): Promise<Responsible[]>;
  findByCpf(cpf: string): Promise<Responsible | null>;
  create(input: ResponsibleInput): Promise<Responsible>;
}
