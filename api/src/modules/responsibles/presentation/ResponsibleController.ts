import { Request, Response } from 'express';
import { GetResponsibleByCpf } from '../application/use-cases/GetResponsibleByCpf';
import { ListResponsibles } from '../application/use-cases/ListResponsibles';
import { normalizeDigits, parseOptionalInteger } from '../../shared/validation/InputValidation';
import { NotFoundError } from '../../shared/errors/NotFoundError';
import { ValidationError } from '../../shared/errors/ValidationError';

export class ResponsibleController {
  constructor(
    private readonly listResponsibles: ListResponsibles,
    private readonly getResponsibleByCpf: GetResponsibleByCpf,
  ) {}

  async list(request: Request, response: Response): Promise<void> {
    const hasLimit = request.query.limit !== undefined && request.query.limit !== '';
    const limit = parseOptionalInteger(request.query.limit);
    if (hasLimit && limit === undefined) {
      throw new ValidationError(
        'INVALID_LIMIT',
        'O limite deve ser informado como um número inteiro.',
        { field: 'limit' },
      );
    }

    response.json({ data: await this.listResponsibles.execute({ limit }) });
  }

  async getByCpf(request: Request, response: Response): Promise<void> {
    const rawCpf = request.params.cpf;
    const cpf = typeof rawCpf === 'string' ? normalizeDigits(rawCpf) : '';

    if (cpf.length !== 11) {
      throw new ValidationError(
        'INVALID_CPF',
        'O CPF informado é inválido.',
        { field: 'cpf' },
      );
    }

    const responsible = await this.getResponsibleByCpf.execute(cpf);

    if (!responsible) {
      throw new NotFoundError('RESPONSIBLE_NOT_FOUND', 'Responsável não encontrado.');
    }

    response.json(responsible);
  }
}
