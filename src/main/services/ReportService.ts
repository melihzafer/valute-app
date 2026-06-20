// src/main/services/ReportService.ts
// Aggregates tracked time + billable value over a date range, grouped by project.
// Backs the 1d / 1w / 1m reports on the Reports page.

import { eq, and, gte, lte } from 'drizzle-orm'
import { getDb } from '../db/index'
import { projects, logs } from '../db/schema'
import { calculateLogEarnings } from '../../shared/earnings'
import type { TimeReport, TimeReportRow } from '../../shared/types'

/**
 * Build a time report between two dates (inclusive), grouped by project.
 */
export async function getTimeReport(startDate: Date, endDate: Date): Promise<TimeReport> {
  const db = getDb()

  const rows = db
    .select({
      projectId: logs.projectId,
      projectName: projects.name,
      currency: projects.currency,
      duration: logs.duration,
      quantity: logs.quantity,
      hourlyRate: projects.hourlyRate,
      projectType: projects.type,
      invoiceId: logs.invoiceId
    })
    .from(logs)
    .innerJoin(projects, eq(logs.projectId, projects.id))
    .where(and(gte(logs.startTime, startDate as any), lte(logs.startTime, endDate as any)))
    .all()

  const byProject = new Map<string, TimeReportRow>()

  for (const log of rows) {
    let row = byProject.get(log.projectId)
    if (!row) {
      row = {
        projectId: log.projectId,
        projectName: log.projectName,
        currency: log.currency || 'USD',
        totalSeconds: 0,
        billableCents: 0,
        unbilledCents: 0,
        logCount: 0
      }
      byProject.set(log.projectId, row)
    }

    const earnings = calculateLogEarnings(
      log.duration,
      log.quantity,
      log.hourlyRate,
      log.projectType
    )
    row.totalSeconds += log.duration || 0
    row.billableCents += earnings
    if (!log.invoiceId) row.unbilledCents += earnings
    row.logCount += 1
  }

  const resultRows = Array.from(byProject.values()).sort((a, b) => b.totalSeconds - a.totalSeconds)

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalSeconds: resultRows.reduce((s, r) => s + r.totalSeconds, 0),
    totalBillableCents: resultRows.reduce((s, r) => s + r.billableCents, 0),
    activeProjectCount: resultRows.length,
    rows: resultRows
  }
}
