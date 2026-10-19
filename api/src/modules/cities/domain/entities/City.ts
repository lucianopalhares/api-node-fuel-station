// entidade da cidade e uf

import { State } from './State';

export type City = {
  ibgeCode: number;
  name: string;
  state: State;
};
