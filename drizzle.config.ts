// drizzle.config.ts
// Drizzle Kit configuration for database migrations

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/main/db/schema.ts',
  out: './src/main/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/valute.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
