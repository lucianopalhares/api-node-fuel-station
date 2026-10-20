/* Arquivo novo: recurso inexistente; HTTP 404. */

import { AppError, ErrorDetails } from './AppError';

export class NotFoundError extends AppError {
  constructor(code: string, message: string, details?: ErrorDetails) {
    super(404, code, message, details);
    this.name = 'NotFoundError';
  }
}
