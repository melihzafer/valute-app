// src/main/services/DailyReportService.ts
// Daily Report capture: persists a pasted end-of-day report both to the DB
// and as a dated markdown file on disk so it survives outside the app.

import { v4 as uuidv4 } from 'uuid'
import { eq, and, desc } from 'drizzle-orm'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { getDb } from '../db/index'
import { dailyReports, projects } from '../db/schema'
import type { DailyReport } from '../db/schema'

// Format a date as YYYY-MM-DD (local time) for filenames and day-bucketing.
function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Resolve the folder where a project's report files live.
// Prefer the project's own assets folder; fall back to app userData.
function resolveReportsDir(projectId: string, assetsPath: string | null): string {
  const base =
    assetsPath && assetsPath.trim().length > 0
      ? path.join(assetsPath, 'reports')
      : path.join(app.getPath('userData'), 'daily-reports', projectId)
  fs.mkdirSync(base, { recursive: true })
  return base
}

/**
 * Save (or overwrite) the daily report for a project on a given day.
 * Writes a `<YYYY-MM-DD>.md` file to disk and upserts the DB row for that day.
 */
export async function saveReport(
  projectId: string,
  content: string,
  reportDate?: Date
): Promise<DailyReport> {
  const db = getDb()
  const day = reportDate ? new Date(reportDate) : new Date()
  day.setHours(0, 0, 0, 0)

  // Look up the project to find its assets folder (and to validate it exists).
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get()
  if (!project) {
    throw new Error(`Project with id ${projectId} not found.`)
  }

  // Write the markdown file (best-effort: DB row is still saved if this fails).
  let filePath: string | null = null
  try {
    const dir = resolveReportsDir(projectId, project.assetsPath)
    const fileName = `${toDateKey(day)}.md`
    const fullPath = path.join(dir, fileName)
    const header = `# Daily Report — ${toDateKey(day)}\n\n_Project: ${project.name}_\n\n`
    fs.writeFileSync(fullPath, header + content, 'utf-8')
    filePath = fullPath
  } catch (err) {
    console.error('[DailyReportService] Failed to write report file:', err)
  }

  // Upsert: one report per project per day.
  const existing = db
    .select()
    .from(dailyReports)
    .where(and(eq(dailyReports.projectId, projectId), eq(dailyReports.reportDate, day as any)))
    .get()

  if (existing) {
    db.update(dailyReports).set({ content, filePath }).where(eq(dailyReports.id, existing.id)).run()
    return { ...existing, content, filePath } as DailyReport
  }

  const newReport = {
    id: uuidv4(),
    projectId,
    reportDate: day,
    content,
    filePath,
    createdAt: new Date()
  }
  db.insert(dailyReports)
    .values(newReport as any)
    .run()
  return newReport as DailyReport
}

/** List a project's daily reports, newest first. */
export async function listReports(projectId: string): Promise<DailyReport[]> {
  const db = getDb()
  return db
    .select()
    .from(dailyReports)
    .where(eq(dailyReports.projectId, projectId))
    .orderBy(desc(dailyReports.reportDate))
    .all()
}

/** Delete a daily report. Also removes the backing file if present. */
export async function deleteReport(id: string): Promise<void> {
  const db = getDb()
  const existing = db.select().from(dailyReports).where(eq(dailyReports.id, id)).get()
  if (!existing) {
    throw new Error(`Daily report with id ${id} not found.`)
  }

  if (existing.filePath) {
    try {
      if (fs.existsSync(existing.filePath)) {
        fs.unlinkSync(existing.filePath)
      }
    } catch (err) {
      console.error('[DailyReportService] Failed to delete report file:', err)
    }
  }

  db.delete(dailyReports).where(eq(dailyReports.id, id)).run()
}
