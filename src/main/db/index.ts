// src/main/db/index.ts
// Database initialization and connection management

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let sqlite: Database.Database | null = null

// SQL to create all tables (from migrations)
const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "projects" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "client_name" text,
  "type" text NOT NULL,
  "currency" text DEFAULT 'USD',
  "hourly_rate" integer,
  "fixed_price" integer,
  "unit_name" text,
  "archived" integer DEFAULT false,
  "workflow_status" text DEFAULT 'active',
  "assets_path" text,
  "notes" text,
  "github_url" text,
  "local_path" text,
  "run_command" text,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "services" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "billing_model" text NOT NULL,
  "default_price" integer,
  "unit_name" text,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "logs" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "service_id" text,
  "invoice_id" text,
  "start_time" integer,
  "end_time" integer,
  "duration" integer,
  "quantity" real,
  "notes" text,
  "activity_score" integer,
  "tags" text,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY ("service_id") REFERENCES "services"("id") ON UPDATE no action ON DELETE set null,
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "invoice_id" text,
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "is_billable" integer DEFAULT true,
  "markup" integer,
  "date" integer,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "invoice_number" text NOT NULL,
  "issue_date" integer NOT NULL,
  "due_date" integer NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "subtotal" integer NOT NULL,
  "tax" integer,
  "total" integer NOT NULL,
  "currency" text DEFAULT 'USD',
  "notes" text,
  "line_items" text NOT NULL,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "settings" (
  "key" text PRIMARY KEY NOT NULL,
  "value" text,
  "updated_at" integer
);

CREATE TABLE IF NOT EXISTS "assets" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "name" text NOT NULL,
  "path" text NOT NULL,
  "type" text NOT NULL,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "clients" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "company" text,
  "email" text,
  "phone" text,
  "address" text,
  "notes" text,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL,
  "invoice_id" text,
  "amount" integer NOT NULL,
  "date" integer NOT NULL,
  "method" text NOT NULL,
  "reference" text,
  "notes" text,
  "created_at" integer,
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "screenshots" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "log_id" text,
  "file_path" text NOT NULL,
  "timestamp" integer NOT NULL,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY ("log_id") REFERENCES "logs"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "daily_reports" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "report_date" integer NOT NULL,
  "content" text NOT NULL,
  "file_path" text,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "ideas" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "tags" text,
  "status" text DEFAULT 'spark' NOT NULL,
  "promoted_project_id" text,
  "created_at" integer,
  FOREIGN KEY ("promoted_project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "notes" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "content" text,
  "area" text DEFAULT 'general',
  "tags" text,
  "pinned" integer DEFAULT false,
  "project_id" text,
  "created_at" integer,
  "updated_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "status" text DEFAULT 'todo' NOT NULL,
  "priority" text DEFAULT 'medium',
  "area" text DEFAULT 'general',
  "due_date" integer,
  "project_id" text,
  "goal_id" text,
  "sort_order" integer DEFAULT 0,
  "github_issue_number" integer,
  "github_issue_url" text,
  "created_at" integer,
  "completed_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "goals" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "area" text DEFAULT 'general',
  "target_value" real DEFAULT 100,
  "current_value" real DEFAULT 0,
  "unit" text,
  "due_date" integer,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "habits" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "area" text DEFAULT 'general',
  "color" text DEFAULT '#6366f1',
  "schedule" text DEFAULT 'daily',
  "archived" integer DEFAULT false,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "habit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "habit_id" text NOT NULL,
  "date" text NOT NULL,
  "created_at" integer,
  FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "courses" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "code" text,
  "instructor" text,
  "credits" real,
  "semester" text,
  "color" text DEFAULT '#6366f1',
  "archived" integer DEFAULT false,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "course_id" text NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "due_date" integer,
  "status" text DEFAULT 'todo' NOT NULL,
  "grade" real,
  "weight" real,
  "created_at" integer,
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS "mood_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "mood" integer NOT NULL,
  "energy" integer,
  "stress" integer,
  "note" text,
  "gratitude" text,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "health_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "date" text NOT NULL,
  "sleep_hours" real,
  "water_ml" integer,
  "workout_duration" integer,
  "workout_type" text,
  "weight" real,
  "steps" integer,
  "energy_level" integer,
  "notes" text,
  "created_at" integer
);

CREATE TABLE IF NOT EXISTS "events" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "area" text DEFAULT 'general',
  "start_time" integer NOT NULL,
  "end_time" integer,
  "all_day" integer DEFAULT false,
  "location" text,
  "color" text DEFAULT '#6366f1',
  "recurrence" text DEFAULT 'none',
  "reminder_minutes" integer,
  "notified_for" text,
  "project_id" text,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE set null
);
`

// Migration SQL for existing databases (add columns that may be missing)
// Reserved for future use - uncomment when migrations are needed
// const MIGRATIONS_SQL = `
// -- Add notes column to projects if it doesn't exist
// ALTER TABLE "projects" ADD COLUMN "notes" text;
// `

/**
 * Initialize the database connection
 * Creates the database file if it doesn't exist
 * Creates tables if they don't exist
 */
