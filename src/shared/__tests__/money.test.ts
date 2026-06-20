// src/shared/__tests__/money.test.ts
// money.ts — cents/dollars dönüşümü ve currency yardımcıları.
// Refs: cerebrum.md "Money unit convention", buglog bug-022/023/024.
import { describe, it, expect } from 'vitest'
import { toCents, fromCents, CURRENCIES, isCurrency, FORBIDDEN_DIV_10000 } from '../money'

describe('toCents', () => {
  it('converts a dollar number to cents', () => {
    expect(toCents(15.5)).toBe(1550)
  })

  it('converts a dollar string to cents', () => {
    expect(toCents('15.50')).toBe(1550)
  })

  it('rounds fractional cents safely (float error guard)', () => {
    // 0.1 + 0.2 = 0.30000000000000004 — naive *100 = 30.000000000000004
    expect(toCents(0.1 + 0.2)).toBe(30)
  })

  it('treats null/undefined/empty as 0', () => {
    expect(toCents(null)).toBe(0)
    expect(toCents(undefined)).toBe(0)
    expect(toCents('')).toBe(0)
  })

  it('treats non-numeric strings as 0', () => {
    expect(toCents('abc')).toBe(0)
    expect(toCents('NaN')).toBe(0)
  })

  it('handles zero', () => {
    expect(toCents(0)).toBe(0)
  })

  it('preserves negative values (refunds/credits)', () => {
    expect(toCents(-5)).toBe(-500)
  })

  it('handles very large amounts without precision loss on the cents step', () => {
    // 99999.99 -> 9999999 cents
    expect(toCents(99999.99)).toBe(9999999)
  })
})

describe('fromCents', () => {
  it('converts cents to dollars', () => {
    expect(fromCents(1550)).toBe(15.5)
  })

  it('treats null/undefined as 0', () => {
    expect(fromCents(null)).toBe(0)
    expect(fromCents(undefined)).toBe(0)
  })

  it('handles zero', () => {
    expect(fromCents(0)).toBe(0)
  })
})

describe('CURRENCIES', () => {
  it('is the single source of truth with the 7 supported currencies', () => {
    expect(CURRENCIES).toEqual(['USD', 'EUR', 'TRY', 'GBP', 'CAD', 'AUD', 'JPY'])
  })

  it('is a readonly list', () => {
    // Runtime readonly guard — ts readonly is compile-time only; the value is
    // frozen-by-convention. We at least assert the shape is stable.
    expect(CURRENCIES.length).toBe(7)
  })
})

describe('isCurrency', () => {
  it('accepts supported currencies', () => {
    expect(isCurrency('USD')).toBe(true)
    expect(isCurrency('TRY')).toBe(true)
    expect(isCurrency('JPY')).toBe(true)
  })

  it('rejects unknown codes (no hardcoded subset drift)', () => {
    expect(isCurrency('XYZ')).toBe(false)
    expect(isCurrency('usd')).toBe(false) // case-sensitive
  })

  it('rejects null/undefined/empty', () => {
    expect(isCurrency(null)).toBe(false)
    expect(isCurrency(undefined)).toBe(false)
    expect(isCurrency('')).toBe(false)
  })
})

describe('FORBIDDEN_DIV_10000', () => {
  it('equals 10000 — the buggy divisor from bug-022 (30 saved as 0.30)', () => {
    expect(FORBIDDEN_DIV_10000).toBe(10000)
  })
})
