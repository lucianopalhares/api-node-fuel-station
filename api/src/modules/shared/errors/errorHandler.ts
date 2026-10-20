/*
converter erros esperados e inesperados em uma resposta JSON segura.
*/

import type { ErrorRequestHandler } from 'express';
import { AppError } from './AppError';
import { ConflictError } from './ConflictError';

type PostgresError = Error & { code?: string; constraint?: string };

export const errorHandler: ErrorRequestHandler = (error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  const postgresError = error as PostgresError;
  if (postgresError?.code === '23505') {
    const conflict = new ConflictError(
      'RESOURCE_ALREADY_EXISTS',
      'O registro informado já existe.',
      { constraint: postgresError.constraint },
    );
    response.status(conflict.statusCode).json({
      error: { code: conflict.code, message: conflict.message, details: conflict.details },
    });
    return;
  }

  console.error('Erro não tratado na API', {
    method: request.method,
    path: request.originalUrl,
    error,
  });

  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Não foi possível concluir a operação. Tente novamente.',
    },
  });
};
