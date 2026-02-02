import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (data: unknown) => ipcRenderer.invoke('create-project', data),
  updateProject: (id: string, data: unknown) => ipcRenderer.invoke('update-project', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('delete-project', id),

  // Logs
  getLogsByProject: (projectId: string) => ipcRenderer.invoke('get-logs-by-project', projectId),
  saveLog: (data: unknown) => ipcRenderer.invoke('save-log', data),
  deleteLog: (id: string) => ipcRenderer.invoke('delete-log', id),

  // Invoices
  getLogsForInvoice: (startDate: string, endDate: string, projectId?: string) =>
    ipcRenderer.invoke('get-logs-for-invoice', startDate, endDate, projectId),
  getUnbilledLogs: (projectId: string) => ipcRenderer.invoke('get-unbilled-logs', projectId),
  getUnbilledExpenses: (projectId: string) =>
    ipcRenderer.invoke('get-unbilled-expenses', projectId),
  createInvoice: (data: unknown, pdfBuffer?: ArrayBuffer) =>
    ipcRenderer.invoke('create-invoice', data, pdfBuffer),
  getAllInvoices: () => ipcRenderer.invoke('get-all-invoices'),
  getInvoicesByProject: (projectId: string) =>
    ipcRenderer.invoke('get-invoices-by-project', projectId),
  updateInvoiceStatus: (id: string, status: 'draft' | 'sent' | 'paid' | 'overdue') =>
    ipcRenderer.invoke('update-invoice-status', id, status),
  deleteInvoice: (id: string) => ipcRenderer.invoke('delete-invoice', id),

  // Expenses
  getExpensesByProject: (projectId: string) =>
    ipcRenderer.invoke('get-expenses-by-project', projectId),
  createExpense: (data: unknown) => ipcRenderer.invoke('create-expense', data),
  deleteExpense: (id: string) => ipcRenderer.invoke('delete-expense', id),

  // Timer
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  setTimerState: (state: unknown) => ipcRenderer.invoke('set-timer-state', state),
  startTimer: (projectId: string, description?: string) =>
    ipcRenderer.invoke('start-timer', projectId, description),
  pauseTimer: () => ipcRenderer.invoke('pause-timer'),
  resumeTimer: () => ipcRenderer.invoke('resume-timer'),
  stopTimer: () => ipcRenderer.invoke('stop-timer'),

  // Dialogs
  showSaveDialog: (options: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: {
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke('show-open-dialog', options),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Asset Vault
  createAsset: (data: {
    projectId: string
    name: string
    path: string
    type: 'folder' | 'file' | 'link'
  }) => ipcRenderer.invoke('create-asset', data),
  getAssetsByProject: (projectId: string) => ipcRenderer.invoke('get-assets-by-project', projectId),
  deleteAsset: (id: string) => ipcRenderer.invoke('delete-asset', id),
  openAsset: (path: string) => ipcRenderer.invoke('open-asset', path),

  // Project Notes
  updateProjectNotes: (id: string, notes: string) =>
    ipcRenderer.invoke('update-project-notes', id, notes),
  getProjectById: (id: string) => ipcRenderer.invoke('get-project-by-id', id),

  // Floating Timer
  openFloatingTimer: () => ipcRenderer.invoke('open-floating-timer'),
  closeFloatingTimer: () => ipcRenderer.invoke('close-floating-timer'),
  isFloatingTimerOpen: () => ipcRenderer.invoke('is-floating-timer-open'),
  syncTimerToFloating: (timerState: unknown) =>
    ipcRenderer.send('sync-timer-to-floating', timerState),
  sendFloatingTimerAction: (action: string) => ipcRenderer.send('floating-timer-action', action),
  onTimerStateUpdate: (callback: (timerState: unknown) => void) => {
    ipcRenderer.on('timer-state-update', (_, timerState) => callback(timerState))
    return () => ipcRenderer.removeAllListeners('timer-state-update')
  },
  onFloatingTimerAction: (callback: (action: string) => void) => {
    ipcRenderer.on('floating-timer-action', (_, action) => callback(action))
    return () => ipcRenderer.removeAllListeners('floating-timer-action')
  },
  onFloatingTimerClosed: (callback: () => void) => {
    ipcRenderer.on('floating-timer-closed', () => callback())
    return () => ipcRenderer.removeAllListeners('floating-timer-closed')
  },

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getRevenueChart: (days: number) => ipcRenderer.invoke('get-revenue-chart', days),
  getRecentActivity: (limit: number) => ipcRenderer.invoke('get-recent-activity', limit),
  getMonthlyGoal: () => ipcRenderer.invoke('get-monthly-goal'),
  setMonthlyGoal: (amountCents: number) => ipcRenderer.invoke('set-monthly-goal', amountCents),

  // Clients
  getClients: () => ipcRenderer.invoke('get-clients'),
  getClientsWithBalances: () => ipcRenderer.invoke('get-clients-with-balances'),
  getClientById: (id: string) => ipcRenderer.invoke('get-client-by-id', id),
  createClient: (data: unknown) => ipcRenderer.invoke('create-client', data),
  updateClient: (id: string, data: unknown) => ipcRenderer.invoke('update-client', id, data),
  deleteClient: (id: string) => ipcRenderer.invoke('delete-client', id),
  getClientBalance: (clientId: string) => ipcRenderer.invoke('get-client-balance', clientId),
  getClientLedger: (clientId: string) => ipcRenderer.invoke('get-client-ledger', clientId),
  getProjectsByClient: (clientId: string) => ipcRenderer.invoke('get-projects-by-client', clientId),
  migrateClientNames: () => ipcRenderer.invoke('migrate-client-names'),

  // Payments
  getPaymentsByClient: (clientId: string) => ipcRenderer.invoke('get-payments-by-client', clientId),
  createPayment: (data: unknown) => ipcRenderer.invoke('create-payment', data),
  updatePayment: (id: string, data: unknown) => ipcRenderer.invoke('update-payment', id, data),
  deletePayment: (id: string) => ipcRenderer.invoke('delete-payment', id)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
