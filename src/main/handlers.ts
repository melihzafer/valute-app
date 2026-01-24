// src/main/handlers.ts

import { ipcMain, dialog, shell } from 'electron'
import * as fs from 'fs'
import { ProjectSchemaBase, LogSchema } from '../shared/schemas'
import type {
  ProjectIPC,
  LogIPC,
  InvoiceIPC,
  ExpenseIPC,
  IPCResponse,
  TimerState
} from '../shared/types'
import { broadcastTimerStateToFloating } from './index'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getLogsByProject,
  saveLog,
  deleteLog,
  getLogsByDateRange,
  getExpensesByProject,
  createExpense,
  deleteExpense,
  updateProjectNotes,
  getProjectById
} from './services/ProjectService'
import {
  createInvoice,
  getAllInvoices,
  getInvoicesByProject,
  updateInvoiceStatus,
  deleteInvoice,
  getUnbilledLogs,
  getUnbilledExpenses
} from './services/InvoiceService'
import { createAsset, getAssetsByProject, deleteAsset, openAsset } from './services/AssetService'
import * as DashboardService from './services/DashboardService'
import type { AssetIPC } from '../shared/types'

// Timer state stored in memory (could be persisted if needed)
let timerState: TimerState = {
  isRunning: false,
  elapsedSeconds: 0,
  accumulatedTime: 0,
  startTime: null,
  projectId: null,
  description: null,
  currentProjectName: null
}

