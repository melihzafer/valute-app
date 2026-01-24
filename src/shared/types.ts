// src/shared/types.ts

export type PricingModel = 'HOURLY' | 'FIXED' | 'UNIT_BASED' | 'SUBSCRIPTION'

export interface Project {
  id: string
  name: string
  clientName?: string
  pricingModel: PricingModel
  hourlyRate: number // For HOURLY, or price per unit for UNIT_BASED (in cents)
  fixedPrice?: number // For FIXED pricing (in cents)
  currency: string
  unitName?: string // For UNIT_BASED: "Page", "Article", "Video", etc.
  status: 'active' | 'archived'
  notes?: string // The Canvas - persistent project notes
  createdAt: Date
}

// IPC-safe version with string dates for serialization
export interface ProjectIPC {
  id: string
  name: string
  clientName?: string
  pricingModel: PricingModel
  hourlyRate: number
  fixedPrice?: number
  currency: string
  unitName?: string
  status: 'active' | 'archived'
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
