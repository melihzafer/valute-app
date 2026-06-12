// src/shared/types.ts

export type PricingModel = 'HOURLY' | 'FIXED' | 'UNIT_BASED' | 'SUBSCRIPTION'

export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'check' | 'other'

// Client types
export interface Client {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: Date
}

// IPC-safe version with string dates
export interface ClientIPC {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  createdAt: string
}

// Payment types
export interface Payment {
  id: string
  clientId: string
  invoiceId?: string | null
  amount: number // cents
  date: Date
  method: PaymentMethod
  reference?: string
  notes?: string
  createdAt: Date
}

// IPC-safe version
export interface PaymentIPC {
  id: string
  clientId: string
  invoiceId?: string | null
  amount: number // cents
  date: string
  method: PaymentMethod
  reference?: string
  notes?: string
  createdAt: string
}

// Balance/Ledger types
export interface ClientBalance {
  clientId: string
  totalInvoiced: number // cents - sum of all invoice totals
  totalPaid: number // cents - sum of all payments
  balance: number // cents - totalInvoiced - totalPaid (positive = owes money)
}

export interface LedgerEntry {
  id: string
  type: 'invoice' | 'payment'
  date: string // ISO string
  description: string
  amount: number // cents (positive for invoices, negative for payments in display)
  runningBalance: number // cents
  referenceId: string // invoice ID or payment ID
}

export interface ClientWithBalance extends ClientIPC {
  balance: number // cents
  projectCount: number
}

export interface Project {
  id: string
  name: string
  clientId?: string
  clientName?: string
  pricingModel: PricingModel
  hourlyRate: number // For HOURLY, or price per unit for UNIT_BASED (in cents)
  fixedPrice?: number // For FIXED pricing (in cents)
  currency: string
  unitName?: string // For UNIT_BASED: "Page", "Article", "Video", etc.
  status: 'active' | 'archived'
  workflowStatus?: 'active' | 'on_hold' | 'done' // Lifecycle, independent of archived
  category?: ProjectCategory // M6: work | hobby | personal
  notes?: string // The Canvas - persistent project notes
  createdAt: Date
}

// IPC-safe version with string dates for serialization
export interface ProjectIPC {
  id: string
  name: string
  clientId?: string
  clientName?: string
  pricingModel: PricingModel
  hourlyRate: number
  fixedPrice?: number
  currency: string
  unitName?: string
  status: 'active' | 'archived'
  workflowStatus?: 'active' | 'on_hold' | 'done'
  category?: ProjectCategory // M6: work | hobby | personal
  notes?: string
  createdAt: string
}

export interface Log {
  id: string
  projectId: string
  startTime: Date
  endTime: Date | null
  accumulatedTime: number // in seconds (for HOURLY)
  quantity?: number // for UNIT_BASED tracking (e.g., 1.5 pages)
  description: string
  invoiceId?: string | null // Track which invoice this was billed to
}

// IPC-safe version with string dates for serialization
export interface LogIPC {
  id: string
  projectId: string
  startTime: string
  endTime: string | null
  accumulatedTime: number
  quantity?: number
  description: string
  invoiceId?: string | null
}

export type InvoiceLineItemType = 'hourly' | 'unit' | 'expense'

export interface InvoiceLineItem {
  id: string // Reference to log or expense ID
  type: InvoiceLineItemType
  date: string // ISO date string
  description: string

  // For 'hourly' type
  hours?: number
  hourlyRate?: number // in cents

  // For 'unit' type
  quantity?: number
  unitRate?: number // in cents
  unitName?: string

  // For 'expense' type
  category?: string

  // Common
  amount: number // in cents
}

export interface Invoice {
  id: string
  projectId: string
  invoiceNumber: string // e.g., "PRO-2026-001"
  issueDate: Date
  dueDate: Date
  lineItems: InvoiceLineItem[]
  subtotal: number // in cents
  taxRate?: number // percentage
  taxAmount?: number // in cents
  total: number // in cents
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
}

// IPC-safe version with string dates for serialization
export interface InvoiceIPC {
  id: string
  projectId: string
  invoiceNumber: string
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  subtotal: number
  taxRate?: number
  taxAmount?: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
}

export interface Expense {
  id: string
  projectId: string
  description: string
  amount: number // in cents
  date: Date
  isBillable: boolean
  category?: string // 'Software', 'Asset', 'Subcontractor'
  invoiceId?: string | null // Track which invoice this was billed to
}

// IPC-safe version with string dates for serialization
export interface ExpenseIPC {
  id: string
  projectId: string
  description: string
  amount: number
  date: string
  isBillable: boolean
  category?: string
  invoiceId?: string | null
}

export interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface TimerState {
  isRunning: boolean
  elapsedSeconds: number
  accumulatedTime: number
  startTime: number | null
  projectId: string | null
  description: string | null
  currentProjectName: string | null
}

// Asset Vault types
export interface Asset {
  id: string
  projectId: string
  name: string
  path: string
  type: 'folder' | 'file' | 'link'
  createdAt: Date
}

// IPC-safe version with string dates for serialization
export interface AssetIPC {
  id: string
  projectId: string
  name: string
  path: string
  type: 'folder' | 'file' | 'link'
  createdAt: string
}

// Daily Report (end-of-day "what I did" capture, also written to disk as .md)
export interface DailyReportIPC {
  id: string
  projectId: string
  reportDate: string
  content: string
  filePath: string | null
  createdAt: string
}

// Idea (Brainstorm space)
export type IdeaStatus = 'spark' | 'exploring' | 'parked' | 'promoted'

