/**
 * Normalizes phone numbers:
 * - safely accepts string, number, null, undefined, or unknown
 * - strips all non-digits
 * - if 12 digits and starts with '91' -> drops '91'
 * - if 11 digits and starts with '0' -> drops '0'
 * - if > 10 digits -> extracts the last 10 digits
 * - returns the 10-digit number if valid, or empty string '' if not 10 digits
 */
export function normalizePhone(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  if (!str) return '';
  let digits = str.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.length > 10) {
    digits = digits.slice(-10);
  }
  return digits.length === 10 ? digits : '';
}

export function isValidPhone(input: unknown): boolean {
  return normalizePhone(input).length === 10;
}

/**
 * Extracts the last 10 digits from any numeric/string phone representation safely.
 * Returns empty string if input is missing or contains no digits.
 */
export function toLast10Phone(input: unknown): string {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  if (!str) return '';
  const digits = str.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}
