import { ElectronAPI } from '@electron-toolkit/preload'
import type {
  ProjectIPC,
  LogIPC,
  InvoiceIPC,
  ExpenseIPC,
  AssetIPC,
  TimerState,
  IPCResponse,
  DashboardStats,
  ChartDataPoint,
  RecentActivityItem,
  ClientIPC,
  PaymentIPC,
  ClientBalance,
  ClientWithBalance,
  LedgerEntry
} from '../shared/types'

interface API {
  // Projects
  getProjects: () => Promise<IPCResponse<ProjectIPC[]>>
  createProject: (data: Omit<ProjectIPC, 'id' | 'createdAt'>) => Promise<IPCResponse<ProjectIPC>>
  updateProject: (
    id: string,
    data: Partial<Omit<ProjectIPC, 'createdAt'>>
  ) => Promise<IPCResponse<ProjectIPC>>
  deleteProject: (id: string) => Promise<IPCResponse<void>>
  getProjectById: (id: string) => Promise<IPCResponse<ProjectIPC | null>>
  updateProjectNotes: (id: string, notes: string) => Promise<IPCResponse<void>>

  // Logs
  getLogsByProject: (projectId: string) => Promise<IPCResponse<LogIPC[]>>
  saveLog: (data: Omit<LogIPC, 'id'>) => Promise<IPCResponse<LogIPC>>
  deleteLog: (id: string) => Promise<IPCResponse<void>>

  // Invoices
  getLogsForInvoice: (
    startDate: string,
    endDate: string,
    projectId?: string
  ) => Promise<IPCResponse<LogIPC[]>>
  getUnbilledLogs: (projectId: string) => Promise<IPCResponse<LogIPC[]>>
  getUnbilledExpenses: (projectId: string) => Promise<IPCResponse<ExpenseIPC[]>>
  createInvoice: (
    data: Omit<InvoiceIPC, 'id'>,
    pdfBuffer?: ArrayBuffer
  ) => Promise<IPCResponse<InvoiceIPC>>
  getAllInvoices: () => Promise<IPCResponse<InvoiceIPC[]>>
  getInvoicesByProject: (projectId: string) => Promise<IPCResponse<InvoiceIPC[]>>
  updateInvoiceStatus: (
    id: string,
    status: 'draft' | 'sent' | 'paid' | 'overdue'
  ) => Promise<IPCResponse<InvoiceIPC>>
  deleteInvoice: (id: string) => Promise<IPCResponse<void>>

  // Expenses
  getExpensesByProject: (projectId: string) => Promise<IPCResponse<ExpenseIPC[]>>
  createExpense: (data: Omit<ExpenseIPC, 'id'>) => Promise<IPCResponse<ExpenseIPC>>
  deleteExpense: (id: string) => Promise<IPCResponse<void>>

  // Assets (Asset Vault)
  createAsset: (data: {
    projectId: string
    name: string
    path: string
    type: 'folder' | 'file' | 'link'
  }) => Promise<IPCResponse<AssetIPC>>
  getAssetsByProject: (projectId: string) => Promise<IPCResponse<AssetIPC[]>>
  deleteAsset: (id: string) => Promise<IPCResponse<void>>
  openAsset: (path: string) => Promise<IPCResponse<string>>

  // Timer
  getTimerState: () => Promise<IPCResponse<TimerState>>
  setTimerState: (state: TimerState) => Promise<IPCResponse<void>>
  startTimer: (projectId: string, description?: string) => Promise<IPCResponse<TimerState>>
  pauseTimer: () => Promise<IPCResponse<TimerState>>
  resumeTimer: () => Promise<IPCResponse<TimerState>>
  stopTimer: () => Promise<IPCResponse<TimerState>>

  // Dialogs
  showSaveDialog: (options: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<string | null>
  showOpenDialog: (options: {
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
    filters?: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ canceled: boolean; filePaths: string[] }>
  openExternal: (url: string) => Promise<IPCResponse<void>>

  // Floating Timer
  openFloatingTimer: () => Promise<IPCResponse<void>>
  closeFloatingTimer: () => Promise<IPCResponse<void>>
  isFloatingTimerOpen: () => Promise<IPCResponse<boolean>>
  syncTimerToFloating: (timerState: TimerState) => void
  sendFloatingTimerAction: (action: string) => void
  onTimerStateUpdate: (callback: (timerState: TimerState) => void) => () => void
  onFloatingTimerAction: (callback: (action: string) => void) => () => void
  onFloatingTimerClosed: (callback: () => void) => () => void

  // Dashboard
  getDashboardStats: () => Promise<IPCResponse<DashboardStats>>
  getRevenueChart: (days: number) => Promise<IPCResponse<ChartDataPoint[]>>
  getRecentActivity: (limit: number) => Promise<IPCResponse<RecentActivityItem[]>>
  getMonthlyGoal: () => Promise<IPCResponse<number>>
  setMonthlyGoal: (amountCents: number) => Promise<IPCResponse<void>>

  // Clients
  getClients: () => Promise<IPCResponse<ClientIPC[]>>
  getClientsWithBalances: () => Promise<IPCResponse<ClientWithBalance[]>>
  getClientById: (id: string) => Promise<IPCResponse<ClientIPC | null>>
  createClient: (data: Omit<ClientIPC, 'id' | 'createdAt'>) => Promise<IPCResponse<ClientIPC>>
  updateClient: (id: string, data: Partial<Omit<ClientIPC, 'createdAt'>>) => Promise<IPCResponse<ClientIPC>>
  deleteClient: (id: string) => Promise<IPCResponse<void>>
  getClientBalance: (clientId: string) => Promise<IPCResponse<ClientBalance>>
  getClientLedger: (clientId: string) => Promise<IPCResponse<LedgerEntry[]>>
  getProjectsByClient: (clientId: string) => Promise<IPCResponse<ProjectIPC[]>>
  migrateClientNames: () => Promise<IPCResponse<{ created: number; linked: number }>>

  // Payments
  getPaymentsByClient: (clientId: string) => Promise<IPCResponse<PaymentIPC[]>>
  createPayment: (data: Omit<PaymentIPC, 'id' | 'createdAt'>) => Promise<IPCResponse<PaymentIPC>>
  updatePayment: (id: string, data: Partial<Omit<PaymentIPC, 'createdAt'>>) => Promise<IPCResponse<PaymentIPC>>
  deletePayment: (id: string) => Promise<IPCResponse<void>>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
