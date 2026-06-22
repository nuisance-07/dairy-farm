import { clsx, type ClassValue } from 'clsx';

// ---- Class Name Utility ----
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ---- Currency Formatting ----
export function formatCurrency(amount: number, currency: string = 'KES'): string {
  const currencyMap: Record<string, { locale: string; code: string }> = {
    KES: { locale: 'en-KE', code: 'KES' },
    USD: { locale: 'en-US', code: 'USD' },
    EUR: { locale: 'en-DE', code: 'EUR' },
    GBP: { locale: 'en-GB', code: 'GBP' },
    UGX: { locale: 'en-UG', code: 'UGX' },
    TZS: { locale: 'en-TZ', code: 'TZS' },
  };

  const config = currencyMap[currency] || currencyMap.KES;

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ---- Number Formatting ----
export function formatNumber(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

// ---- Date Formatting ----
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// ---- Age Calculation ----
export function calculateAge(dateOfBirth: string): string {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  const diffMs = now.getTime() - dob.getTime();
  const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
  const months = Math.floor(
    (diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)
  );

  if (years > 0) {
    return `${years}y ${months}m`;
  }
  return `${months}m`;
}

// ---- Depreciation ----
export function calculateDepreciation(
  purchaseCost: number,
  usefulLifeYears: number,
  purchaseDate: string
): { currentValue: number; depreciationPerYear: number; percentRemaining: number } {
  const yearsSincePurchase =
    (new Date().getTime() - new Date(purchaseDate).getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);

  const depreciationPerYear = purchaseCost / usefulLifeYears;
  const totalDepreciation = Math.min(depreciationPerYear * yearsSincePurchase, purchaseCost);
  const currentValue = Math.max(purchaseCost - totalDepreciation, 0);
  const percentRemaining = purchaseCost > 0 ? (currentValue / purchaseCost) * 100 : 0;

  return { currentValue, depreciationPerYear, percentRemaining };
}

// ---- CSV Export ----
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const str = String(value ?? '');
          // Escape commas and quotes
          return str.includes(',') || str.includes('"')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---- Percentage Change ----
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ---- Truncate Text ----
export function truncate(str: string, length: number = 30): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
