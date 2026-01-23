# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Valute is a time-tracking and invoicing application built with Electron, React, and TypeScript. It helps freelancers and agencies track project hours, manage expenses, and generate invoices.

## Common Commands

### Development
```bash
npm run dev              # Start development server with hot reload
npm start                # Preview built application
```

### Build
```bash
npm run build            # Type check and build all processes
npm run build:win        # Build Windows installer
npm run build:mac        # Build macOS application
npm run build:linux      # Build Linux package
npm run build:unpack     # Build without packaging (for testing)
```

### Code Quality
```bash
npm run typecheck        # Run TypeScript type checking for all processes
npm run typecheck:node   # Type check main/preload processes only
npm run typecheck:web    # Type check renderer process only
npm run lint             # Run ESLint on codebase
npm run format           # Format code with Prettier
```

### Database
```bash
npx drizzle-kit generate # Generate SQL migrations from schema changes
npx drizzle-kit push     # Push schema changes directly to database
npx drizzle-kit studio   # Launch Drizzle Studio GUI for database inspection
```

## Architecture Overview

### Electron Process Model

This application follows Electron's multi-process architecture:

1. **Main Process** (`src/main/`): Node.js environment that controls application lifecycle, manages windows, and handles system operations
2. **Renderer Process** (`src/renderer/`): Browser environment running the React UI
3. **Preload Script** (`src/preload/`): Bridge between main and renderer with controlled IPC exposure
4. **Shared** (`src/shared/`): Types and schemas shared across processes

### IPC Communication Pattern

- **Main → Renderer**: Services expose methods via `ipcMain.handle()` in `src/main/handlers.ts`
- **Renderer → Main**: Frontend calls exposed APIs via `window.api.*` (defined in preload)
- **Type Safety**: All IPC payloads use IPC-safe types (dates as strings) defined in `src/shared/types.ts`

### Database Layer (Drizzle ORM + better-sqlite3)

- **Schema**: `src/main/db/schema.ts` defines all tables using Drizzle ORM
- **Store**: `src/main/db/store.ts` provides database CRUD operations
- **Services**: Business logic layer (`src/main/services/`) sits between IPC handlers and database store
- **Location**: SQLite database at `./data/valute.db`
- **Migration Config**: `drizzle.config.ts` configures schema path and migration output

**Key Tables**:
- `projects`: Client projects with billing models (hourly/fixed/retainer)
- `logs`: Time tracking entries with start/end times and duration
- `services`: Reusable service catalog with pricing
- `expenses`: Project expenses with billable/non-billable tracking
- `invoices`: Generated invoices with line items stored as JSON
- `settings`: Key-value store for application settings

**Important**: All monetary values are stored in cents (integer) to avoid floating-point precision issues.

### State Management

- **Zustand Stores** (`src/renderer/src/store/`): Client-side state for projects, invoices, and timer
- **Pattern**: Stores call IPC APIs and cache results; IPC handlers interact with services
- **Timer State**: `useTimerStore` manages active time tracking session with persistence

### Frontend Architecture

- **Routing**: React Router v7 (`src/renderer/src/App.tsx`)
- **Pages**: Dashboard, Projects, Reports, Settings (`src/renderer/src/pages/`)
- **Components**: UI components in `src/renderer/src/components/`
  - `ui/`: Reusable design system components (Button, Input, Dialog, etc.)
  - Feature components: ProjectList, InvoiceForm, TimerWidget, LogEntry, etc.
- **Styling**: Tailwind CSS with custom configuration
- **Utilities**: `src/renderer/src/lib/utils.ts` for classname merging, `invoiceGenerator.ts` for PDF generation

### Invoice Generation

- Uses `jspdf` and `jspdf-autotable` for PDF creation
- Logic in `src/renderer/src/lib/invoiceGenerator.ts`
- Aggregates logs, calculates totals, applies tax, and formats currency

## Important Patterns

### Adding New IPC Handlers

1. Define IPC-safe types in `src/shared/types.ts` (use string for dates)
2. Create/update service in `src/main/services/`
3. Register handler in `src/main/handlers.ts` using `ipcMain.handle()`
4. Expose in preload script `src/preload/index.ts` and type definitions `src/preload/index.d.ts`
5. Call from renderer via `window.api.*`

### Database Schema Changes

1. Modify `src/main/db/schema.ts`
2. Run `npx drizzle-kit generate` to create migration
3. Migrations apply automatically on app startup via `initializeDatabase()`

### Monetary Values

Always use integers for money (cents):
- $50.00 → `5000`
- Convert to display: `(cents / 100).toFixed(2)`
- Use the currency field to determine symbol/format

## Project Configuration

- **Build Config**: `electron-builder.yml` defines packaging options and assets
- **Vite Config**: `electron.vite.config.ts` configures main/preload/renderer builds
- **TypeScript**: Separate configs for Node (`tsconfig.node.json`) and Web (`tsconfig.web.json`)
- **Path Alias**: `@renderer` points to `src/renderer/src` (configured in Vite)
