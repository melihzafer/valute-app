// src/main/services/HealthService.ts
// M4 — Health & Wellbeing: sleep, workouts, water, weight, steps.

import { v4 as uuidv4 } from 'uuid'
import { eq, desc, gte } from 'drizzle-orm'
import { getDb } from '../db/index'
import { healthEntries } from '../db/schema'
import type { HealthEntryIPC, HealthStats } from '../../shared/types'

const iso = (d: Date | null) => (d instanceof Date ? d.toISOString() : d ? String(d) : null)

type HealthRow = typeof healthEntries.$inferSelect

function localDay(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toIPC(row: HealthRow): HealthEntryIPC {
  return {
    id: row.id,
    date: row.date,
    sleepHours: row.sleepHours,
    waterMl: row.waterMl,
    workoutDuration: row.workoutDuration,
    workoutType: row.workoutType,
    weight: row.weight,
    steps: row.steps,
    energyLevel: row.energyLevel,
    notes: row.notes,
    createdAt: iso(row.createdAt) || new Date().toISOString()
  }
}

export async function getHealthEntries(): Promise<HealthEntryIPC[]> {
  const db = getDb()
  const rows = db.select().from(healthEntries).orderBy(desc(healthEntries.date)).all()
  return rows.map(toIPC)
}

export async function saveHealthEntry(data: {
  date?: string
  sleepHours?: number | null
  waterMl?: number | null
  workoutDuration?: number | null
  workoutType?: string | null
  weight?: number | null
  steps?: number | null
  energyLevel?: number | null
  notes?: string | null
}): Promise<HealthEntryIPC> {
  const db = getDb()
  const day = data.date || localDay()
  const existing = db.select().from(healthEntries).where(eq(healthEntries.date, day)).get()

  if (existing) {
    const updateData: any = {}
    if (data.sleepHours !== undefined) updateData.sleepHours = data.sleepHours
    if (data.waterMl !== undefined) updateData.waterMl = data.waterMl
    if (data.workoutDuration !== undefined) updateData.workoutDuration = data.workoutDuration
    if (data.workoutType !== undefined) updateData.workoutType = data.workoutType
    if (data.weight !== undefined) updateData.weight = data.weight
    if (data.steps !== undefined) updateData.steps = data.steps
    if (data.energyLevel !== undefined) updateData.energyLevel = data.energyLevel
    if (data.notes !== undefined) updateData.notes = data.notes

    db.update(healthEntries).set(updateData).where(eq(healthEntries.id, existing.id)).run()
    const updated = db.select().from(healthEntries).where(eq(healthEntries.id, existing.id)).get()
    return toIPC(updated!)
  }

  const row = {
    id: uuidv4(),
    date: day,
    sleepHours: data.sleepHours ?? null,
    waterMl: data.waterMl ?? null,
    workoutDuration: data.workoutDuration ?? null,
    workoutType: data.workoutType ?? null,
    weight: data.weight ?? null,
    steps: data.steps ?? null,
    energyLevel: data.energyLevel ?? null,
    notes: data.notes ?? null,
    createdAt: new Date()
  }

  db.insert(healthEntries)
    .values(row as any)
    .run()
  return toIPC(row as any)
}

export async function deleteHealthEntry(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(healthEntries).where(eq(healthEntries.id, id)).run()
  if (result.changes === 0) throw new Error(`Health entry with id ${id} not found.`)
}

export async function getHealthStats(): Promise<HealthStats> {
  const db = getDb()
  const todayStr = localDay()

  // Fetch entries for the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = localDay(sevenDaysAgo)

  const entries = db
    .select()
    .from(healthEntries)
    .where(gte(healthEntries.date, sevenDaysAgoStr))
    .orderBy(desc(healthEntries.date))
    .all()

  const todayEntry = entries.find((e) => e.date === todayStr)

  // Calculate averages and aggregates
  const validSleep = entries.filter((e) => e.sleepHours !== null && e.sleepHours !== undefined) as {
    sleepHours: number
  }[]
  const validSteps = entries.filter((e) => e.steps !== null && e.steps !== undefined) as {
    steps: number
  }[]
  const validWater = entries.filter((e) => e.waterMl !== null && e.waterMl !== undefined) as {
    waterMl: number
  }[]
  const validWorkouts = entries.filter(
    (e) => e.workoutDuration !== null && e.workoutDuration !== undefined && e.workoutDuration > 0
  ) as { workoutDuration: number }[]

  const avgSleepHours7 =
    validSleep.length > 0
      ? Number(
          (validSleep.reduce((acc, e) => acc + e.sleepHours, 0) / validSleep.length).toFixed(1)
        )
      : null
  const avgSteps7 =
    validSteps.length > 0
      ? Math.round(validSteps.reduce((acc, e) => acc + e.steps, 0) / validSteps.length)
      : null
  const totalWater7 = validWater.reduce((acc, e) => acc + e.waterMl, 0)

  // Last 7 days history structures
  const weightHistory: { date: string; weight: number | null }[] = []
  const sleepHistory: { date: string; hours: number | null }[] = []
  const stepsHistory: { date: string; steps: number | null }[] = []

  // Generate date list for past 7 days (including today)
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dStr = localDay(d)
    const entryForDay = entries.find((e) => e.date === dStr)

    weightHistory.push({ date: dStr, weight: entryForDay?.weight ?? null })
    sleepHistory.push({ date: dStr, hours: entryForDay?.sleepHours ?? null })
    stepsHistory.push({ date: dStr, steps: entryForDay?.steps ?? null })
  }

  return {
    waterLoggedToday: todayEntry?.waterMl ?? 0,
    stepsLoggedToday: todayEntry?.steps ?? 0,
    sleepLoggedToday: todayEntry?.sleepHours ?? 0,
    avgSleepHours7,
    avgSteps7,
    totalWater7,
    workoutCount7: validWorkouts.length,
    workoutMinutes7: validWorkouts.reduce((acc, e) => acc + e.workoutDuration, 0),
    weightHistory,
    sleepHistory,
    stepsHistory
  }
}
