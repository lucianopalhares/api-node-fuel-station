/* Arquivo novo: erro de entrada inválida; HTTP 400. */

import { AppError, ErrorDetails } from './AppError';

export class ValidationError extends AppError {
  constructor(code: string, message: string, details?: ErrorDetails) {
    super(400, code, message, details);
    this.name = 'ValidationError';
  }
}
