/* Arquivo novo: conflito de unicidade ou de estado; HTTP 409. */

import { AppError, ErrorDetails } from './AppError';

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: ErrorDetails) {
    super(409, code, message, details);
    this.name = 'ConflictError';
  }
}
