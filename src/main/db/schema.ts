// src/main/db/schema.ts
// Drizzle ORM Schema for Valute

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// clients: Client entities for client management
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  address: text('address'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// projects: Core project definitions
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  clientId: text('client_id').references(() => clients.id, { onDelete: 'set null' }), // NEW: Foreign key to clients
  clientName: text('client_name'), // KEEP: For backward compatibility during migration
  type: text('type').notNull(), // 'HOURLY', 'FIXED', 'UNIT_BASED', 'SUBSCRIPTION'
  currency: text('currency').default('USD'),
  hourlyRate: integer('hourly_rate'), // Cents (e.g. $50.00 -> 5000) or Price per Unit for UNIT_BASED
  fixedPrice: integer('fixed_price'), // Cents for fixed-price projects
  unitName: text('unit_name'), // For UNIT_BASED: 'Page', 'Article', 'Video', etc.
  archived: integer('archived', { mode: 'boolean' }).default(false),
  assetsPath: text('assets_path'), // Local folder path for project files
  notes: text('notes'), // The Canvas - persistent project notes
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// services: Service catalog from price list
export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // 'Logo Design', 'SEO Monthly'
  billingModel: text('billing_model').notNull(), // 'unit', 'subscription', 'hourly'
  defaultPrice: integer('default_price'), // Cents
  unitName: text('unit_name'), // 'Page', 'Video', 'Month'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// logs: Work records (Both time and unit based)
export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  serviceId: text('service_id').references(() => services.id, { onDelete: 'set null' }),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }), // NULL = unbilled
  startTime: integer('start_time', { mode: 'timestamp' }),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration'), // Seconds
  quantity: real('quantity'), // For unit based tasks (e.g. 1.5 videos)
  notes: text('notes'), // Rich Text JSON (TipTap)
  activityScore: integer('activity_score'), // Productivity 0-100
  tags: text('tags'), // JSON array of tags
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// expenses: Project expenses
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }), // NULL = unbilled
  description: text('description').notNull(),
  amount: integer('amount').notNull(), // Cents
  isBillable: integer('is_billable', { mode: 'boolean' }).default(true),
  markup: integer('markup'), // Markup percentage (e.g., 20 for 20%)
  date: integer('date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// invoices: Generated invoices
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull(),
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull().default('draft'), // 'draft', 'sent', 'paid', 'overdue'
  subtotal: integer('subtotal').notNull(), // Cents
  tax: integer('tax'), // Cents
  total: integer('total').notNull(), // Cents
  currency: text('currency').default('USD'),
  notes: text('notes'),
  lineItems: text('line_items').notNull(), // JSON array of line items
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// settings: VS Code style settings (key-value store)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(), // 'ai.apiKey', 'theme.mode', 'user.hourlyRate'
  value: text('value'), // JSON string value
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// payments: Financial payments from clients
export const payments = sqliteTable('payments', {
  id: text('id').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }), // Optional: link to specific invoice
  amount: integer('amount').notNull(), // Cents
  date: integer('date', { mode: 'timestamp' }).notNull(),
  method: text('method').notNull(), // 'bank_transfer', 'credit_card', 'cash', 'check', 'other'
  reference: text('reference'), // Check number, transaction ID, etc.
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// assets: Linked files/folders for projects (Asset Vault)
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // Display name (e.g., "Design Folder")
  path: text('path').notNull(), // Absolute local path
  type: text('type').notNull(), // 'folder' | 'file' | 'link'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// screenshots: Proof of work screenshots (Phase 10)
export const screenshots = sqliteTable('screenshots', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  logId: text('log_id').references(() => logs.id, { onDelete: 'set null' }),
  filePath: text('file_path').notNull(), // Absolute path to screenshot
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// Export types for TypeScript
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert

export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert

export type Expense = typeof expenses.$inferSelect
export type NewExpense = typeof expenses.$inferInsert

export type Invoice = typeof invoices.$inferSelect
export type NewInvoice = typeof invoices.$inferInsert

export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert

export type Asset = typeof assets.$inferSelect
export type NewAsset = typeof assets.$inferInsert

export type Client = typeof clients.$inferSelect
export type NewClient = typeof clients.$inferInsert

export type Payment = typeof payments.$inferSelect
export type NewPayment = typeof payments.$inferInsert

export type Screenshot = typeof screenshots.$inferSelect
export type NewScreenshot = typeof screenshots.$inferInsert