export function setupIpcHandlers() {
  // --- Project Handlers ---

  ipcMain.handle('get-projects', async (): Promise<IPCResponse<ProjectIPC[]>> => {
    try {
      const projects = await getProjects()
      const processedProjects: ProjectIPC[] = projects.map((p) => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt)
      }))
      return { success: true, data: processedProjects }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects'
      console.error('Error in get-projects IPC handler:', error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle(
    'create-project',
    async (
      _,
      projectData: Omit<ProjectIPC, 'id' | 'createdAt'>
    ): Promise<IPCResponse<ProjectIPC>> => {
      try {
        const validatedData = ProjectSchemaBase.omit({ id: true, createdAt: true }).parse(
          projectData
        )
        const newProject = await createProject(validatedData)
        const result: ProjectIPC = {
          ...newProject,
          createdAt:
            newProject.createdAt instanceof Date
              ? newProject.createdAt.toISOString()
              : String(newProject.createdAt)
        }
        return { success: true, data: result }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create project'
        console.error('Error in create-project IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'update-project',
    async (
      _,
      id: string,
      projectData: Partial<Omit<ProjectIPC, 'createdAt'>>
    ): Promise<IPCResponse<ProjectIPC>> => {
      try {
        // Skip validation - just pass data directly to service layer
        // The service handles field mapping and SQL updates
        const updatedProject = await updateProject(id, projectData as any)
        const result: ProjectIPC = {
          ...updatedProject,
          createdAt:
            updatedProject.createdAt instanceof Date
              ? updatedProject.createdAt.toISOString()
              : String(updatedProject.createdAt)
        }
        return { success: true, data: result }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update project'
        console.error('Error in update-project IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('delete-project', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteProject(id)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete project'
      console.error('Error in delete-project IPC handler:', error)
      return { success: false, error: message }
    }
  })

  // --- Log Handlers ---

  ipcMain.handle(
    'get-logs-by-project',
    async (_, projectId: string): Promise<IPCResponse<LogIPC[]>> => {
      try {
        const logs = await getLogsByProject(projectId)
        const processedLogs: LogIPC[] = logs.map((log) => ({
          ...log,
          startTime:
            log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
          endTime: log.endTime
            ? log.endTime instanceof Date
              ? log.endTime.toISOString()
              : String(log.endTime)
            : null
        }))
        return { success: true, data: processedLogs }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch logs for project'
        console.error('Error in get-logs-by-project IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'save-log',
    async (_, logData: Omit<LogIPC, 'id'>): Promise<IPCResponse<LogIPC>> => {
      try {
        const parsedData = {
          ...logData,
          startTime: new Date(logData.startTime),
          endTime: logData.endTime ? new Date(logData.endTime) : null
        }
        const validatedData = LogSchema.omit({ id: true }).parse(parsedData)
        const savedLog = await saveLog(validatedData)
        const result: LogIPC = {
          ...savedLog,
          startTime:
            savedLog.startTime instanceof Date
              ? savedLog.startTime.toISOString()
              : String(savedLog.startTime),
          endTime: savedLog.endTime
            ? savedLog.endTime instanceof Date
              ? savedLog.endTime.toISOString()
              : String(savedLog.endTime)
            : null
        }
        return { success: true, data: result }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to save log'
        console.error('Error in save-log IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('delete-log', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteLog(id)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete log'
      console.error('Error in delete-log IPC handler:', error)
      return { success: false, error: message }
    }
  })

  // --- Invoice Handlers ---

  ipcMain.handle(
    'get-logs-for-invoice',
    async (
      _,
      startDate: string,
      endDate: string,
      projectId?: string
    ): Promise<IPCResponse<LogIPC[]>> => {
      try {
        const start = new Date(startDate)
        // Set end date to end of day (23:59:59.999) to include all logs from that day
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        console.log('[get-logs-for-invoice] Query params:', {
          startDate,
          endDate,
          projectId,
          start,
          end
        })
        const logs = await getLogsByDateRange(start, end, projectId)
        console.log('[get-logs-for-invoice] Found logs:', logs.length)
        const processedLogs: LogIPC[] = logs.map((log) => ({
          ...log,
          startTime:
            log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
          endTime: log.endTime
            ? log.endTime instanceof Date
              ? log.endTime.toISOString()
              : String(log.endTime)
            : null
        }))
        return { success: true, data: processedLogs }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch logs for invoice'
        console.error('Error in get-logs-for-invoice IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'get-unbilled-logs',
    async (_, projectId: string): Promise<IPCResponse<LogIPC[]>> => {
      try {
        const logs = await getUnbilledLogs(projectId)
        const processedLogs: LogIPC[] = logs.map((log) => ({
          ...log,
          startTime:
            log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
          endTime: log.endTime
            ? log.endTime instanceof Date
              ? log.endTime.toISOString()
              : String(log.endTime)
            : null
        }))
        return { success: true, data: processedLogs }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch unbilled logs'
        console.error('Error in get-unbilled-logs IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'get-unbilled-expenses',
    async (_, projectId: string): Promise<IPCResponse<ExpenseIPC[]>> => {
      try {
        const expenses = await getUnbilledExpenses(projectId)
        const processedExpenses: ExpenseIPC[] = expenses.map((exp) => ({
          ...exp,
          date: exp.date instanceof Date ? exp.date.toISOString() : String(exp.date)
        }))
        return { success: true, data: processedExpenses }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch unbilled expenses'
        console.error('Error in get-unbilled-expenses IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'create-invoice',
    async (
      _,
      invoiceData: Omit<InvoiceIPC, 'id'>,
      pdfBuffer?: ArrayBuffer
    ): Promise<IPCResponse<InvoiceIPC>> => {
      try {
        const parsedInvoiceData = {
          ...invoiceData,
          issueDate: new Date(invoiceData.issueDate),
          dueDate: new Date(invoiceData.dueDate)
        }
        const savedInvoice = await createInvoice(parsedInvoiceData)

        // Optionally save PDF if provided
        if (pdfBuffer) {
          const result = await dialog.showSaveDialog({
            title: 'Save Invoice',
            defaultPath: `invoice-${savedInvoice.invoiceNumber}-${new Date().toISOString().split('T')[0]}.pdf`,
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
          })

          if (!result.canceled && result.filePath) {
            fs.writeFileSync(result.filePath, Buffer.from(pdfBuffer))
            console.log(`Invoice PDF successfully saved to: ${result.filePath}`)
          }
        }

        const responseData: InvoiceIPC = {
          ...savedInvoice,
          issueDate:
            savedInvoice.issueDate instanceof Date
              ? savedInvoice.issueDate.toISOString()
              : String(savedInvoice.issueDate),
          dueDate:
            savedInvoice.dueDate instanceof Date
              ? savedInvoice.dueDate.toISOString()
              : String(savedInvoice.dueDate)
        }
        return { success: true, data: responseData }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create invoice'
        console.error('Error in create-invoice IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('get-all-invoices', async (): Promise<IPCResponse<InvoiceIPC[]>> => {
    try {
      const invoices = await getAllInvoices()
      const processedInvoices: InvoiceIPC[] = invoices.map((inv) => ({
        ...inv,
        issueDate:
          inv.issueDate instanceof Date ? inv.issueDate.toISOString() : String(inv.issueDate),
        dueDate: inv.dueDate instanceof Date ? inv.dueDate.toISOString() : String(inv.dueDate)
      }))
      return { success: true, data: processedInvoices }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invoices'
      console.error('Error in get-all-invoices IPC handler:', error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle(
    'get-invoices-by-project',
    async (_, projectId: string): Promise<IPCResponse<InvoiceIPC[]>> => {
      try {
        const invoices = await getInvoicesByProject(projectId)
        const processedInvoices: InvoiceIPC[] = invoices.map((inv) => ({
          ...inv,
          issueDate:
            inv.issueDate instanceof Date ? inv.issueDate.toISOString() : String(inv.issueDate),
          dueDate: inv.dueDate instanceof Date ? inv.dueDate.toISOString() : String(inv.dueDate)
        }))
        return { success: true, data: processedInvoices }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch project invoices'
        console.error('Error in get-invoices-by-project IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'update-invoice-status',
    async (
      _,
      id: string,
      status: 'draft' | 'sent' | 'paid' | 'overdue'
    ): Promise<IPCResponse<InvoiceIPC>> => {
      try {
        const invoice = await updateInvoiceStatus(id, status)
        const responseData: InvoiceIPC = {
          ...invoice,
          issueDate:
            invoice.issueDate instanceof Date
              ? invoice.issueDate.toISOString()
              : String(invoice.issueDate),
          dueDate:
            invoice.dueDate instanceof Date
              ? invoice.dueDate.toISOString()
              : String(invoice.dueDate)
        }
        return { success: true, data: responseData }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update invoice status'
        console.error('Error in update-invoice-status IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('delete-invoice', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteInvoice(id)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete invoice'
      console.error('Error in delete-invoice IPC handler:', error)
      return { success: false, error: message }
    }
  })

  // --- Timer Handlers ---

  ipcMain.handle('get-timer-state', async (): Promise<IPCResponse<TimerState>> => {
    return { success: true, data: timerState }
  })

  ipcMain.handle('set-timer-state', async (_, state: TimerState): Promise<IPCResponse<void>> => {
    timerState = state
    return { success: true }
  })

  ipcMain.handle(
    'start-timer',
    async (_, projectId: string, description?: string): Promise<IPCResponse<TimerState>> => {
      const projects = await getProjects()
      const project = projects.find((p) => p.id === projectId)
      timerState = {
        isRunning: true,
        elapsedSeconds: 0,
        accumulatedTime: 0,
        startTime: Date.now(),
        projectId,
        description: description || null,
        currentProjectName: project?.name || null
      }
      return { success: true, data: timerState }
    }
  )

  ipcMain.handle('pause-timer', async (): Promise<IPCResponse<TimerState>> => {
    if (timerState.isRunning && timerState.startTime) {
      const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000)
      timerState = {
        ...timerState,
        isRunning: false,
        accumulatedTime: timerState.accumulatedTime + elapsed,
        startTime: null
      }
    }
    return { success: true, data: timerState }
  })

  ipcMain.handle('resume-timer', async (): Promise<IPCResponse<TimerState>> => {
    if (!timerState.isRunning) {
      timerState = {
        ...timerState,
        isRunning: true,
        startTime: Date.now()
      }
    }
    return { success: true, data: timerState }
  })

  ipcMain.handle('stop-timer', async (): Promise<IPCResponse<TimerState>> => {
    const finalState = { ...timerState }

    // Calculate total duration
    let totalDuration = timerState.accumulatedTime
    if (timerState.isRunning && timerState.startTime) {
      totalDuration += Math.floor((Date.now() - timerState.startTime) / 1000)
    }

    // Auto-save log entry if there's a valid project and duration
    if (finalState.projectId && totalDuration > 0) {
      try {
        const now = new Date()
        const startTime = new Date(now.getTime() - totalDuration * 1000)

        await saveLog({
          projectId: finalState.projectId,
          startTime: startTime, // Pass Date object, not string
          endTime: now, // Pass Date object, not string
          accumulatedTime: totalDuration,
          description: finalState.description || 'Timer session'
        } as any)
        console.log(`[Timer] Auto-saved log: ${totalDuration}s for project ${finalState.projectId}`)
      } catch (error) {
        console.error('[Timer] Failed to auto-save log:', error)
      }
    }

    // Reset timer state
    timerState = {
      isRunning: false,
      elapsedSeconds: 0,
      accumulatedTime: 0,
      startTime: null,
      projectId: null,
      description: null,
      currentProjectName: null
    }

    // Broadcast the reset state to floating window
    broadcastTimerStateToFloating(timerState)

    // Return the final state with the total duration for UI feedback
    return {
      success: true,
      data: { ...finalState, elapsedSeconds: totalDuration, accumulatedTime: totalDuration }
    }
  })

  // --- Dialog Handlers ---

  ipcMain.handle(
    'show-save-dialog',
    async (
      _,
      options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }
    ): Promise<string | null> => {
      const result = await dialog.showSaveDialog({
        title: 'Save File',
        defaultPath: options.defaultPath,
        filters: options.filters
      })
      return result.canceled ? null : result.filePath || null
    }
  )

  // --- Expense Handlers ---

  ipcMain.handle(
    'get-expenses-by-project',
    async (_, projectId: string): Promise<IPCResponse<ExpenseIPC[]>> => {
      try {
        const expenses = await getExpensesByProject(projectId)
        const processedExpenses: ExpenseIPC[] = expenses.map((exp) => ({
          ...exp,
          date: exp.date instanceof Date ? exp.date.toISOString() : String(exp.date)
        }))
        return { success: true, data: processedExpenses }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch expenses'
        console.error('Error in get-expenses-by-project IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'create-expense',
    async (_, expenseData: Omit<ExpenseIPC, 'id'>): Promise<IPCResponse<ExpenseIPC>> => {
      try {
        const parsedData = {
          ...expenseData,
          date: new Date(expenseData.date)
        }
        const newExpense = await createExpense(parsedData)
        const result: ExpenseIPC = {
          ...newExpense,
          date:
            newExpense.date instanceof Date
              ? newExpense.date.toISOString()
              : String(newExpense.date)
        }
        return { success: true, data: result }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create expense'
        console.error('Error in create-expense IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('delete-expense', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteExpense(id)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete expense'
      console.error('Error in delete-expense IPC handler:', error)
      return { success: false, error: message }
    }
  })

  // --- Other Handlers ---

  ipcMain.handle('open-external', async (_, url: string): Promise<IPCResponse<void>> => {
    try {
      await shell.openExternal(url)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to open external link'
      console.error('Error in open-external IPC handler:', error)
      return { success: false, error: message }
    }
  })

  // --- Asset Vault Handlers ---

  ipcMain.handle(
    'create-asset',
    async (
      _,
      assetData: { projectId: string; name: string; path: string; type: 'folder' | 'file' | 'link' }
    ): Promise<IPCResponse<AssetIPC>> => {
      try {
        const newAsset = await createAsset(assetData)
        const result: AssetIPC = {
          ...newAsset,
          createdAt:
            newAsset.createdAt instanceof Date
              ? newAsset.createdAt.toISOString()
              : String(newAsset.createdAt)
        }
        return { success: true, data: result }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to create asset'
        console.error('Error in create-asset IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'get-assets-by-project',
    async (_, projectId: string): Promise<IPCResponse<AssetIPC[]>> => {
      try {
        const assets = await getAssetsByProject(projectId)
        const processedAssets: AssetIPC[] = assets.map((asset) => ({
          ...asset,
          createdAt:
            asset.createdAt instanceof Date
              ? asset.createdAt.toISOString()
              : String(asset.createdAt)
        }))
        return { success: true, data: processedAssets }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch assets'
        console.error('Error in get-assets-by-project IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('delete-asset', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteAsset(id)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete asset'
      console.error('Error in delete-asset IPC handler:', error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('open-asset', async (_, path: string): Promise<IPCResponse<string>> => {
    try {
      const result = await openAsset(path)
      if (result === '') {
        return { success: true, data: '' }
      } else {
        return { success: false, error: result }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to open asset'
      console.error('Error in open-asset IPC handler:', error)
      return { success: false, error: message }
    }
  })

  // --- Project Notes Handlers ---

  ipcMain.handle(
    'update-project-notes',
    async (_, id: string, notes: string): Promise<IPCResponse<void>> => {
      try {
        await updateProjectNotes(id, notes)
        return { success: true }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update project notes'
        console.error('Error in update-project-notes IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'get-project-by-id',
    async (_, id: string): Promise<IPCResponse<ProjectIPC | null>> => {
      try {
        const project = await getProjectById(id)
        if (!project) {
          return { success: true, data: null }
        }
        const result: ProjectIPC = {
          ...project,
          createdAt:
            project.createdAt instanceof Date
              ? project.createdAt.toISOString()
              : String(project.createdAt)
        }
        return { success: true, data: result }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch project'
        console.error('Error in get-project-by-id IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  // --- File/Folder Dialog Handler ---

  ipcMain.handle(
    'show-open-dialog',
    async (
      _,
      options: {
        properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
        filters?: Array<{ name: string; extensions: string[] }>
      }
    ): Promise<{ canceled: boolean; filePaths: string[] }> => {
      const result = await dialog.showOpenDialog({
        properties: options.properties || ['openFile', 'openDirectory'],
        filters: options.filters
      })
      return { canceled: result.canceled, filePaths: result.filePaths }
    }
  )

  // --- Dashboard Handlers ---

  ipcMain.handle(
    'get-dashboard-stats',
    async (): Promise<IPCResponse<DashboardService.DashboardStats>> => {
      try {
        const stats = DashboardService.getStats()
        return { success: true, data: stats }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to get dashboard stats'
        console.error('Error in get-dashboard-stats IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'get-revenue-chart',
    async (_, days: number): Promise<IPCResponse<DashboardService.ChartDataPoint[]>> => {
      try {
        const data = DashboardService.getRevenueChartData(days)
        return { success: true, data }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to get revenue chart data'
        console.error('Error in get-revenue-chart IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'get-recent-activity',
    async (_, limit: number): Promise<IPCResponse<DashboardService.RecentActivityItem[]>> => {
      try {
        const data = DashboardService.getRecentActivity(limit)
        return { success: true, data }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to get recent activity'
        console.error('Error in get-recent-activity IPC handler:', error)
        return { success: false, error: message }
      }
    }
  )

  ipcMain.handle('get-monthly-goal', async (): Promise<IPCResponse<number>> => {
    try {
      const goal = DashboardService.getMonthlyGoal()
      return { success: true, data: goal }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to get monthly goal'
      console.error('Error in get-monthly-goal IPC handler:', error)
      return { success: false, error: message }
    }
  })

  ipcMain.handle('set-monthly-goal', async (_, amountCents: number): Promise<IPCResponse<void>> => {
    try {
      DashboardService.setMonthlyGoal(amountCents)
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to set monthly goal'
      console.error('Error in set-monthly-goal IPC handler:', error)
      return { success: false, error: message }
    }
  })
}
