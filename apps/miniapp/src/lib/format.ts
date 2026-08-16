import type { MinorAmount } from '../types/domain';

function normalizedCurrency(currency: string) {
  return currency.trim().toUpperCase();
}

export function currencyMinorDigits(currency: string) {
  const code = normalizedCurrency(currency);
  if (code === 'XTR') return 0;
  try {
    return (
      new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
        .maximumFractionDigits ?? 2
    );
  } catch {
    return 2;
  }
}

export function majorToMinor(major: number, currency: string) {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * 10 ** currencyMinorDigits(currency));
}

export function minorToMajor(minor: MinorAmount, currency: string) {
  return Number(minor) / 10 ** currencyMinorDigits(currency);
}

export function moneyInputStep(currency: string) {
  const digits = currencyMinorDigits(currency);
  return digits === 0 ? '1' : (1 / 10 ** digits).toFixed(digits);
}

export function money(minor: MinorAmount, currency: string) {
  const code = normalizedCurrency(currency);
  if (code === 'XTR') return `${minor} ⭐`;
  const major = minorToMajor(minor, code);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(major);
  } catch {
    return `${major.toFixed(currencyMinorDigits(code))} ${code}`;
  }
}

export function eventDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function shortTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
    new Date(value),
  );
}

export function initials(name?: string | null) {
  return (name || 'G')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
