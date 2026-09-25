/**
 * Normalizes phone numbers:
 * - strips all non-digits
 * - if 12 digits and starts with '91' -> drops '91'
 * - if 11 digits and starts with '0' -> drops '0'
 * - returns the 10-digit number if valid, or empty string '' if not 10 digits
 */
export function normalizePhone(input: string): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.length === 10 ? digits : '';
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input).length === 10;
}
