// src/shared/earnings.ts
// Pure earnings math — DB'den bağımsız, test edilebilir. DashboardService ve
// ReportService'deki birebir aynı calculateLogEarnings buraya taşındı (DRY, S5).
// Refs: GROWTH_IDEAS §1 (service tests), IMPROVEMENT_BRAINSTORM S1.

export type ProjectType = 'HOURLY' | 'FIXED' | 'UNIT_BASED' | 'SUBSCRIPTION' | string

/**
 * Tek bir log için kazanç (cent). hourRate cent cinsindendir.
 * - UNIT_BASED: quantity * unitRate (hourlyRate alanı per-unit fiyat taşır)
 * - diğerleri (HOURLY vb.): (saniye / 3600) * saatlik ücret
 */
export function calculateLogEarnings(
  duration: number | null | undefined,
  quantity: number | null | undefined,
  hourlyRate: number | null | undefined,
  projectType: ProjectType
): number {
  if (!hourlyRate) return 0

  if (projectType === 'UNIT_BASED' && quantity) {
    return Math.round(quantity * hourlyRate)
  } else if (duration) {
    return Math.round((duration / 3600) * hourlyRate)
  }

  return 0
}

/**
 * Timer canlıyken o ana kadar biriken kazanç (cent). elapsedSeconds TimerState'ten
 * gelir. Q5 (earnings ticker widget) bunu kullanır.
 */
export function calculateLiveEarnings(elapsedSeconds: number, hourlyRateCents: number): number {
  if (!hourlyRateCents) return 0
  const hours = elapsedSeconds / 3600
  return Math.round(hours * hourlyRateCents)
}
