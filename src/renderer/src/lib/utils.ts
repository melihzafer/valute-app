import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency-specific locale mapping for proper formatting
const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  TRY: 'tr-TR',
  GBP: 'en-GB',
  CAD: 'en-CA',
  AUD: 'en-AU',
  JPY: 'ja-JP'
}

// Utility function for currency formatting
// Accepts amount in cents and converts to proper currency display
export const formatCurrency = (amountCents: number, currency: string = 'USD'): string => {
  const locale = CURRENCY_LOCALES[currency] || 'en-US'
  const amount = amountCents / 100 // Convert cents to dollars/euros/etc.

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Legacy version for components that pass already-converted amounts
export const formatCurrencyRaw = (amount: number, currency: string = 'USD'): string => {
  const locale = CURRENCY_LOCALES[currency] || 'en-US'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Utility function to calculate earnings based on elapsed time and hourly rate
export const calculateEarnings = (elapsedSeconds: number, hourlyRate: number): number => {
  if (hourlyRate === 0) return 0 // Avoid division by zero
  const hours = elapsedSeconds / 3600 // Convert seconds to hours
  return hours * hourlyRate
}