export interface IdeaIPC {
  id: string
  title: string
  body: string | null
  tags: string[]
  status: IdeaStatus
  promotedProjectId: string | null
  createdAt: string
}

// ============================================================
// Life-OS domains (M3, M5, M6, M7, M8)
// ============================================================

export type LifeArea = 'work' | 'uni' | 'health' | 'psychology' | 'hobby' | 'money' | 'general'

export type ProjectCategory = 'work' | 'hobby' | 'personal'

// M7 — Notes
export interface NoteIPC {
  id: string
  title: string
  content: string | null
  area: LifeArea
  tags: string[]
  pinned: boolean
  projectId: string | null
  createdAt: string
  updatedAt: string
}

// M8 — Tasks
export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface TaskIPC {
  id: string
  title: string
  notes: string | null
  status: TaskStatus
  priority: TaskPriority
  area: LifeArea
  dueDate: string | null
  projectId: string | null
  goalId: string | null
  sortOrder: number
  createdAt: string
  completedAt: string | null
}

// M8 — Goals
export type GoalStatus = 'active' | 'done' | 'archived'

export interface GoalIPC {
  id: string
  title: string
  description: string | null
  area: LifeArea
  targetValue: number
  currentValue: number
  unit: string | null
  dueDate: string | null
  status: GoalStatus
  createdAt: string
}

// M8 — Habits
export interface HabitIPC {
  id: string
  name: string
  area: LifeArea
  color: string
  schedule: string
  archived: boolean
  createdAt: string
  // computed
  doneToday?: boolean
  streak?: number
  last7?: boolean[] // most-recent-last completion flags for last 7 days
}

// M3 — University
export interface CourseIPC {
  id: string
  name: string
  code: string | null
  instructor: string | null
  credits: number | null
  semester: string | null
  color: string
  archived: boolean
  createdAt: string
  // computed
  assignmentCount?: number
  openCount?: number
  currentGrade?: number | null // weighted grade so far
}

export type AssignmentStatus = 'todo' | 'doing' | 'done'

export interface AssignmentIPC {
  id: string
  courseId: string
  title: string
  notes: string | null
  dueDate: string | null
  status: AssignmentStatus
  grade: number | null
  weight: number | null
  createdAt: string
}

// M5 — Mood Journal
export interface MoodEntryIPC {
  id: string
  date: string // YYYY-MM-DD
  mood: number // 1-5
  energy: number | null
  stress: number | null
  note: string | null
  gratitude: string | null
  createdAt: string
}

// M1/M2 — Life Dashboard aggregation
export interface LifeOverview {
  tasksDueToday: number
  tasksOverdue: number
  habitsDoneToday: number
  habitsTotal: number
  assignmentsDueSoon: number // next 7 days, not done
  activeGoals: number
  moodLoggedToday: boolean
  avgMood7: number | null // average mood last 7 days (1-5)
  earningsThisMonth: number // cents
  hoursThisWeek: number // seconds actually
  activeProjects: number
}

export interface LifeStats {
  // time series for last N days
  moodSeries: { date: string; mood: number | null }[]
  taskCompletion: { date: string; completed: number }[]
  habitConsistency: { date: string; ratio: number }[] // 0..1
  hoursByArea: { area: string; seconds: number }[]
  // headline numbers
  tasksCompleted: number
  habitCompletionRate: number // 0..1 over range
  bestHabitStreak: number
  avgMood: number | null
}

// Time Report (1d / 1w / 1m aggregation across projects)
export interface TimeReportRow {
  projectId: string
  projectName: string
  currency: string
  totalSeconds: number
  billableCents: number
  unbilledCents: number
  logCount: number
}

export interface TimeReport {
  startDate: string // ISO
  endDate: string // ISO
  totalSeconds: number
  totalBillableCents: number
  activeProjectCount: number // projects with logged time in range
  rows: TimeReportRow[]
}

// Dashboard types
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

// --- Settings Types (Phase 9) ---

export type Currency = 'USD' | 'EUR' | 'TRY' | 'GBP' | 'CAD' | 'AUD' | 'JPY'
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'

export interface GeneralSettings {
  currency: Currency
  dateFormat: DateFormat
}

export interface FocusSettings {
  enabled: boolean
  nudgeInterval: number // minutes: 15, 30, 60, 90, 120
}

export interface ScreenshotSettings {
  enabled: boolean
  frequency: number // minutes: 5, 10, 15, 30
  notifyBeforeCapture: boolean
  blurIntensity: 'off' | 'low' | 'high'
}

export interface AppSettings {
  general: GeneralSettings
  focus: FocusSettings
  screenshot: ScreenshotSettings
}

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  },
  focus: {
    enabled: true,
    nudgeInterval: 60
  },
  screenshot: {
    enabled: false,
    frequency: 10,
    notifyBeforeCapture: true,
    blurIntensity: 'off'
  }
}

// Database Export/Import types
export interface DatabaseExport {
  version: string
  exportedAt: string
  data: {
    projects: ProjectIPC[]
    clients: ClientIPC[]
    logs: LogIPC[]
    expenses: ExpenseIPC[]
    invoices: InvoiceIPC[]
    payments: PaymentIPC[]
    assets: AssetIPC[]
    screenshots: ScreenshotIPC[]
  }
}

// Screenshot types (Phase 10)
export interface Screenshot {
  id: string
  projectId: string
  logId: string | null
  filePath: string
  timestamp: Date
  createdAt: Date
}

// IPC-safe version with string dates
export interface ScreenshotIPC {
  id: string
  projectId: string
  logId: string | null
  filePath: string
  timestamp: string
  createdAt: string
}
