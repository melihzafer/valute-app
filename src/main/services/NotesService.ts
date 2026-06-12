// src/main/services/NotesService.ts
// M7 — Notion-style notes: a personal knowledge base spanning every life area.

import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/index'
import { notes } from '../db/schema'
import type { NoteIPC, LifeArea } from '../../shared/types'

type NoteRow = typeof notes.$inferSelect

function toIPC(row: NoteRow): NoteIPC {
  let tags: string[] = []
  if (row.tags) {
    try {
      const parsed = JSON.parse(row.tags)
      if (Array.isArray(parsed)) tags = parsed
    } catch {
      tags = []
    }
  }
  const iso = (d: Date | null) => (d instanceof Date ? d.toISOString() : String(d))
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    area: (row.area as LifeArea) || 'general',
    tags,
    pinned: !!row.pinned,
    projectId: row.projectId,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  }
}

export async function getNotes(): Promise<NoteIPC[]> {
  const db = getDb()
  const rows = db.select().from(notes).orderBy(desc(notes.pinned), desc(notes.updatedAt)).all()
  return rows.map(toIPC)
}

export async function createNote(data: {
  title: string
  content?: string | null
  area?: LifeArea
  tags?: string[]
  projectId?: string | null
}): Promise<NoteIPC> {
  const db = getDb()
  const now = new Date()
  const row = {
    id: uuidv4(),
    title: data.title || 'Untitled',
    content: data.content ?? null,
    area: data.area || 'general',
    tags: JSON.stringify(data.tags || []),
    pinned: false,
    projectId: data.projectId ?? null,
    createdAt: now,
    updatedAt: now
  }
  db.insert(notes)
    .values(row as any)
    .run()
  return toIPC(row as any)
}

export async function updateNote(
  id: string,
  data: {
    title?: string
    content?: string | null
    area?: LifeArea
    tags?: string[]
    pinned?: boolean
    projectId?: string | null
  }
): Promise<NoteIPC> {
  const db = getDb()
  const updateData: any = { updatedAt: new Date() }
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.area !== undefined) updateData.area = data.area
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
  if (data.pinned !== undefined) updateData.pinned = data.pinned
  if (data.projectId !== undefined) updateData.projectId = data.projectId

  db.update(notes).set(updateData).where(eq(notes.id, id)).run()
  const updated = db.select().from(notes).where(eq(notes.id, id)).get()
  if (!updated) throw new Error(`Note with id ${id} not found.`)
  return toIPC(updated)
}

export async function deleteNote(id: string): Promise<void> {
  const db = getDb()
  const result = db.delete(notes).where(eq(notes.id, id)).run()
  if (result.changes === 0) throw new Error(`Note with id ${id} not found.`)
}
