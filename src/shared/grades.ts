// src/shared/grades.ts
// Pure university grade math — DB'den bağımsız, test edilebilir.
// UniversityService.currentGrade buradan gelir. Refs: GROWTH_IDEAS §1.

export interface GradeInput {
  grade: number | null | undefined
  weight: number | null | undefined
}

/**
 * Ağırlıklı şimdiye kadarki not (0-100 ölçeği). Yalnızca not+ağırlığı girilmiş
 * ödevler hesaba katılır. Toplam ağılık 0 ise null döner. 1 ondalık basamak.
 */
export function weightedGrade(items: GradeInput[]): number | null {
  const graded = items.filter((a) => a.grade != null && a.weight != null)
  const totalWeight = graded.reduce((s, a) => s + (a.weight || 0), 0)
  if (totalWeight === 0) return null
  const earned = graded.reduce((s, a) => s + (a.grade || 0) * (a.weight || 0), 0)
  return Math.round((earned / totalWeight) * 10) / 10
}

/**
 * Kredi-ağırlıklı ortalama (GPA-ish, 0-100). currentGrade null olan veya kredisi
 * olmayan dersler atlanır. 1 ondalık basamak.
 */
export function creditWeightedAverage(
  courses: { currentGrade: number | null | undefined; credits: number | null | undefined }[]
): { gradeAvg: number | null; totalCredits: number } {
  const graded = courses.filter((c) => c.currentGrade != null && c.credits != null)
  const totalCredits = graded.reduce((s, c) => s + (c.credits || 0), 0)
  if (totalCredits === 0) return { gradeAvg: null, totalCredits: 0 }
  const sum = graded.reduce((s, c) => s + (c.currentGrade as number) * (c.credits || 0), 0)
  return { gradeAvg: Math.round((sum / totalCredits) * 10) / 10, totalCredits }
}
