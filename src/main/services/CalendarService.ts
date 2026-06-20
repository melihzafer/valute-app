// src/main/services/CalendarService.ts
// M11 — Calendar, Reminders & Notifications.
// Manual events CRUD + a unified calendar feed that aggregates deadlines from
// tasks, assignments and invoices, plus reminder queries for desktop notifications.

import { v4 as uuidv4 } from 'uuid'
import { eq, and, gte, lte, isNotNull, ne } from 'drizzle-orm'
import { getDb } from '../db/index'
import { events, tasks, assignments, courses, invoices, projects } from '../db/schema'
import type { EventIPC, EventRecurrence, CalendarItem, LifeArea } from '../../shared/types'

type EventRow = typeof events.$inferSelect

const iso = (d: Date | number | null): string | null =>
  d == null ? null : d instanceof Date ? d.toISOString() : new Date(d).toISOString()

// Per-area colours used for items that have no explicit colour of their own.
const AREA_COLORS: Record<string, string> = {
  work: '#6366f1',
  uni: '#8b5cf6',
  health: '#10b981',
  psychology: '#ec4899',
  hobby: '#f59e0b',
  money: '#22c55e',
  general: '#64748b'
}

function areaColor(area?: string | null): string {
  return AREA_COLORS[area || 'general'] || AREA_COLORS.general
}

function toIPC(row: EventRow): EventIPC {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    area: (row.area || 'general') as LifeArea,
    startTime: iso(row.startTime)!,
    endTime: iso(row.endTime),
    allDay: !!row.allDay,
    location: row.location,
    color: row.color || areaColor(row.area),
    recurrence: (row.recurrence || 'none') as EventRecurrence,
    reminderMinutes: row.reminderMinutes,
    projectId: row.projectId,
    createdAt: iso(row.createdAt) || new Date().toISOString()
  }
}

// ---------------------------------------------------------------------------
// Events CRUD
// ---------------------------------------------------------------------------

export async function getEvents(): Promise<EventIPC[]> {
  const db = getDb()
  const rows = db.select().from(events).all()
  return rows.map(toIPC)
}

export async function createEvent(data: {
  title: string
  description?: string | null
  area?: string
  startTime: string
  endTime?: string | null
  allDay?: boolean
  location?: string | null
  color?: string | null
  recurrence?: EventRecurrence
  reminderMinutes?: number | null
  projectId?: string | null
}): Promise<EventIPC> {
  const db = getDb()
  const row = {
    id: uuidv4(),
    title: data.title,
    description: data.description ?? null,
    area: data.area || 'general',
    startTime: new Date(data.startTime),
    endTime: data.endTime ? new Date(data.endTime) : null,
    allDay: data.allDay ?? false,
    location: data.location ?? null,
    color: data.color || areaColor(data.area),
    recurrence: data.recurrence || 'none',
    reminderMinutes: data.reminderMinutes ?? null,
    notifiedFor: null,
    projectId: data.projectId ?? null,
    createdAt: new Date()
  }
  db.insert(events)
    .values(row as any)
    .run()
  return toIPC(row as any)
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string
    description: string | null
    area: string
    startTime: string
    endTime: string | null
    allDay: boolean
    location: string | null
    color: string | null
    recurrence: EventRecurrence
    reminderMinutes: number | null
    projectId: string | null
  }>
): Promise<EventIPC> {
  const db = getDb()
  const patch: any = {}
  if (data.title !== undefined) patch.title = data.title
  if (data.description !== undefined) patch.description = data.description
  if (data.area !== undefined) patch.area = data.area
  if (data.startTime !== undefined) patch.startTime = new Date(data.startTime)
  if (data.endTime !== undefined) patch.endTime = data.endTime ? new Date(data.endTime) : null
  if (data.allDay !== undefined) patch.allDay = data.allDay
  if (data.location !== undefined) patch.location = data.location
  if (data.color !== undefined) patch.color = data.color
  if (data.recurrence !== undefined) patch.recurrence = data.recurrence
  if (data.reminderMinutes !== undefined) patch.reminderMinutes = data.reminderMinutes
  if (data.projectId !== undefined) patch.projectId = data.projectId
  // Any edit to timing/reminder resets the "already notified" guard.
  if (data.startTime !== undefined || data.reminderMinutes !== undefined) patch.notifiedFor = null

  db.update(events).set(patch).where(eq(events.id, id)).run()
  const updated = db.select().from(events).where(eq(events.id, id)).get()
  if (!updated) throw new Error(`Event with id ${id} not found.`)
  return toIPC(updated)
}

export async function deleteEvent(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(events).where(eq(events.id, id)).run()
  if (result.changes === 0) throw new Error(`Event with id ${id} not found.`)
}

// ---------------------------------------------------------------------------
// Recurrence expansion
// ---------------------------------------------------------------------------

/** Generate occurrence start-dates of an event that fall within [from, to]. */
function expandOccurrences(start: Date, recurrence: string, from: Date, to: Date): Date[] {
  if (recurrence === 'none' || !recurrence) {
    return start >= from && start <= to ? [start] : []
  }
  const out: Date[] = []
  const cursor = new Date(start)
  // Fast-forward the cursor close to the window start to avoid huge loops.
  let guard = 0
  const maxIterations = 1500
  while (cursor < from && guard < maxIterations) {
    advance(cursor, recurrence)
    guard++
  }
  guard = 0
  while (cursor <= to && guard < 800) {
    if (cursor >= from) out.push(new Date(cursor))
    advance(cursor, recurrence)
    guard++
  }
  return out
}

