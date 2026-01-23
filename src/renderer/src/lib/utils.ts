import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function for currency formatting
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat(undefined, { // Use undefined for system default locale
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Utility function to calculate earnings based on elapsed time and hourly rate
export const calculateEarnings = (elapsedSeconds: number, hourlyRate: number): number => {
  if (hourlyRate === 0) return 0; // Avoid division by zero
  const hours = elapsedSeconds / 3600; // Convert seconds to hours
  return hours * hourlyRate;
};
