// src/shared/__tests__/grades.test.ts
// grades.ts — pure university grade math (DB'den bağımsız).
// Refs: GROWTH_IDEAS S1.
import { describe, it, expect } from 'vitest'
import { weightedGrade, creditWeightedAverage } from '../grades'

describe('weightedGrade', () => {
  it('computes the weighted average of graded items', () => {
    // (80*2 + 90*3) / 5 = 430/5 = 86
    expect(
      weightedGrade([
        { grade: 80, weight: 2 },
        { grade: 90, weight: 3 }
      ])
    ).toBe(86)
  })

  it('returns null when no items have both grade and weight', () => {
    expect(weightedGrade([{ grade: null, weight: 2 }])).toBeNull()
    expect(weightedGrade([{ grade: 80, weight: null }])).toBeNull()
  })

  it('returns null when total weight is 0', () => {
    expect(weightedGrade([{ grade: 80, weight: 0 }])).toBeNull()
  })

  it('ignores items missing grade or weight', () => {
    // only the 90/3 item counts -> 90
    expect(
      weightedGrade([
        { grade: 80, weight: null },
        { grade: 90, weight: 3 }
      ])
    ).toBe(90)
  })

  it('rounds to 1 decimal place', () => {
    // (70*1 + 85*2) / 3 = 240/3 = 80
    expect(
      weightedGrade([
        { grade: 70, weight: 1 },
        { grade: 85, weight: 2 }
      ])
    ).toBe(80)
    // (73*1 + 88*1) / 2 = 161/2 = 80.5
    expect(
      weightedGrade([
        { grade: 73, weight: 1 },
        { grade: 88, weight: 1 }
      ])
    ).toBe(80.5)
  })

  it('handles a single graded item', () => {
    expect(weightedGrade([{ grade: 100, weight: 1 }])).toBe(100)
  })

  it('returns null for empty input', () => {
    expect(weightedGrade([])).toBeNull()
  })
})

describe('creditWeightedAverage', () => {
  it('computes the credit-weighted average across courses', () => {
    // (80*3 + 90*3) / 6 = 510/6 = 85
    expect(
      creditWeightedAverage([
        { currentGrade: 80, credits: 3 },
        { currentGrade: 90, credits: 3 }
      ])
    ).toEqual({ gradeAvg: 85, totalCredits: 6 })
  })

  it('returns null avg when no graded courses', () => {
    expect(creditWeightedAverage([{ currentGrade: null, credits: 3 }])).toEqual({
      gradeAvg: null,
      totalCredits: 0
    })
  })

  it('skips courses without credits', () => {
    expect(
      creditWeightedAverage([
        { currentGrade: 80, credits: null },
        { currentGrade: 90, credits: 3 }
      ])
    ).toEqual({ gradeAvg: 90, totalCredits: 3 })
  })

  it('skips courses without a grade', () => {
    expect(
      creditWeightedAverage([
        { currentGrade: null, credits: 3 },
        { currentGrade: 90, credits: 3 }
      ])
    ).toEqual({ gradeAvg: 90, totalCredits: 3 })
  })

  it('handles empty input', () => {
    expect(creditWeightedAverage([])).toEqual({ gradeAvg: null, totalCredits: 0 })
  })

  it('rounds to 1 decimal place', () => {
    // (80*3 + 85*3) / 6 = 495/6 = 82.5
    expect(
      creditWeightedAverage([
        { currentGrade: 80, credits: 3 },
        { currentGrade: 85, credits: 3 }
      ])
    ).toEqual({ gradeAvg: 82.5, totalCredits: 6 })
  })
})
