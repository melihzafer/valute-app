// src/main/services/UniversityService.ts
// M3 — University: courses, assignments, deadlines, grades and GPA.

import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/index'
import { courses, assignments } from '../db/schema'
import type { CourseIPC, AssignmentIPC, AssignmentStatus } from '../../shared/types'

const iso = (d: Date | null) => (d instanceof Date ? d.toISOString() : d ? String(d) : null)

type CourseRow = typeof courses.$inferSelect
type AssignmentRow = typeof assignments.$inferSelect

function assignmentToIPC(row: AssignmentRow): AssignmentIPC {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    notes: row.notes,
    dueDate: iso(row.dueDate),
    status: row.status as AssignmentStatus,
    grade: row.grade,
    weight: row.weight,
    createdAt: iso(row.createdAt) || new Date().toISOString()
  }
}

/** Weighted grade-so-far for a course, using graded assignments only. */
function currentGrade(rows: AssignmentRow[]): number | null {
  const graded = rows.filter((a) => a.grade != null && a.weight != null)
  const totalWeight = graded.reduce((s, a) => s + (a.weight || 0), 0)
  if (totalWeight === 0) return null
  const earned = graded.reduce((s, a) => s + (a.grade || 0) * (a.weight || 0), 0)
  return Math.round((earned / totalWeight) * 10) / 10
}

function courseToIPC(row: CourseRow): CourseIPC {
  const db = getDb()
  const rows = db.select().from(assignments).where(eq(assignments.courseId, row.id)).all()
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    instructor: row.instructor,
    credits: row.credits,
    semester: row.semester,
    color: row.color || '#6366f1',
    archived: !!row.archived,
    createdAt: iso(row.createdAt) || new Date().toISOString(),
    assignmentCount: rows.length,
    openCount: rows.filter((a) => a.status !== 'done').length,
    currentGrade: currentGrade(rows)
  }
}

export async function getCourses(): Promise<CourseIPC[]> {
  const db = getDb()
  const rows = db.select().from(courses).orderBy(desc(courses.createdAt)).all()
  return rows.map(courseToIPC)
}

export async function createCourse(data: {
  name: string
  code?: string | null
  instructor?: string | null
  credits?: number | null
  semester?: string | null
  color?: string
}): Promise<CourseIPC> {
  const db = getDb()
  const row = {
    id: uuidv4(),
    name: data.name,
    code: data.code ?? null,
    instructor: data.instructor ?? null,
    credits: data.credits ?? null,
    semester: data.semester ?? null,
    color: data.color || '#6366f1',
    archived: false,
    createdAt: new Date()
  }
  db.insert(courses)
    .values(row as any)
    .run()
  return courseToIPC(row as any)
}

export async function updateCourse(
  id: string,
  data: Partial<{
    name: string
    code: string | null
    instructor: string | null
    credits: number | null
    semester: string | null
    color: string
    archived: boolean
  }>
): Promise<CourseIPC> {
  const db = getDb()
  const updateData: any = {}
  for (const k of [
    'name',
    'code',
    'instructor',
    'credits',
    'semester',
    'color',
    'archived'
  ] as const) {
    if (data[k] !== undefined) updateData[k] = data[k]
  }
  db.update(courses).set(updateData).where(eq(courses.id, id)).run()
  const updated = db.select().from(courses).where(eq(courses.id, id)).get()
  if (!updated) throw new Error(`Course with id ${id} not found.`)
  return courseToIPC(updated)
}

export async function deleteCourse(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(courses).where(eq(courses.id, id)).run()
  if (result.changes === 0) throw new Error(`Course with id ${id} not found.`)
}

// ---------------- Assignments ----------------

export async function getAssignments(courseId?: string): Promise<AssignmentIPC[]> {
  const db = getDb()
  const rows = courseId
    ? db.select().from(assignments).where(eq(assignments.courseId, courseId)).all()
    : db.select().from(assignments).orderBy(desc(assignments.createdAt)).all()
  return rows.map(assignmentToIPC)
}

export async function createAssignment(data: {
  courseId: string
  title: string
  notes?: string | null
  dueDate?: string | null
  status?: AssignmentStatus
  grade?: number | null
  weight?: number | null
}): Promise<AssignmentIPC> {
  const db = getDb()
  const row = {
    id: uuidv4(),
    courseId: data.courseId,
    title: data.title,
    notes: data.notes ?? null,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
    status: data.status || 'todo',
    grade: data.grade ?? null,
    weight: data.weight ?? null,
    createdAt: new Date()
  }
  db.insert(assignments)
    .values(row as any)
    .run()
  return assignmentToIPC(row as any)
}

export async function updateAssignment(
  id: string,
  data: Partial<{
    title: string
    notes: string | null
    dueDate: string | null
    status: AssignmentStatus
    grade: number | null
    weight: number | null
  }>
): Promise<AssignmentIPC> {
  const db = getDb()
  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  if (data.status !== undefined) updateData.status = data.status
  if (data.grade !== undefined) updateData.grade = data.grade
  if (data.weight !== undefined) updateData.weight = data.weight
  db.update(assignments).set(updateData).where(eq(assignments.id, id)).run()
  const updated = db.select().from(assignments).where(eq(assignments.id, id)).get()
  if (!updated) throw new Error(`Assignment with id ${id} not found.`)
  return assignmentToIPC(updated)
}

export async function deleteAssignment(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(assignments).where(eq(assignments.id, id)).run()
  if (result.changes === 0) throw new Error(`Assignment with id ${id} not found.`)
}

/** GPA-ish snapshot: credit-weighted average of course current grades (0-100 scale). */
export async function getGpa(): Promise<{ gradeAvg: number | null; totalCredits: number }> {
  const all = await getCourses()
  const graded = all.filter((c) => c.currentGrade != null && c.credits != null)
  const totalCredits = graded.reduce((s, c) => s + (c.credits || 0), 0)
  if (totalCredits === 0) return { gradeAvg: null, totalCredits: 0 }
  const sum = graded.reduce((s, c) => s + (c.currentGrade as number) * (c.credits || 0), 0)
  return { gradeAvg: Math.round((sum / totalCredits) * 10) / 10, totalCredits }
}
