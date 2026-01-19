// src/main/db/store.ts

import Store from 'electron-store';
import type { Project, Log, Invoice } from '../../shared/types';

// Define the structure of your database
interface DatabaseSchema {
  projects: Project[];
  logs: Log[];
  invoices: Invoice[];
}

// Lazy-initialized store instance
let store: Store<DatabaseSchema> | null = null;

function getStore(): Store<DatabaseSchema> {
  if (!store) {
    store = new Store<DatabaseSchema>({
      name: 'vault-data',
      defaults: {
        projects: [],
        logs: [],
        invoices: [],
      },
    });
  }
  return store;
}

// Database interface to match the previous API
const db = {
  data: {
    get projects(): Project[] {
      return getStore().get('projects', []);
    },
    set projects(value: Project[]) {
      getStore().set('projects', value);
    },
    get logs(): Log[] {
      return getStore().get('logs', []);
    },
    set logs(value: Log[]) {
      getStore().set('logs', value);
    },
    get invoices(): Invoice[] {
      return getStore().get('invoices', []);
    },
    set invoices(value: Invoice[]) {
      getStore().set('invoices', value);
    },
  },
  async read(): Promise<void> {
    // electron-store reads synchronously, no async needed
  },
  async write(): Promise<void> {
    // electron-store writes synchronously, no async needed
  },
};

// Function to initialize the database
export async function initializeDatabase(): Promise<void> {
  // Initialize the store (this will create it if it doesn't exist)
  const s = getStore();
  console.log('Database initialized at:', s.path);
}

// Export a getter for the db instance
export function getDb() {
  return db;
}

// Export the db instance for use in services
export default db;
