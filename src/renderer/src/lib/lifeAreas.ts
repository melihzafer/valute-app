// src/renderer/src/lib/lifeAreas.ts
// Shared life-area metadata for the Life-OS domains (M1/M2/M3/M5/M7/M8).

import type { LifeArea } from '../../../shared/types'

export const LIFE_AREAS: { id: LifeArea; label: string; color: string }[] = [
  { id: 'work', label: 'Work', color: '#6366f1' },
  { id: 'uni', label: 'University', color: '#0ea5e9' },
  { id: 'health', label: 'Health', color: '#22c55e' },
  { id: 'psychology', label: 'Mind', color: '#a855f7' },
  { id: 'hobby', label: 'Hobby', color: '#f59e0b' },
  { id: 'money', label: 'Money', color: '#10b981' },
  { id: 'general', label: 'General', color: '#64748b' }
]

export const areaLabel = (id: string): string => LIFE_AREAS.find((a) => a.id === id)?.label ?? id

export const areaColor = (id: string): string =>
  LIFE_AREAS.find((a) => a.id === id)?.color ?? '#64748b'
