// src/main/services/TaskService.ts
// M8 — Unified tasks, goals and habits spanning every life area.

import { v4 as uuidv4 } from 'uuid'
import { eq, desc, and } from 'drizzle-orm'
import { getDb } from '../db/index'
import { tasks, goals, habits, habitLogs } from '../db/schema'
import type {
  TaskIPC,
  TaskStatus,
  TaskPriority,
  GoalIPC,
  GoalStatus,
  HabitIPC,
  LifeArea
} from '../../shared/types'

const iso = (d: Date | null) => (d instanceof Date ? d.toISOString() : d ? String(d) : null)

/** Local YYYY-MM-DD for a given date (defaults to today). */
function localDay(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ---------------- Tasks ----------------

type TaskRow = typeof tasks.$inferSelect

function taskToIPC(row: TaskRow): TaskIPC {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    status: row.status as TaskStatus,
    priority: (row.priority as TaskPriority) || 'medium',
    area: (row.area as LifeArea) || 'general',
    dueDate: iso(row.dueDate),
    projectId: row.projectId,
    goalId: row.goalId,
    sortOrder: row.sortOrder ?? 0,
    githubIssueNumber: row.githubIssueNumber,
    githubIssueUrl: row.githubIssueUrl,
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    completedAt: iso(row.completedAt)
  }
}

export async function getTasks(): Promise<TaskIPC[]> {
  const db = getDb()
  const rows = db.select().from(tasks).orderBy(desc(tasks.createdAt)).all()
  return rows.map(taskToIPC)
}

export async function createTask(data: {
  title: string
  notes?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  area?: LifeArea
  dueDate?: string | null
  projectId?: string | null
  goalId?: string | null
  githubIssueNumber?: number | null
  githubIssueUrl?: string | null
}): Promise<TaskIPC> {
  const db = getDb()
  const row = {
    id: uuidv4(),
    title: data.title,
    notes: data.notes ?? null,
    status: data.status || 'todo',
    priority: data.priority || 'medium',
    area: data.area || 'general',
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    projectId: data.projectId ?? null,
    goalId: data.goalId ?? null,
    sortOrder: 0,
    githubIssueNumber: data.githubIssueNumber ?? null,
    githubIssueUrl: data.githubIssueUrl ?? null,
    createdAt: new Date(),
    completedAt: null
  }
  db.insert(tasks)
    .values(row as any)
    .run()
  return taskToIPC(row as any)
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    notes: string | null
    status: TaskStatus
    priority: TaskPriority
    area: LifeArea
    dueDate: string | null
    projectId: string | null
    goalId: string | null
    githubIssueNumber: number | null
    githubIssueUrl: string | null
  }>
): Promise<TaskIPC> {
  const db = getDb()
  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.priority !== undefined) updateData.priority = data.priority
  if (data.area !== undefined) updateData.area = data.area
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.projectId !== undefined) updateData.projectId = data.projectId
  if (data.goalId !== undefined) updateData.goalId = data.goalId
  if (data.githubIssueNumber !== undefined) updateData.githubIssueNumber = data.githubIssueNumber
  if (data.githubIssueUrl !== undefined) updateData.githubIssueUrl = data.githubIssueUrl
  if (data.status !== undefined) {
    updateData.status = data.status
    updateData.completedAt = data.status === 'done' ? new Date() : null
  }
  db.update(tasks).set(updateData).where(eq(tasks.id, id)).run()
  const updated = db.select().from(tasks).where(eq(tasks.id, id)).get()
  if (!updated) throw new Error(`Task with id ${id} not found.`)
  return taskToIPC(updated)
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(tasks).where(eq(tasks.id, id)).run()
  if (result.changes === 0) throw new Error(`Task with id ${id} not found.`)
}

// ---------------- Goals ----------------

type GoalRow = typeof goals.$inferSelect

function goalToIPC(row: GoalRow): GoalIPC {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    area: (row.area as LifeArea) || 'general',
    targetValue: row.targetValue ?? 100,
    currentValue: row.currentValue ?? 0,
    unit: row.unit,
    dueDate: iso(row.dueDate),
    status: row.status as GoalStatus,
    createdAt: iso(row.createdAt) || new Date().toISOString()
  }
}

export async function getGoals(): Promise<GoalIPC[]> {
  const db = getDb()
  const rows = db.select().from(goals).orderBy(desc(goals.createdAt)).all()
  return rows.map(goalToIPC)
}

