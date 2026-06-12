// src/main/services/IdeaService.ts
// Brainstorm space: capture ideas and optionally promote them into projects.

import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/index'
import { ideas, projects } from '../db/schema'
import type { IdeaIPC, IdeaStatus } from '../../shared/types'

function toIPC(row: {
  id: string
  title: string
  body: string | null
  tags: string | null
  status: string
  promotedProjectId: string | null
  createdAt: Date | null
}): IdeaIPC {
  let tags: string[] = []
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags)
      if (Array.isArray(parsed)) tags = parsed
    } catch {
      tags = []
    }
  }
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags,
    status: row.status as IdeaStatus,
    promotedProjectId: row.promotedProjectId,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt)
  }
}

export async function getIdeas(): Promise<IdeaIPC[]> {
  const db = getDb()
  const rows = db.select().from(ideas).orderBy(desc(ideas.createdAt)).all()
  return rows.map(toIPC)
}

export async function createIdea(data: {
  title: string
  body?: string | null
  tags?: string[]
  status?: IdeaStatus
}): Promise<IdeaIPC> {
  const db = getDb()
  const newIdea = {
    id: uuidv4(),
    title: data.title,
    body: data.body || null,
    tags: JSON.stringify(data.tags || []),
    status: data.status || 'spark',
    promotedProjectId: null,
    createdAt: new Date()
  }
  db.insert(ideas)
    .values(newIdea as any)
    .run()
  return toIPC(newIdea)
}

export async function updateIdea(
  id: string,
  data: { title?: string; body?: string | null; tags?: string[]; status?: IdeaStatus }
): Promise<IdeaIPC> {
  const db = getDb()
  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.body !== undefined) updateData.body = data.body
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
  if (data.status !== undefined) updateData.status = data.status

  db.update(ideas).set(updateData).where(eq(ideas.id, id)).run()
  const updated = db.select().from(ideas).where(eq(ideas.id, id)).get()
  if (!updated) throw new Error(`Idea with id ${id} not found.`)
  return toIPC(updated)
}

export async function deleteIdea(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(ideas).where(eq(ideas.id, id)).run()
  if (result.changes === 0) throw new Error(`Idea with id ${id} not found.`)
}

/**
 * Promote an idea into a new project. Creates a minimal HOURLY project named
 * after the idea, links it back, and flips the idea's status to 'promoted'.
 * Returns the new project id.
 */
export async function promoteIdea(id: string): Promise<{ projectId: string }> {
  const db = getDb()
  const idea = db.select().from(ideas).where(eq(ideas.id, id)).get()
  if (!idea) throw new Error(`Idea with id ${id} not found.`)

  const projectId = uuidv4()
  db.insert(projects)
    .values({
      id: projectId,
      name: idea.title,
      type: 'HOURLY',
      currency: 'USD',
      hourlyRate: 0,
      archived: false,
      workflowStatus: 'active',
      notes: idea.body || null,
      createdAt: new Date()
    } as any)
    .run()

  db.update(ideas)
    .set({ status: 'promoted', promotedProjectId: projectId })
    .where(eq(ideas.id, id))
    .run()

  return { projectId }
}
