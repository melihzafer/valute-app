// src/main/services/LifeService.ts
// M1 (Unified Life Dashboard) + M2 (Cross-domain statistics) aggregation.

import { getDb } from '../db/index'
import {
  tasks,
  habits,
  habitLogs,
  assignments,
  goals,
  moodEntries,
  logs,
  projects
} from '../db/schema'
import { eq } from 'drizzle-orm'
import { getStats } from './DashboardService'
import type { LifeOverview, LifeStats } from '../../shared/types'

function localDay(d = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfWeek(): Date {
  const d = new Date()
  const dow = (d.getDay() + 6) % 7 // Monday = 0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - dow)
  return d
}

/** M1 — single glanceable snapshot across every life area. */
export async function getLifeOverview(): Promise<LifeOverview> {
  const db = getDb()
  const today = localDay()
  const now = new Date()

  const allTasks = db.select().from(tasks).all()
  const open = allTasks.filter((t) => t.status !== 'done')
  const tasksDueToday = open.filter(
    (t) => t.dueDate && localDay(new Date(t.dueDate)) === today
  ).length
  const tasksOverdue = open.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && localDay(new Date(t.dueDate)) !== today
  ).length

  const allHabits = db.select().from(habits).where(eq(habits.archived, false)).all()
  const todayLogs = db.select().from(habitLogs).where(eq(habitLogs.date, today)).all()
  const habitsDoneToday = new Set(todayLogs.map((l) => l.habitId)).size

  const allAssignments = db.select().from(assignments).all()
  const weekAhead = new Date()
  weekAhead.setDate(weekAhead.getDate() + 7)
  const assignmentsDueSoon = allAssignments.filter(
    (a) =>
      a.status !== 'done' &&
      a.dueDate &&
      new Date(a.dueDate) >= now &&
      new Date(a.dueDate) <= weekAhead
  ).length

  const activeGoals = db.select().from(goals).where(eq(goals.status, 'active')).all().length

  const moods = db.select().from(moodEntries).all()
  const moodLoggedToday = moods.some((m) => m.date === today)
  // avg mood last 7 days
  const since = new Date()
  since.setDate(since.getDate() - 6)
  const recentMoods = moods.filter((m) => m.date >= localDay(since))
  const avgMood7 =
    recentMoods.length > 0
      ? Math.round((recentMoods.reduce((s, m) => s + m.mood, 0) / recentMoods.length) * 10) / 10
      : null

  // hours this week (seconds)
  const weekStart = startOfWeek()
  const allLogs = db.select().from(logs).all()
  const hoursThisWeek = allLogs
    .filter((l) => l.startTime && new Date(l.startTime) >= weekStart)
    .reduce((s, l) => s + (l.duration || 0), 0)

  const activeProjects = db
    .select()
    .from(projects)
    .all()
    .filter((p) => !p.archived).length

  let earningsThisMonth = 0
  try {
    earningsThisMonth = getStats().currentMonthEarnings
  } catch {
    earningsThisMonth = 0
  }

  return {
    tasksDueToday,
    tasksOverdue,
    habitsDoneToday,
    habitsTotal: allHabits.length,
    assignmentsDueSoon,
    activeGoals,
    moodLoggedToday,
    avgMood7,
    earningsThisMonth,
    hoursThisWeek,
    activeProjects
  }
}

/** M2 — time-series + headline stats over the last `days` days (default 30). */
export async function getLifeStats(days = 30): Promise<LifeStats> {
  const db = getDb()
  const dayList: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dayList.push(localDay(d))
  }
  const rangeStart = dayList[0]

  // Mood series
  const moods = db.select().from(moodEntries).all()
  const moodByDay = new Map(moods.map((m) => [m.date, m.mood]))
  const moodSeries = dayList.map((date) => ({ date, mood: moodByDay.get(date) ?? null }))
  const moodVals = moods.filter((m) => m.date >= rangeStart).map((m) => m.mood)
  const avgMood = moodVals.length
    ? Math.round((moodVals.reduce((a, b) => a + b, 0) / moodVals.length) * 10) / 10
    : null

  // Task completion per day
  const allTasks = db.select().from(tasks).all()
  const taskCompletion = dayList.map((date) => ({
    date,
    completed: allTasks.filter((t) => t.completedAt && localDay(new Date(t.completedAt)) === date)
      .length
  }))
  const tasksCompleted = taskCompletion.reduce((s, d) => s + d.completed, 0)

  // Habit consistency per day = completed habits / total habits
  const allHabits = db.select().from(habits).where(eq(habits.archived, false)).all()
  const allHabitLogs = db.select().from(habitLogs).all()
  const habitTotal = allHabits.length || 1
  const logsByDay = new Map<string, number>()
  for (const l of allHabitLogs) logsByDay.set(l.date, (logsByDay.get(l.date) || 0) + 1)
  const habitConsistency = dayList.map((date) => ({
    date,
    ratio: Math.min(1, (logsByDay.get(date) || 0) / habitTotal)
  }))
  const habitCompletionRate =
    habitConsistency.reduce((s, d) => s + d.ratio, 0) / (habitConsistency.length || 1)

  // best current streak among habits
  let bestHabitStreak = 0
  for (const h of allHabits) {
    const days = new Set(allHabitLogs.filter((l) => l.habitId === h.id).map((l) => l.date))
    let streak = 0
    const cursor = new Date()
    if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1)
    while (days.has(localDay(cursor))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    if (streak > bestHabitStreak) bestHabitStreak = streak
  }

  // Hours by area (work projects tracked via logs -> use project category as area)
  const allLogs = db.select().from(logs).all()
  const allProjects = db.select().from(projects).all()
  const projCat = new Map(allProjects.map((p) => [p.id, (p as any).category || 'work']))
  const areaSeconds = new Map<string, number>()
  for (const l of allLogs) {
    if (!l.startTime || localDay(new Date(l.startTime)) < rangeStart) continue
    const area =
      projCat.get(l.projectId) === 'hobby'
        ? 'hobby'
        : projCat.get(l.projectId) === 'personal'
          ? 'personal'
          : 'work'
    areaSeconds.set(area, (areaSeconds.get(area) || 0) + (l.duration || 0))
  }
  const hoursByArea = Array.from(areaSeconds.entries()).map(([area, seconds]) => ({
    area,
    seconds
  }))

  return {
    moodSeries,
    taskCompletion,
    habitConsistency,
    hoursByArea,
    tasksCompleted,
    habitCompletionRate,
    bestHabitStreak,
    avgMood
  }
}
