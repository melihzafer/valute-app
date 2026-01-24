// src/main/services/DashboardService.ts
// Dashboard aggregation service - performs heavy calculations in main process

import { getDb } from '../db/index'
import { projects, logs, expenses, settings } from '../db/schema'
import { eq, gte, isNull, desc } from 'drizzle-orm'

export interface DashboardStats {
  currentMonthEarnings: number // cents
  unbilledAmount: number // cents
  activeProjectCount: number
  totalExpensesThisMonth: number // cents
  monthlyGoal: number // cents
  goalProgress: number // percentage 0-100
}

export interface ChartDataPoint {
  date: string // 'YYYY-MM-DD'
  amount: number // cents
}

export interface RecentActivityItem {
  id: string
  projectId: string
  projectName: string
  duration: number // seconds
  earnings: number // cents
  date: string // ISO string
  notes: string | null
}

/**
 * Calculate earnings for a log entry based on project type
 */
function calculateLogEarnings(
  duration: number | null,
  quantity: number | null,
  hourlyRate: number | null,
  projectType: string
): number {
  if (!hourlyRate) return 0

  if (projectType === 'UNIT_BASED' && quantity) {
    // For unit-based: quantity * price per unit
    return Math.round(quantity * hourlyRate)
  } else if (duration) {
    // For hourly: (duration in seconds / 3600) * hourly rate
    return Math.round((duration / 3600) * hourlyRate)
  }

  return 0
}

/**
 * Get dashboard KPI stats
 */
export function getStats(): DashboardStats {
  const db = getDb()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get all logs this month with project info
  const logsThisMonth = db
    .select({
      duration: logs.duration,
      quantity: logs.quantity,
      hourlyRate: projects.hourlyRate,
      projectType: projects.type,
      invoiceId: logs.invoiceId
    })
    .from(logs)
    .innerJoin(projects, eq(logs.projectId, projects.id))
    .where(gte(logs.startTime, startOfMonth))
    .all()

  // Calculate current month earnings
  let currentMonthEarnings = 0
  let unbilledAmount = 0

  for (const log of logsThisMonth) {
    const earnings = calculateLogEarnings(
      log.duration,
      log.quantity,
      log.hourlyRate,
      log.projectType
    )
    currentMonthEarnings += earnings

    // If not invoiced, add to unbilled
    if (!log.invoiceId) {
      unbilledAmount += earnings
    }
  }

  // Also get unbilled logs from previous months
  const allUnbilledLogs = db
    .select({
      duration: logs.duration,
      quantity: logs.quantity,
      hourlyRate: projects.hourlyRate,
      projectType: projects.type
    })
    .from(logs)
    .innerJoin(projects, eq(logs.projectId, projects.id))
    .where(isNull(logs.invoiceId))
    .all()

  // Recalculate total unbilled from all time
  unbilledAmount = 0
  for (const log of allUnbilledLogs) {
    unbilledAmount += calculateLogEarnings(
      log.duration,
      log.quantity,
      log.hourlyRate,
      log.projectType
    )
  }

  // Count active (non-archived) projects
  const activeProjects = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.archived, false))
    .all()
  const activeProjectCount = activeProjects.length

  // Get total expenses this month
  const expensesThisMonth = db
    .select({ amount: expenses.amount })
    .from(expenses)
    .where(gte(expenses.date, startOfMonth))
    .all()

  const totalExpensesThisMonth = expensesThisMonth.reduce((sum, e) => sum + (e.amount || 0), 0)

  // Get monthly goal from settings
  const monthlyGoal = getMonthlyGoal()

  // Calculate goal progress
  const goalProgress = monthlyGoal > 0 ? Math.min(100, Math.round((currentMonthEarnings / monthlyGoal) * 100)) : 0

  return {
    currentMonthEarnings,
    unbilledAmount,
    activeProjectCount,
    totalExpensesThisMonth,
    monthlyGoal,
    goalProgress
  }
}

/**
 * Get revenue chart data for last N days
 */
export function getRevenueChartData(days: number): ChartDataPoint[] {
  const db = getDb()
  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Get all logs in the date range with project info
  const logsInRange = db
    .select({
      startTime: logs.startTime,
      duration: logs.duration,
      quantity: logs.quantity,
      hourlyRate: projects.hourlyRate,
      projectType: projects.type
    })
    .from(logs)
    .innerJoin(projects, eq(logs.projectId, projects.id))
    .where(gte(logs.startTime, startDate))
    .all()

  // Group by date and sum earnings
  const dailyEarnings: Record<string, number> = {}

  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    dailyEarnings[dateStr] = 0
  }

  // Add earnings for each log
  for (const log of logsInRange) {
    if (!log.startTime) continue

    const logDate = new Date(log.startTime)
    const dateStr = logDate.toISOString().split('T')[0]

    const earnings = calculateLogEarnings(
      log.duration,
      log.quantity,
      log.hourlyRate,
      log.projectType
    )

    if (dailyEarnings[dateStr] !== undefined) {
      dailyEarnings[dateStr] += earnings
    }
  }

  // Convert to array and sort by date
  return Object.entries(dailyEarnings)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Get recent activity (last N logs with project info)
 */
export function getRecentActivity(limit: number): RecentActivityItem[] {
  const db = getDb()

  const recentLogs = db
    .select({
      id: logs.id,
      projectId: logs.projectId,
      projectName: projects.name,
      duration: logs.duration,
      quantity: logs.quantity,
      hourlyRate: projects.hourlyRate,
      projectType: projects.type,
      startTime: logs.startTime,
      notes: logs.notes
    })
    .from(logs)
    .innerJoin(projects, eq(logs.projectId, projects.id))
    .orderBy(desc(logs.startTime))
    .limit(limit)
    .all()

  return recentLogs.map((log) => ({
    id: log.id,
    projectId: log.projectId,
    projectName: log.projectName,
    duration: log.duration || 0,
    earnings: calculateLogEarnings(log.duration, log.quantity, log.hourlyRate, log.projectType),
    date: log.startTime ? new Date(log.startTime).toISOString() : new Date().toISOString(),
    notes: log.notes
  }))
}

/**
 * Get monthly goal from settings
 */
export function getMonthlyGoal(): number {
  const db = getDb()

  const result = db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'financial.monthlyGoal'))
    .get()

  return result?.value ? parseInt(result.value, 10) : 0
}

/**
 * Set monthly goal in settings
 */
export function setMonthlyGoal(amountCents: number): void {
  const db = getDb()

  // Use raw SQL for upsert since Drizzle's onConflictDoUpdate can be tricky
  const existing = db
    .select({ key: settings.key })
    .from(settings)
    .where(eq(settings.key, 'financial.monthlyGoal'))
    .get()

  if (existing) {
    db.update(settings)
      .set({
        value: String(amountCents),
        updatedAt: new Date()
      })
      .where(eq(settings.key, 'financial.monthlyGoal'))
      .run()
  } else {
    db.insert(settings)
      .values({
        key: 'financial.monthlyGoal',
        value: String(amountCents),
        updatedAt: new Date()
      })
      .run()
  }
}
