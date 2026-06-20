// src/shared/__tests__/earnings.test.ts
// earnings.ts — pure kazanç matematiği (DB'den bağımsız).
// Refs: GROWTH_IDEAS S1, Q5 (calculateLiveEarnings ticker için).
import { describe, it, expect } from 'vitest'
import { calculateLogEarnings, calculateLiveEarnings } from '../earnings'

describe('calculateLogEarnings', () => {
  it('HOURLY: 1 hour at 6000 cents/hr = 6000', () => {
    expect(calculateLogEarnings(3600, null, 6000, 'HOURLY')).toBe(6000)
  })

  it('HOURLY: 30 min at 6000 cents/hr = 3000', () => {
    expect(calculateLogEarnings(1800, null, 6000, 'HOURLY')).toBe(3000)
  })

  it('UNIT_BASED: quantity * unitRate (hourlyRate carries per-unit price)', () => {
    expect(calculateLogEarnings(null, 2, 500, 'UNIT_BASED')).toBe(1000)
  })

  it('UNIT_BASED with fractional quantity rounds to whole cents', () => {
    expect(calculateLogEarnings(null, 1.5, 500, 'UNIT_BASED')).toBe(750)
  })

  it('returns 0 when rate is missing/zero', () => {
    expect(calculateLogEarnings(3600, null, 0, 'HOURLY')).toBe(0)
    expect(calculateLogEarnings(3600, null, null, 'HOURLY')).toBe(0)
    expect(calculateLogEarnings(3600, null, undefined, 'HOURLY')).toBe(0)
  })

  it('returns 0 when no duration and not unit-based with quantity', () => {
    expect(calculateLogEarnings(null, null, 6000, 'HOURLY')).toBe(0)
  })

  it('rounds to whole cents (1 second at 3600 cents/hr = 1 cent)', () => {
    expect(calculateLogEarnings(1, null, 3600, 'HOURLY')).toBe(1)
  })
})

describe('calculateLiveEarnings', () => {
  it('1 hour at 6000 cents/hr = 6000', () => {
    expect(calculateLiveEarnings(3600, 6000)).toBe(6000)
  })

  it('30 min at 6000 cents/hr = 3000', () => {
    expect(calculateLiveEarnings(1800, 6000)).toBe(3000)
  })

  it('returns 0 when rate is 0', () => {
    expect(calculateLiveEarnings(3600, 0)).toBe(0)
  })

  it('returns 0 when rate is missing', () => {
    expect(calculateLiveEarnings(3600, null as number | null)).toBe(0)
  })

  it('rounds fractional cents (1s at 3600 cents/hr -> 1 cent)', () => {
    expect(calculateLiveEarnings(1, 3600)).toBe(1)
  })
})