export async function createGoal(data: {
  title: string
  description?: string | null
  area?: LifeArea
  targetValue?: number
  currentValue?: number
  unit?: string | null
  dueDate?: string | null
}): Promise<GoalIPC> {
  const db = getDb()
  const row = {
    id: uuidv4(),
    title: data.title,
    description: data.description ?? null,
    area: data.area || 'general',
    targetValue: data.targetValue ?? 100,
    currentValue: data.currentValue ?? 0,
    unit: data.unit ?? null,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    status: 'active',
    createdAt: new Date()
  }
  db.insert(goals)
    .values(row as any)
    .run()
  return goalToIPC(row as any)
}

export async function updateGoal(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    area: LifeArea
    targetValue: number
    currentValue: number
    unit: string | null
    dueDate: string | null
    status: GoalStatus
  }>
): Promise<GoalIPC> {
  const db = getDb()
  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.area !== undefined) updateData.area = data.area
  if (data.targetValue !== undefined) updateData.targetValue = data.targetValue
  if (data.currentValue !== undefined) updateData.currentValue = data.currentValue
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.status !== undefined) updateData.status = data.status
  db.update(goals).set(updateData).where(eq(goals.id, id)).run()
  const updated = db.select().from(goals).where(eq(goals.id, id)).get()
  if (!updated) throw new Error(`Goal with id ${id} not found.`)
  return goalToIPC(updated)
}

export async function deleteGoal(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(goals).where(eq(goals.id, id)).run()
  if (result.changes === 0) throw new Error(`Goal with id ${id} not found.`)
}

// ---------------- Habits ----------------

type HabitRow = typeof habits.$inferSelect

function computeHabitStats(habitId: string): {
  doneToday: boolean
  streak: number
  last7: boolean[]
} {
  const db = getDb()
  const logs = db.select().from(habitLogs).where(eq(habitLogs.habitId, habitId)).all()
  const days = new Set(logs.map((l) => l.date))
  const today = localDay()

  // streak: count back from today (or yesterday if today not done) while consecutive days exist
  let streak = 0
  const cursor = new Date()
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1)
  // walk backwards
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (days.has(localDay(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  const last7: boolean[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7.push(days.has(localDay(d)))
  }

  return { doneToday: days.has(today), streak, last7 }
}

function habitToIPC(row: HabitRow): HabitIPC {
  const stats = computeHabitStats(row.id)
  return {
    id: row.id,
    name: row.name,
    area: (row.area as LifeArea) || 'general',
    color: row.color || '#6366f1',
    schedule: row.schedule || 'daily',
    archived: !!row.archived,
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    doneToday: stats.doneToday,
    streak: stats.streak,
    last7: stats.last7
  }
}

export async function getHabits(): Promise<HabitIPC[]> {
  const db = getDb()
  const rows = db
    .select()
    .from(habits)
    .where(eq(habits.archived, false))
    .orderBy(desc(habits.createdAt))
    .all()
  return rows.map(habitToIPC)
}

export async function createHabit(data: {
  name: string
  area?: LifeArea
  color?: string
}): Promise<HabitIPC> {
  const db = getDb()
  const row = {
    id: uuidv4(),
    name: data.name,
    area: data.area || 'general',
    color: data.color || '#6366f1',
    schedule: 'daily',
    archived: false,
    createdAt: new Date()
  }
  db.insert(habits)
    .values(row as any)
    .run()
  return habitToIPC(row as any)
}

export async function updateHabit(
  id: string,
  data: Partial<{ name: string; area: LifeArea; color: string; archived: boolean }>
): Promise<HabitIPC> {
  const db = getDb()
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.area !== undefined) updateData.area = data.area
  if (data.color !== undefined) updateData.color = data.color
  if (data.archived !== undefined) updateData.archived = data.archived
  db.update(habits).set(updateData).where(eq(habits.id, id)).run()
  const updated = db.select().from(habits).where(eq(habits.id, id)).get()
  if (!updated) throw new Error(`Habit with id ${id} not found.`)
  return habitToIPC(updated)
}

export async function deleteHabit(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(habits).where(eq(habits.id, id)).run()
  if (result.changes === 0) throw new Error(`Habit with id ${id} not found.`)
}

/** Toggle today's (or a given day's) completion for a habit. Returns the refreshed habit. */
export async function toggleHabit(id: string, date?: string): Promise<HabitIPC> {
  const db = getDb()
  const day = date || localDay()
  const existing = db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.habitId, id), eq(habitLogs.date, day)))
    .get()
  if (existing) {
    db.delete(habitLogs).where(eq(habitLogs.id, existing.id)).run()
  } else {
    db.insert(habitLogs)
      .values({ id: uuidv4(), habitId: id, date: day, createdAt: new Date() } as any)
      .run()
  }
  const row = db.select().from(habits).where(eq(habits.id, id)).get()
  if (!row) throw new Error(`Habit with id ${id} not found.`)
  return habitToIPC(row)
}
