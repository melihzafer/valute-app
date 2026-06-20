// src/shared/recurrence.ts
// Pure recurrence expansion — DB'den bağımsız, test edilebilir.
// CalendarService.expandOccurrences + advance buradan gelir. Refs: GROWTH_IDEAS §1.

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | string

/** Tek bir tarihi bir recurrence adımı ileri taşır (mutates). */
export function advanceDate(d: Date, recurrence: Recurrence): void {
  if (recurrence === 'daily') d.setDate(d.getDate() + 1)
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7)
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 100) // 'none' fallthrough — döngüden çık
}

/**
 * Bir event'in [from, to] penceresine düşen occurrence başlangıç tarihlerini üretir.
 * Sonsuz döngüye karşı guard'lı (maxIterations). Tek seferlik event ('none') sadece
 * pencere içindeyse kendisini döner.
 */
export function expandOccurrences(
  start: Date,
  recurrence: Recurrence,
  from: Date,
  to: Date
): Date[] {
  if (recurrence === 'none' || !recurrence) {
    return start >= from && start <= to ? [start] : []
  }
  const out: Date[] = []
  const cursor = new Date(start)
  // İmleci pencere başlangıcına yakın bir noktaya hızlıca ileri taşı (büyük döngüleri önle).
  let guard = 0
  const maxIterations = 1500
  while (cursor < from && guard < maxIterations) {
    advanceDate(cursor, recurrence)
    guard++
  }
  guard = 0
  while (cursor <= to && guard < 800) {
    if (cursor >= from) out.push(new Date(cursor))
    advanceDate(cursor, recurrence)
    guard++
  }
  return out
}
