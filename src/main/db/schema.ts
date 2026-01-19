// src/main/db/schema.ts
// Drizzle ORM Schema for Valute

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// projects: Core project definitions
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  clientName: text('client_name'),
  type: text('type').notNull(), // 'hourly', 'fixed', 'retainer'
  currency: text('currency').default('USD'),
  hourlyRate: integer('hourly_rate'), // Cents (e.g. $50.00 -> 5000)
  fixedPrice: integer('fixed_price'), // Cents for fixed-price projects
  archived: integer('archived', { mode: 'boolean' }).default(false),
  assetsPath: text('assets_path'), // Local folder path for project files
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// services: Service catalog from price list
export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // 'Logo Design', 'SEO Monthly'
  billingModel: text('billing_model').notNull(), // 'unit', 'subscription', 'hourly'
  defaultPrice: integer('default_price'), // Cents
  unitName: text('unit_name'), // 'Page', 'Video', 'Month'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// logs: Work records (Both time and unit based)
export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  serviceId: text('service_id').references(() => services.id, { onDelete: 'set null' }),
  startTime: integer('start_time', { mode: 'timestamp' }),
  endTime: integer('end_time', { mode: 'timestamp' }),
  duration: integer('duration'), // Seconds
  quantity: real('quantity'), // For unit based tasks (e.g. 1.5 videos)
  notes: text('notes'), // Rich Text JSON (TipTap)
  activityScore: integer('activity_score'), // Productivity 0-100
  tags: text('tags'), // JSON array of tags
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// expenses: Project expenses
export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amount: integer('amount').notNull(), // Cents
  isBillable: integer('is_billable', { mode: 'boolean' }).default(true),
  markup: integer('markup'), // Markup percentage (e.g., 20 for 20%)
  date: integer('date', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

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
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// settings: VS Code style settings (key-value store)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(), // 'ai.apiKey', 'theme.mode', 'user.hourlyRate'
  value: text('value'), // JSON string value
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Export types for TypeScript
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
