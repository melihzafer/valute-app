// src/main/db/index.ts
// Database initialization and connection management

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

/**
 * Initialize the database connection
 * Creates the database file if it doesn't exist
 * Runs migrations automatically
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

    // Create Drizzle instance
    db = drizzle(sqlite, { schema });

    // Run migrations
    const migrationsPath = path.join(__dirname, 'migrations');
    if (fs.existsSync(migrationsPath)) {
      console.log('Running database migrations...');
      migrate(db, { migrationsFolder: migrationsPath });
      console.log('Migrations completed successfully');
    } else {
      console.log('No migrations folder found, skipping migrations');
    }

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
