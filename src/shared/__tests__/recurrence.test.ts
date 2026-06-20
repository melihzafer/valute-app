// src/shared/__tests__/recurrence.test.ts
// recurrence.ts — pure recurrence expansion (DB'den bağımsız).
// Refs: GROWTH_IDEAS S1, CalendarService.expandOccurrences.
import { describe, it, expect } from 'vitest'
import { advanceDate, expandOccurrences } from '../recurrence'

describe('advanceDate', () => {
  it('daily advances one day', () => {
    const d = new Date('2026-01-15T10:00:00')
    advanceDate(d, 'daily')
    expect(d.getDate()).toBe(16)
  })

  it('weekly advances seven days', () => {
    const d = new Date('2026-01-15T10:00:00')
    advanceDate(d, 'weekly')
    expect(d.getDate()).toBe(22)
  })

  it('monthly advances one month', () => {
    const d = new Date('2026-01-15T10:00:00')
    advanceDate(d, 'monthly')
    expect(d.getMonth()).toBe(1) // February (0-indexed)
  })

  it('none jumps 100 years (used as a loop-exit sentinel)', () => {
    const d = new Date('2026-01-15T10:00:00')
    advanceDate(d, 'none')
    expect(d.getFullYear()).toBe(2126)
  })

  it('unknown recurrence also jumps 100 years (safe fallthrough)', () => {
    const d = new Date('2026-01-15T10:00:00')
    advanceDate(d, 'quarterly')
    expect(d.getFullYear()).toBe(2126)
  })
})

describe('expandOccurrences', () => {
  const from = new Date('2026-01-10T00:00:00')
  const to = new Date('2026-01-12T23:59:59')

  it('one-time event inside the window returns itself', () => {
    const start = new Date('2026-01-11T10:00:00')
    expect(expandOccurrences(start, 'none', from, to)).toEqual([start])
  })

  it('one-time event outside the window returns empty', () => {
    const start = new Date('2026-02-01T10:00:00')
    expect(expandOccurrences(start, 'none', from, to)).toEqual([])
  })

  it('daily produces one occurrence per day in the window', () => {
    const start = new Date('2026-01-10T00:00:00')
    const occ = expandOccurrences(start, 'daily', from, to)
    expect(occ).toHaveLength(3) // Jan 10, 11, 12
  })

  it('daily occurrences all fall within [from, to]', () => {
    const start = new Date('2026-01-10T00:00:00')
    const occ = expandOccurrences(start, 'daily', from, to)
    for (const o of occ) {
      expect(o >= from).toBe(true)
      expect(o <= to).toBe(true)
    }
  })

  it('weekly produces one occurrence per week in a 2-week window', () => {
    const start = new Date('2026-01-05T00:00:00') // Monday
    const wFrom = new Date('2026-01-05T00:00:00')
    const wTo = new Date('2026-01-18T23:59:59')
    const occ = expandOccurrences(start, 'weekly', wFrom, wTo)
    expect(occ).toHaveLength(2) // Jan 5 and Jan 12
  })

  it('monthly produces one occurrence per month in a 3-month window', () => {
    const start = new Date('2026-01-11T10:00:00')
    const occ = expandOccurrences(
      start,
      'monthly',
      new Date('2026-01-01T00:00:00'),
      new Date('2026-03-31T23:59:59')
    )
    expect(occ).toHaveLength(3) // Jan 11, Feb 11, Mar 11
  })

  it('does not loop forever when the start is far in the future', () => {
    const start = new Date('2050-01-01T00:00:00')
    const occ = expandOccurrences(start, 'daily', from, to)
    expect(occ).toEqual([])
  })

  it('returns empty for an empty/unknown recurrence outside the window', () => {
    const start = new Date('2026-02-01T10:00:00')
    expect(expandOccurrences(start, '', from, to)).toEqual([])
  })
})
