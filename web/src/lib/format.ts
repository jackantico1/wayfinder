import type { Currency } from '@wayfinder/shared';

const SYMBOL: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

export function money(amount: number, currency: Currency): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${SYMBOL[currency] ?? ''}${Math.abs(Math.round(amount)).toLocaleString()}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
