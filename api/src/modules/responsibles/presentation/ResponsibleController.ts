import { Request, Response } from 'express';
import { GetResponsibleByCpf } from '../application/use-cases/GetResponsibleByCpf';
import { ListResponsibles } from '../application/use-cases/ListResponsibles';
import { normalizeDigits, parseOptionalInteger } from '../../shared/application/validation/InputValidation';

export class ResponsibleController {
  constructor(
    private readonly listResponsibles: ListResponsibles,
    private readonly getResponsibleByCpf: GetResponsibleByCpf,
  ) {}

  async list(request: Request, response: Response): Promise<void> {
    const hasLimit = request.query.limit !== undefined && request.query.limit !== '';
    const limit = parseOptionalInteger(request.query.limit);
    if (hasLimit && limit === undefined) {
      response.status(400).json({ error: 'limit deve ser um número inteiro' });
      return;
    }

    response.json({ data: await this.listResponsibles.execute({ limit }) });
  }

  async getByCpf(request: Request, response: Response): Promise<void> {
    const rawCpf = request.params.cpf;
    const cpf = typeof rawCpf === 'string' ? normalizeDigits(rawCpf) : '';
    if (cpf.length !== 11) {
      response.status(400).json({ error: 'CPF inválido' });
      return;
    }

    const responsible = await this.getResponsibleByCpf.execute(cpf);
    if (!responsible) {
      response.status(404).json({ error: 'responsável não encontrado' });
      return;
    }

    response.json(responsible);
  }
}
