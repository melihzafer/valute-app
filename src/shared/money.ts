// src/shared/money.ts
// Tek merkezden money/currency yardımcıları. Tüm cents ↔ dollars dönüşümleri
// buradan geçmeli — /10000 gibi bütünden çıkan bug'ları (bug-022) yapısal önler.
// Refs: cerebrum.md "Money unit convention", buglog bug-022/023/024.

import type { Currency } from './types'

// Tüm desteklenen para birimleri — tek kaynak. Dropdown'lar ASLA hardcoded subset
// kullanmamalı, bu listeden beslenmeli (bug-023).
export const CURRENCIES: readonly Currency[] = ['USD', 'EUR', 'TRY', 'GBP', 'CAD', 'AUD', 'JPY']

// Bir para birimi geçerli mi (runtime guard — dış veriyi validate ederken)
export const isCurrency = (c: string | undefined | null): c is Currency =>
  !!c && (CURRENCIES as readonly string[]).includes(c)

// Dollars (insan tarafından girilen değer) → cents (DB'de saklanan değer).
// Örn. 15.50 → 1550. Küsuratı güvenli şekilde yuvarlar.
export const toCents = (dollars: number | string | null | undefined): number => {
  if (dollars === null || dollars === undefined || dollars === '') return 0
  const n = typeof dollars === 'string' ? parseFloat(dollars) : dollars
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100)
}

// Cents (DB) → dollars (form görüntüleme). Örn. 1550 → 15.5
export const fromCents = (cents: number | null | undefined): number => {
  if (cents === null || cents === undefined) return 0
  return cents / 100
}

// /10000 — yasaklı dönüşüm. bug-022'de 30 → 0.30 olarak kaydediliyordu.
// Eski kodu güvenli şekilde migrate etmek için bile kullanma; bu fonksiyon sadece
// test edilebilirlik ve intent belgeleme için var — üretimde asla çağrılma.
export const FORBIDDEN_DIV_10000 = 10000
