// src/main/services/MoodService.ts
// M5 — Psychology & mood journal: daily mood/energy/stress + gratitude.

import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/index'
import { moodEntries } from '../db/schema'
import type { MoodEntryIPC } from '../../shared/types'

const iso = (d: Date | null) => (d instanceof Date ? d.toISOString() : d ? String(d) : null)

type MoodRow = typeof moodEntries.$inferSelect

function localDay(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toIPC(row: MoodRow): MoodEntryIPC {
  return {
    id: row.id,
    date: row.date,
    mood: row.mood,
    energy: row.energy,
    stress: row.stress,
    note: row.note,
    gratitude: row.gratitude,
    createdAt: iso(row.createdAt) || new Date().toISOString()
  }
}

export async function getMoodEntries(): Promise<MoodEntryIPC[]> {
  const db = getDb()
  const rows = db.select().from(moodEntries).orderBy(desc(moodEntries.date)).all()
  return rows.map(toIPC)
}

/** Create or overwrite the entry for a given day (one per day). */
export async function saveMoodEntry(data: {
  date?: string
  mood: number
  energy?: number | null
  stress?: number | null
  note?: string | null
  gratitude?: string | null
}): Promise<MoodEntryIPC> {
  const db = getDb()
  const day = data.date || localDay()
  const existing = db.select().from(moodEntries).where(eq(moodEntries.date, day)).get()
  if (existing) {
    const updateData: any = { mood: data.mood }
    if (data.energy !== undefined) updateData.energy = data.energy
    if (data.stress !== undefined) updateData.stress = data.stress
    if (data.note !== undefined) updateData.note = data.note
    if (data.gratitude !== undefined) updateData.gratitude = data.gratitude
    db.update(moodEntries).set(updateData).where(eq(moodEntries.id, existing.id)).run()
    const updated = db.select().from(moodEntries).where(eq(moodEntries.id, existing.id)).get()
    return toIPC(updated!)
  }
  const row = {
    id: uuidv4(),
    date: day,
    mood: data.mood,
    energy: data.energy ?? null,
    stress: data.stress ?? null,
    note: data.note ?? null,
    gratitude: data.gratitude ?? null,
    createdAt: new Date()
  }
  db.insert(moodEntries)
    .values(row as any)
    .run()
  return toIPC(row as any)
}

export async function deleteMoodEntry(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(moodEntries).where(eq(moodEntries.id, id)).run()
  if (result.changes === 0) throw new Error(`Mood entry with id ${id} not found.`)
}
