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
  workflowStatus: text('workflow_status').default('active'), // 'active' | 'on_hold' | 'done' (lifecycle, independent of archived)
  category: text('category').default('work'), // 'work' | 'hobby' | 'personal' (M6 — same engine, different life area)
  assetsPath: text('assets_path'), // Local folder path for project files
  notes: text('notes'), // The Canvas - persistent project notes
  githubUrl: text('github_url'), // Repository URL for one-click open
  localPath: text('local_path'), // Local directory for one-click open
  runCommand: text('run_command'), // Command to execute for project
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

// daily_reports: End-of-day "what I did" reports, also written to disk as .md files
export const dailyReports = sqliteTable('daily_reports', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  reportDate: integer('report_date', { mode: 'timestamp' }).notNull(), // The day the report covers
  content: text('content').notNull(), // Raw markdown pasted by the user
  filePath: text('file_path'), // Absolute path to the .md written on disk (null if write failed)
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ideas: Brainstorm space for ideas not yet tied to a project
export const ideas = sqliteTable('ideas', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body'), // Markdown notes
  tags: text('tags'), // JSON array of tags
  status: text('status').notNull().default('spark'), // 'spark' | 'exploring' | 'parked' | 'promoted'
  promotedProjectId: text('promoted_project_id').references(() => projects.id, {
    onDelete: 'set null'
  }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// ============================================================
// Life-OS domains (M3 University, M5 Mood, M7 Notes, M8 Tasks/Goals/Habits)
// ============================================================

// notes: Block/markdown notes — personal knowledge base (M7)
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content'), // Markdown / rich text
  area: text('area').default('general'), // life area tag: work | uni | health | psychology | hobby | money | general
  tags: text('tags'), // JSON array
  pinned: integer('pinned', { mode: 'boolean' }).default(false),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// tasks: Unified to-do across every life area (M8)
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('todo'), // 'todo' | 'doing' | 'done'
  priority: text('priority').default('medium'), // 'low' | 'medium' | 'high'
  area: text('area').default('general'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  goalId: text('goal_id'),
  sortOrder: integer('sort_order').default(0),
  githubIssueNumber: integer('github_issue_number'),
  githubIssueUrl: text('github_issue_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' })
})

// goals: OKR-style goals with measurable progress (M8)
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  area: text('area').default('general'),
  targetValue: real('target_value').default(100),
  currentValue: real('current_value').default(0),
  unit: text('unit'), // '%', 'hrs', '$', 'books', etc.
  dueDate: integer('due_date', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'), // 'active' | 'done' | 'archived'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// habits: Recurring habits to build (M8)
export const habits = sqliteTable('habits', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  area: text('area').default('general'),
  color: text('color').default('#6366f1'),
  schedule: text('schedule').default('daily'), // 'daily' for now
  archived: integer('archived', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// habit_logs: One row per habit per completed day (M8)
export const habitLogs = sqliteTable('habit_logs', {
  id: text('id').primaryKey(),
  habitId: text('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // 'YYYY-MM-DD'
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// courses: University courses (M3)
export const courses = sqliteTable('courses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'), // 'CS101'
  instructor: text('instructor'),
  credits: real('credits'),
  semester: text('semester'), // 'Fall 2026'
  color: text('color').default('#6366f1'),
  archived: integer('archived', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// assignments: Coursework with deadlines and grades (M3)
export const assignments = sqliteTable('assignments', {
  id: text('id').primaryKey(),
  courseId: text('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  notes: text('notes'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  status: text('status').notNull().default('todo'), // 'todo' | 'doing' | 'done'
  grade: real('grade'), // achieved grade, 0-100
  weight: real('weight'), // % weight toward final grade
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// mood_entries: Daily mood/energy/stress journal (M5)
export const moodEntries = sqliteTable('mood_entries', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // 'YYYY-MM-DD' (one per day)
  mood: integer('mood').notNull(), // 1-5
  energy: integer('energy'), // 1-5
  stress: integer('stress'), // 1-5
  note: text('note'),
  gratitude: text('gratitude'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// health_entries: Daily sleep, workouts, water, weight, steps, energy (M4)
export const healthEntries = sqliteTable('health_entries', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // 'YYYY-MM-DD' (one per day)
  sleepHours: real('sleep_hours'),
  waterMl: integer('water_ml'),
  workoutDuration: integer('workout_duration'), // minutes
  workoutType: text('workout_type'),
  weight: real('weight'),
  steps: integer('steps'),
  energyLevel: integer('energy_level'), // 1-5
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
})

// events: Calendar events & reminders (M11) — unified across every life area
export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  area: text('area').default('general'), // life area tag
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }),
  allDay: integer('all_day', { mode: 'boolean' }).default(false),
  location: text('location'),
  color: text('color').default('#6366f1'),
  recurrence: text('recurrence').default('none'), // 'none' | 'daily' | 'weekly' | 'monthly'
  reminderMinutes: integer('reminder_minutes'), // minutes before start to notify; null = no reminder
  notifiedFor: text('notified_for'), // ISO of the occurrence we already fired a reminder for
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
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

export type DailyReport = typeof dailyReports.$inferSelect
export type NewDailyReport = typeof dailyReports.$inferInsert

export type Idea = typeof ideas.$inferSelect
export type NewIdea = typeof ideas.$inferInsert

export type Note = typeof notes.$inferSelect
export type NewNote = typeof notes.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert

export type Goal = typeof goals.$inferSelect
export type NewGoal = typeof goals.$inferInsert

export type Habit = typeof habits.$inferSelect
export type NewHabit = typeof habits.$inferInsert

export type HabitLog = typeof habitLogs.$inferSelect
export type NewHabitLog = typeof habitLogs.$inferInsert

export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert

export type Assignment = typeof assignments.$inferSelect
export type NewAssignment = typeof assignments.$inferInsert

export type MoodEntry = typeof moodEntries.$inferSelect
export type NewMoodEntry = typeof moodEntries.$inferInsert

export type HealthEntry = typeof healthEntries.$inferSelect
export type NewHealthEntry = typeof healthEntries.$inferInsert

export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
