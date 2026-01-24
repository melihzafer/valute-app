// src/main/services/ProjectService.ts
// Updated to use Drizzle ORM

import { v4 as uuidv4 } from 'uuid'
import { eq, and, gte, lte } from 'drizzle-orm'
import { getDb } from '../db/index'
import { projects, logs, expenses } from '../db/schema'
import type { Project, Log, Expense } from '../../shared/types'

// --- Project Service ---

export async function getProjects(): Promise<Project[]> {
  const db = getDb()
  const result = db.select().from(projects).all()

  // Map database 'type' to frontend 'pricingModel'
  return result.map((project) => ({
    ...project,
    pricingModel: project.type as any,
    status: project.archived ? 'archived' : 'active'
  })) as Project[]
}

export async function createProject(
  projectData: Omit<Project, 'id' | 'createdAt'>
): Promise<Project> {
  const db = getDb()

  // MAP frontend 'pricingModel' to database 'type' column
  const newProject = {
    id: uuidv4(),
    name: projectData.name,
    clientName: projectData.clientName || null,
    type: projectData.pricingModel || 'HOURLY', // CRITICAL FIX: Map pricingModel to type
    currency: projectData.currency || 'USD',
    hourlyRate: projectData.hourlyRate || 0,
    fixedPrice: projectData.fixedPrice || null,
    unitName: projectData.unitName || null,
    archived: projectData.status === 'archived' ? 1 : 0,
    assetsPath: null, // Optional field
    createdAt: new Date()
  }

  db.insert(projects)
    .values(newProject as any)
    .run()

  // Return with frontend-expected field name
  return {
    ...newProject,
    pricingModel: newProject.type as any,
    status: newProject.archived ? 'archived' : 'active'
  } as Project
}

export async function updateProject(
  id: string,
  projectData: Partial<Omit<Project, 'createdAt'>>
): Promise<Project> {
  const db = getDb()

  // Map frontend fields to database columns
  const updateData: any = {
    name: projectData.name,
    clientName: projectData.clientName,
    type: projectData.pricingModel, // Map pricingModel to type
    currency: projectData.currency,
    hourlyRate: projectData.hourlyRate,
    fixedPrice: projectData.fixedPrice,
    unitName: projectData.unitName,
    notes: projectData.notes // Include notes field for The Canvas
  }

  // Remove undefined values
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key]
    }
  })

  // Convert status to archived flag if present
  if (projectData.status !== undefined) {
    updateData.archived = projectData.status === 'archived' ? 1 : 0
  }

  db.update(projects).set(updateData).where(eq(projects.id, id)).run()

  const updated = db.select().from(projects).where(eq(projects.id, id)).get()

  if (!updated) {
    throw new Error(`Project with id ${id} not found.`)
  }

  // Map back to frontend format
  return {
    ...updated,
    pricingModel: updated.type as any,
    status: updated.archived ? 'archived' : 'active'
  } as Project
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb()

  const result = db.delete(projects).where(eq(projects.id, id)).run()

  if (result.changes === 0) {
    throw new Error(`Project with id ${id} not found.`)
  }

  // Foreign keys with CASCADE will automatically delete related logs and invoices
}

// --- Log Service ---

export async function getLogsByProject(projectId: string): Promise<Log[]> {
  const db = getDb()
  const result = db.select().from(logs).where(eq(logs.projectId, projectId)).all()

  // Map DB fields to frontend fields
  return result.map((log) => ({
    id: log.id,
    projectId: log.projectId,
    startTime: log.startTime,
    endTime: log.endTime,
    accumulatedTime: log.duration || 0, // Map DB duration -> frontend accumulatedTime
    quantity: log.quantity,
    description: log.notes || '', // Map DB notes -> frontend description
    invoiceId: log.invoiceId
  })) as Log[]
}

