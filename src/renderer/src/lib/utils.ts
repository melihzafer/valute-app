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

// Helper to format/expand GitHub shorthand to a full URL (e.g. "username/repo" -> "https://github.com/username/repo")
export const formatGithubUrl = (url: string): string => {
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  if (trimmed.startsWith('github.com/')) {
    return `https://${trimmed}`
  }

  const parts = trimmed.split('/')
  if (parts.length === 2 && parts[0] && parts[1] && !trimmed.includes(' ')) {
    return `https://github.com/${trimmed}`
  }

  return trimmed
}
