/* centralizar parsing, validação calendárica e normalização de datas.
 */

export class InvalidDateError extends Error {
  constructor(message = 'Data inválida.') {
    super(message);
    this.name = 'InvalidDateError';
  }
}

export function isValidDate(value: string | null | undefined): boolean {
  try {
    normalizeDate(value);
    return true;
  } catch (error) {
    if (error instanceof InvalidDateError) return false;
    throw error;
  }
}

export function validateDate(value: string | null | undefined): void {
  normalizeDate(value);
}

export function normalizeDate(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  if (!text) return '';

  let day: number;
  let month: number;
  let year: number;

  const yearFirst = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  if (yearFirst) {
    [, year, month, day] = yearFirst.map(Number) as [string, number, number, number];
  } else {
    const dayOrMonthFirst = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(text);
    if (!dayOrMonthFirst) {
      throw new InvalidDateError(
        'Data deve estar em DD/MM/AAAA, MM/DD/AAAA ou AAAA-MM-DD.',
      );
    }

    const first = Number(dayOrMonthFirst[1]);
    const second = Number(dayOrMonthFirst[2]);
    year = Number(dayOrMonthFirst[3]);

    if (first > 12 && second <= 12) {
      day = first;
      month = second;
    } else if (second > 12 && first <= 12) {
      day = second;
      month = first;
    } else {
      day = first;
      month = second;
    }
  }

  if (!isValidCalendarDate(year, month, day)) {
    throw new InvalidDateError('A data informada não existe no calendário.');
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || year < 1 || year > 9999) return false;
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1) return false;

  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31][month - 1];
  return day <= daysInMonth;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
