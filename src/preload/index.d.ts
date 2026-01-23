import { ElectronAPI } from '@electron-toolkit/preload'
import type { ProjectIPC, LogIPC, InvoiceIPC, TimerState, IPCResponse } from '../shared/types'

interface API {
  // Projects
  getProjects: () => Promise<IPCResponse<ProjectIPC[]>>
  createProject: (data: Omit<ProjectIPC, 'id' | 'createdAt'>) => Promise<IPCResponse<ProjectIPC>>
  updateProject: (id: string, data: Partial<Omit<ProjectIPC, 'createdAt'>>) => Promise<IPCResponse<ProjectIPC>>
  deleteProject: (id: string) => Promise<IPCResponse<void>>

  // Logs
  getLogsByProject: (projectId: string) => Promise<IPCResponse<LogIPC[]>>
  saveLog: (data: Omit<LogIPC, 'id'>) => Promise<IPCResponse<LogIPC>>
  deleteLog: (id: string) => Promise<IPCResponse<void>>

  // Invoices
  getLogsForInvoice: (startDate: string, endDate: string) => Promise<IPCResponse<LogIPC[]>>
  saveInvoice: (data: Omit<InvoiceIPC, 'id'>, pdfBuffer: ArrayBuffer) => Promise<IPCResponse<InvoiceIPC>>

  // Timer
  getTimerState: () => Promise<IPCResponse<TimerState>>
  setTimerState: (state: TimerState) => Promise<IPCResponse<void>>
  startTimer: (projectId: string, description?: string) => Promise<IPCResponse<TimerState>>
  pauseTimer: () => Promise<IPCResponse<TimerState>>
  resumeTimer: () => Promise<IPCResponse<TimerState>>
  stopTimer: () => Promise<IPCResponse<TimerState>>

  // Dialogs
  showSaveDialog: (options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>
  openExternal: (url: string) => Promise<IPCResponse<void>>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