export function initializeDatabase(): ReturnType<typeof drizzle> {
  if (db) {
    return db
  }

  try {
    // Get user data directory
    const userDataPath = app.getPath('userData')
    const dbDir = path.join(userDataPath, 'data')

    // Ensure data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    const dbPath = path.join(dbDir, 'valute.db')

    console.log('Initializing database at:', dbPath)

    // Create SQLite connection
    sqlite = new Database(dbPath)

    // Enable WAL mode for better concurrent access
    sqlite.pragma('journal_mode = WAL')

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON')

    // Create tables if they don't exist
    console.log('Creating database tables...')
    sqlite.exec(CREATE_TABLES_SQL)
    console.log('Database tables ready')

    // Run migrations for existing databases (add missing columns)
    console.log('Running database migrations...')
    try {
      // Check if notes column exists in projects table
      const projectsInfo = sqlite.prepare('PRAGMA table_info(projects)').all() as { name: string }[]
      const hasNotesColumn = projectsInfo.some((col) => col.name === 'notes')

      if (!hasNotesColumn) {
        console.log('Adding notes column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "notes" text;')
        console.log('Notes column added successfully')
      }

      // Check if invoice_id column exists in logs table
      const logsInfo = sqlite.prepare('PRAGMA table_info(logs)').all() as { name: string }[]
      const logsHasInvoiceId = logsInfo.some((col) => col.name === 'invoice_id')

      if (!logsHasInvoiceId) {
        console.log('Adding invoice_id column to logs table...')
        sqlite.exec('ALTER TABLE "logs" ADD COLUMN "invoice_id" text;')
        console.log('invoice_id column added to logs successfully')
      }

      // Check if invoice_id column exists in expenses table
      const expensesInfo = sqlite.prepare('PRAGMA table_info(expenses)').all() as { name: string }[]
      const expensesHasInvoiceId = expensesInfo.some((col) => col.name === 'invoice_id')

      if (!expensesHasInvoiceId) {
        console.log('Adding invoice_id column to expenses table...')
        sqlite.exec('ALTER TABLE "expenses" ADD COLUMN "invoice_id" text;')
        console.log('invoice_id column added to expenses successfully')
      }

      // Check if client_id column exists in projects table
      const projectsHasClientId = projectsInfo.some((col) => col.name === 'client_id')

      if (!projectsHasClientId) {
        console.log('Adding client_id column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "client_id" text REFERENCES clients(id);')
        console.log('client_id column added to projects successfully')
      }

      // Check if workflow_status column exists in projects table
      const projectsHasWorkflowStatus = projectsInfo.some((col) => col.name === 'workflow_status')

      if (!projectsHasWorkflowStatus) {
        console.log('Adding workflow_status column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "workflow_status" text DEFAULT \'active\';')
        console.log('workflow_status column added to projects successfully')
      }

      // Check if category column exists in projects table (M6 Hobbies/personal projects)
      const projectsHasCategory = projectsInfo.some((col) => col.name === 'category')

      if (!projectsHasCategory) {
        console.log('Adding category column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "category" text DEFAULT \'work\';')
        console.log('category column added to projects successfully')
      }

      // Check if github_url column exists in projects table
      const projectsHasGithubUrl = projectsInfo.some((col) => col.name === 'github_url')

      if (!projectsHasGithubUrl) {
        console.log('Adding github_url column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "github_url" text;')
        console.log('github_url column added to projects successfully')
      }

      // Check if local_path column exists in projects table
      const projectsHasLocalPath = projectsInfo.some((col) => col.name === 'local_path')

      if (!projectsHasLocalPath) {
        console.log('Adding local_path column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "local_path" text;')
        console.log('local_path column added to projects successfully')
      }

      // Check if run_command column exists in projects table
      const projectsHasRunCommand = projectsInfo.some((col) => col.name === 'run_command')

      if (!projectsHasRunCommand) {
        console.log('Adding run_command column to projects table...')
        sqlite.exec('ALTER TABLE "projects" ADD COLUMN "run_command" text;')
        console.log('run_command column added to projects successfully')
      }

      // Check if github_issue_number column exists in tasks table
      const tasksInfo = sqlite.prepare('PRAGMA table_info(tasks)').all() as { name: string }[]
      const tasksHasIssueNumber = tasksInfo.some((col) => col.name === 'github_issue_number')

      if (!tasksHasIssueNumber) {
        console.log('Adding github_issue_number column to tasks table...')
        sqlite.exec('ALTER TABLE "tasks" ADD COLUMN "github_issue_number" integer;')
        sqlite.exec('ALTER TABLE "tasks" ADD COLUMN "github_issue_url" text;')
        console.log('GitHub issue columns added to tasks successfully')
      }

      // Run health_entries table migration
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS "health_entries" (
          "id" text PRIMARY KEY NOT NULL,
          "date" text NOT NULL,
          "sleep_hours" real,
          "water_ml" integer,
          "workout_duration" integer,
          "workout_type" text,
          "weight" real,
          "steps" integer,
          "energy_level" integer,
          "notes" text,
          "created_at" integer
        );
      `)
    } catch (migrationError) {
      // Column might already exist, that's fine
      console.log('Migration check completed:', migrationError)
    }
    console.log('Database migrations complete')

    // Create Drizzle instance
    db = drizzle(sqlite, { schema })

    console.log('Database initialized successfully')
    return db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw error
  }
}

/**
 * Get the database instance
 * Initializes if not already initialized
 */
export function getDb() {
  if (!db) {
    return initializeDatabase()
  }
  return db
}

/**
 * Get the raw better-sqlite3 connection (for full backup/restore).
 * Initializes the database if needed.
 */
export function getRawDb(): Database.Database {
  if (!sqlite) {
    initializeDatabase()
  }
  return sqlite as Database.Database
}

/**
 * Close the database connection
 * Should be called when the app is closing
 */
export function closeDatabase() {
  if (sqlite) {
    console.log('Closing database connection...')
    sqlite.close()
    db = null
    sqlite = null
    console.log('Database connection closed')
  }
}

// Export schema for use in services
export { schema }