function advance(d: Date, recurrence: string): void {
  if (recurrence === 'daily') d.setDate(d.getDate() + 1)
  else if (recurrence === 'weekly') d.setDate(d.getDate() + 7)
  else if (recurrence === 'monthly') d.setMonth(d.getMonth() + 1)
  else d.setFullYear(d.getFullYear() + 100) // 'none' fallthrough — exit loop
}

// ---------------------------------------------------------------------------
// Unified calendar feed
// ---------------------------------------------------------------------------

/** Returns every dated item (events + deadlines) overlapping [startISO, endISO]. */
export async function getCalendar(startISO: string, endISO: string): Promise<CalendarItem[]> {
  const db = getDb()
  const from = new Date(startISO)
  const to = new Date(endISO)
  const items: CalendarItem[] = []

  // 1) Manual events (with recurrence expansion)
  for (const row of db.select().from(events).all()) {
    const ev = toIPC(row)
    const durationMs = ev.endTime
      ? new Date(ev.endTime).getTime() - new Date(ev.startTime).getTime()
      : 0
    for (const occ of expandOccurrences(new Date(ev.startTime), ev.recurrence, from, to)) {
      items.push({
        id: `${ev.id}@${occ.toISOString()}`,
        refId: ev.id,
        source: 'event',
        title: ev.title,
        date: occ.toISOString(),
        endDate: durationMs ? new Date(occ.getTime() + durationMs).toISOString() : null,
        allDay: ev.allDay,
        area: ev.area,
        color: ev.color,
        meta: ev.location,
        done: false,
        route: '/calendar'
      })
    }
  }

  // 2) Tasks with a due date
  const taskRows = db
    .select()
    .from(tasks)
    .where(and(isNotNull(tasks.dueDate), gte(tasks.dueDate, from), lte(tasks.dueDate, to)))
    .all()
  for (const t of taskRows) {
    items.push({
      id: `task-${t.id}`,
      refId: t.id,
      source: 'task',
      title: t.title,
      date: iso(t.dueDate)!,
      endDate: null,
      allDay: true,
      area: (t.area || 'general') as LifeArea,
      color: areaColor(t.area),
      meta: t.priority ? `${t.priority} priority` : null,
      done: t.status === 'done',
      route: '/planner'
    })
  }

  // 3) Assignments with a due date (joined to their course for name + colour)
  const courseMap = new Map(
    db
      .select()
      .from(courses)
      .all()
      .map((c) => [c.id, c])
  )
  const asgRows = db
    .select()
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.dueDate),
        gte(assignments.dueDate, from),
        lte(assignments.dueDate, to)
      )
    )
    .all()
  for (const a of asgRows) {
    const course = courseMap.get(a.courseId)
    items.push({
      id: `asg-${a.id}`,
      refId: a.id,
      source: 'assignment',
      title: a.title,
      date: iso(a.dueDate)!,
      endDate: null,
      allDay: true,
      area: 'uni',
      color: course?.color || AREA_COLORS.uni,
      meta: course ? course.name : null,
      done: a.status === 'done',
      route: '/university'
    })
  }

  // 4) Invoices due (unpaid) — money deadlines
  const projMap = new Map(
    db
      .select()
      .from(projects)
      .all()
      .map((p) => [p.id, p])
  )
  const invRows = db
    .select()
    .from(invoices)
    .where(and(gte(invoices.dueDate, from), lte(invoices.dueDate, to), ne(invoices.status, 'paid')))
    .all()
  for (const inv of invRows) {
    const proj = projMap.get(inv.projectId)
    items.push({
      id: `inv-${inv.id}`,
      refId: inv.id,
      source: 'invoice',
      title: `Invoice ${inv.invoiceNumber} due`,
      date: iso(inv.dueDate)!,
      endDate: null,
      allDay: true,
      area: 'money',
      color: AREA_COLORS.money,
      meta: proj ? proj.name : inv.status,
      done: false,
      route: '/finance'
    })
  }

  items.sort((a, b) => a.date.localeCompare(b.date))
  return items
}

/** Items due within the next `days` days (default 7), sorted soonest-first. */
export async function getUpcoming(days = 7): Promise<CalendarItem[]> {
  const now = new Date()
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const all = await getCalendar(now.toISOString(), end.toISOString())
  return all.filter((i) => i.source !== 'event' || new Date(i.date) >= now).filter((i) => !i.done)
}

// ---------------------------------------------------------------------------
// Reminders (used by the main-process NotificationService)
// ---------------------------------------------------------------------------

export interface DueReminder {
  eventId: string
  occurrenceISO: string
  title: string
  body: string
  area: string
}

/**
 * Returns events whose reminder time has just elapsed for their next occurrence
 * and that have not yet been notified for that occurrence.
 */
export async function getDueReminders(now = new Date()): Promise<DueReminder[]> {
  const db = getDb()
  const out: DueReminder[] = []
  const horizon = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000)

  for (const row of db.select().from(events).where(isNotNull(events.reminderMinutes)).all()) {
    const reminderMin = row.reminderMinutes!
    const occ = expandOccurrences(
      new Date(row.startTime as any),
      row.recurrence || 'none',
      now,
      horizon
    )
    // Find the soonest upcoming occurrence.
    const next = occ[0]
    if (!next) continue
    const remindAt = new Date(next.getTime() - reminderMin * 60 * 1000)
    const occISO = next.toISOString()
    if (now >= remindAt && row.notifiedFor !== occISO) {
      const when = next.toLocaleString()
      out.push({
        eventId: row.id,
        occurrenceISO: occISO,
        title: row.title,
        body: row.location ? `${when} · ${row.location}` : when,
        area: row.area || 'general'
      })
    }
  }
  return out
}

export async function markReminderNotified(eventId: string, occurrenceISO: string): Promise<void> {
  const db = getDb()
  db.update(events).set({ notifiedFor: occurrenceISO }).where(eq(events.id, eventId)).run()
}
