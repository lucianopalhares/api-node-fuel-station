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

export function hasExactDigits(value: string | null | undefined, length: number): boolean {
  return normalizeDigits(value).length === length;
}

export function isValidCpf(value: string, validateCheckDigits = false): boolean {
  const digits = normalizeDigits(value);

  if (digits.length !== 11 || /^([0-9])\1{10}$/.test(digits)) return false;
  if (!validateCheckDigits) return true;

  const calculateDigit = (length: number): number => {
    const sum = digits
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(9) === Number(digits[9])
    && calculateDigit(10) === Number(digits[10]);
}

export function isValidCnpj(value: string, validateCheckDigits = false): boolean {
  const digits = normalizeDigits(value);

  if (digits.length !== 14 || /^([0-9])\1{13}$/.test(digits)) return false;
  if (!validateCheckDigits) return true;

  const calculateDigit = (length: number): number => {
    const weights = length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = digits
      .slice(0, length)
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === Number(digits[12])
    && calculateDigit(13) === Number(digits[13]);
}

export function normalizeCnpj(value: string | null | undefined): string {
  const text = value?.trim().replace(/\s+/g, '') ?? '';
  const scientific = /^([+]?)(\d+)(?:[.,](\d+))?[eE]\+?(\d+)$/.exec(text);

  if (!scientific) return normalizeDigits(text);

  const [, , integerPart, fractionPart = '', exponentText] = scientific;
  const exponent = Number(exponentText);
  const significantDigits = `${integerPart}${fractionPart}`;
  const zeroCount = exponent - fractionPart.length;

  if (
    !Number.isSafeInteger(exponent)
    || exponent < 0
    || exponent > 1000
    || zeroCount < 0
  ) {
    return normalizeDigits(text);
  }

  return `${significantDigits}${'0'.repeat(zeroCount)}`;
}

export function normalizeCep(value: string | null | undefined): string {
  const digits = normalizeDigits(value);
  if (!digits) return '';
  return digits.length === 7 ? `0${digits}` : digits;
}
