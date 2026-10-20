export type ErrorDetails = Record<string, unknown> | undefined;

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
