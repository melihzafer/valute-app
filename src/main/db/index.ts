// src/main/db/index.ts
// Database initialization and connection management

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

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
  "assets_path" text,
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
  "start_time" integer,
  "end_time" integer,
  "duration" integer,
  "quantity" real,
  "notes" text,
  "activity_score" integer,
  "tags" text,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY ("service_id") REFERENCES "services"("id") ON UPDATE no action ON DELETE set null
);

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" text PRIMARY KEY NOT NULL,
  "project_id" text NOT NULL,
  "description" text NOT NULL,
  "amount" integer NOT NULL,
  "is_billable" integer DEFAULT true,
  "markup" integer,
  "date" integer,
  "created_at" integer,
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON UPDATE no action ON DELETE cascade
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
`;

/**
 * Initialize the database connection
 * Creates the database file if it doesn't exist
 * Creates tables if they don't exist
 */
export function initializeDatabase(): ReturnType<typeof drizzle> {
  if (db) {
    return db;
  }

  try {
    // Get user data directory
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');

    // Ensure data directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const dbPath = path.join(dbDir, 'valute.db');

    console.log('Initializing database at:', dbPath);

    // Create SQLite connection
    sqlite = new Database(dbPath);

    // Enable WAL mode for better concurrent access
    sqlite.pragma('journal_mode = WAL');

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Create tables if they don't exist
    console.log('Creating database tables...');
    sqlite.exec(CREATE_TABLES_SQL);
    console.log('Database tables ready');

    // Create Drizzle instance
    db = drizzle(sqlite, { schema });

    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 * Initializes if not already initialized
 */
export function getDb() {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 * Should be called when the app is closing
 */
export function closeDatabase() {
  if (sqlite) {
    console.log('Closing database connection...');
    sqlite.close();
    db = null;
    sqlite = null;
    console.log('Database connection closed');
  }
}

// Export schema for use in services
export { schema };
