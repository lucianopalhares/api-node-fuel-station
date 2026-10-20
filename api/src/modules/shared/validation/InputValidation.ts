import { ValidationError } from '../errors/ValidationError';

export function normalizeRequiredText(value: string, message: string): string {
  const normalized = normalizeOptionalText(value);

  if (normalized === null) {
    throw new ValidationError('REQUIRED_FIELD', message);
  }
  
  return normalized;
}

export function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized ? normalized : null;
}

export function normalizeDigits(value: string | null | undefined): string {
  return value?.replace(/\D/g, '') ?? '';
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function parseOptionalInteger(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function clampInteger(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value ?? fallback, minimum), maximum);
}