export async function saveLog(logData: Omit<Log, 'id'>): Promise<Log> {
  const db = getDb()

  const newLog = {
    id: uuidv4(),
    projectId: logData.projectId,
    startTime: logData.startTime,
    endTime: logData.endTime,
    duration: logData.accumulatedTime, // Map frontend accumulatedTime -> DB duration
    notes: logData.description || '', // Map frontend description -> DB notes
    quantity: logData.quantity
  }

  db.insert(logs)
    .values(newLog as any)
    .run()

  // Return with frontend field names
  return {
    id: newLog.id,
    projectId: newLog.projectId,
    startTime: newLog.startTime,
    endTime: newLog.endTime,
    accumulatedTime: newLog.duration || 0,
    quantity: newLog.quantity,
    description: newLog.notes || '',
    invoiceId: null
  } as Log
}

export async function deleteLog(id: string): Promise<void> {
  const db = getDb()

  const result = db.delete(logs).where(eq(logs.id, id)).run()

  if (result.changes === 0) {
    throw new Error(`Log with id ${id} not found.`)
  }
}

export async function getLogsByDateRange(
  startDate: Date,
  endDate: Date,
  projectId?: string
): Promise<Log[]> {
  const db = getDb()

  console.log('[getLogsByDateRange] Input params:', { startDate, endDate, projectId })

  // Build WHERE clause conditionally
  const conditions = [
    gte(logs.startTime, startDate as any),
    lte(logs.startTime, endDate as any)
  ]

  if (projectId) {
    conditions.push(eq(logs.projectId, projectId))
  }

  // Pass Date objects directly to Drizzle ORM timestamp comparison
  const result = db.select().from(logs).where(and(...conditions)).all()
  console.log('[getLogsByDateRange] Query returned:', result.length, 'logs')

  // Map DB fields to frontend fields
  return result.map((log) => ({
    id: log.id,
    projectId: log.projectId,
    startTime: log.startTime,
    endTime: log.endTime,
    accumulatedTime: log.duration || 0,
    quantity: log.quantity,
    description: log.notes || '',
    invoiceId: log.invoiceId
  })) as Log[]
}

// --- Expense Service ---

export async function getExpensesByProject(projectId: string): Promise<Expense[]> {
  const db = getDb()
  const result = db.select().from(expenses).where(eq(expenses.projectId, projectId)).all()

  return result.map((exp) => ({
    id: exp.id,
    projectId: exp.projectId,
    description: exp.description,
    amount: exp.amount,
    date: exp.date || new Date(),
    isBillable: exp.isBillable ?? true,
    category: undefined // Not in current schema
  })) as Expense[]
}

export async function createExpense(expenseData: Omit<Expense, 'id'>): Promise<Expense> {
  const db = getDb()

  const newExpense = {
    id: uuidv4(),
    projectId: expenseData.projectId,
    description: expenseData.description,
    amount: expenseData.amount,
    isBillable: expenseData.isBillable ? 1 : 0,
    date: expenseData.date,
    createdAt: new Date()
  }

  db.insert(expenses)
    .values(newExpense as any)
    .run()

  return {
    id: newExpense.id,
    projectId: newExpense.projectId,
    description: newExpense.description,
    amount: newExpense.amount,
    date: newExpense.date,
    isBillable: expenseData.isBillable,
    category: expenseData.category
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const db = getDb()

  const result = db.delete(expenses).where(eq(expenses.id, id)).run()

  if (result.changes === 0) {
    throw new Error(`Expense with id ${id} not found.`)
  }
}

// --- Project Notes (The Canvas) ---

export async function updateProjectNotes(id: string, notes: string): Promise<void> {
  const db = getDb()
  db.update(projects).set({ notes }).where(eq(projects.id, id)).run()
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = getDb()
  const result = db.select().from(projects).where(eq(projects.id, id)).get()

  if (!result) return null

  return {
    ...result,
    pricingModel: result.type as any,
    status: result.archived ? 'archived' : 'active'
  } as Project
}
