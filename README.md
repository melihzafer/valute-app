# 💼 Valute

> **A local-first desktop "Life-OS" for freelancers and students — time tracking, projects, clients & invoicing, health, university, calendar, notes, and an AI assistant. Built with Electron, React, and TypeScript. Works fully offline; all data lives in a single local SQLite file.**

[![Version](https://img.shields.io/badge/version-1.0.7-blue.svg)](https://github.com/melihzafer/valute-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-39-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ What it is

Valute started as a time-tracking and invoicing app and grew into a complete **Life-OS**: one place to run your freelance business *and* your personal life, all on your own machine. No account, no cloud, no subscription — your data never leaves your computer unless you choose to back it up.

### Work

- ⏱️ **Time tracking** — floating timer with a live earnings ticker (for hourly projects), pause/resume, idle detection, system-tray control, and a global hotkey (`Ctrl+Alt+Space`)
- 📊 **Projects** — hourly / fixed / unit-based / subscription pricing, per-project notes ("the Canvas"), asset vault, todos, screenshots, daily reports, and one-click app/repository launch
- 👥 **Clients & payments** — client ledger, invoices (PDF via jsPDF), payments, balances, and an unbilled-time workflow
- 💸 **Expenses** — billable vs. non-billable, categorized, attachable to invoices
- 📈 **Dashboard & reports** — widget-based customizable dashboard, time/earnings reports across projects and date ranges

### Life

- 🗓️ **Calendar & reminders** — unified feed of events + task/assignment/invoice deadlines, recurrence (daily/weekly/monthly), desktop notifications, and a daily briefing
- 🎓 **University** — courses, assignments, weighted grades, and a credit-weighted GPA snapshot
- ❤️ **Health** — sleep, water, workouts, weight, steps, and energy tracking with 7-day trends
- 😊 **Mood journal** — daily mood/energy/stress + gratitude, with a 7-day trend
- 📝 **Notes & journal** — area-tagged notes, pinning, project linking
- 💡 **Ideas** — capture sparks and promote them into real projects
- ✅ **Tasks, habits & goals** — life-area organization, streaks, and progress tracking
- 🗓️ **Planner** — a focused view of what's due and what's next
- 🤖 **AI assistant** — optional Anthropic-powered Q&A over your data, quick-add ("create a task for…"), and weekly summaries (bring your own API key; the SDK is externalized, not bundled)

### Trust & portability

- 💾 **Local SQLite** via Drizzle ORM — fast, offline, yours
- 🔒 **Encrypted backups** — AES-256-GCM (scrypt-derived key) `.vbackup` files you can drop in any cloud drive
- 🕒 **Scheduled auto-backup** — back up every N days to a folder of your choice, with automatic pruning of old snapshots
- 📱 **Mobile companion** — an optional token-protected LAN server so your phone (on the same Wi-Fi) can quick-capture tasks and control the timer
- 🎨 **Themes & scale** — light/dark + accent presets, a customizable UI scale, and a movable widget canvas
- 🚀 **Onboarding & templates** — first-run onboarding with freelancer / student / creator starter data

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/melihzafer/valute-app.git
cd valute-app

# Install dependencies
# NOTE: --legacy-peer-deps is required. react-day-picker@8 declares a peer
# dependency on date-fns@^2||^3, but this project uses date-fns@4.
npm install --legacy-peer-deps

# Run in development mode
npm run dev
```

> **Gotcha:** changes to `src/main` or `src/preload` (any `window.api.*` or `ipcMain.handle`) require a **full dev restart** — electron-vite only hot-reloads the renderer. A stale preload shows up as "`X is not a function`" on `window.api`, not as a missing-wiring error.

### Building

```bash
# Build for production (runs typecheck first)
npm run build

# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

---

## 🛠️ Tech Stack

### Core

- **Electron 39** — cross-platform desktop runtime
- **React 19** — UI library
- **TypeScript 5.9** (strict, split `tsconfig.web` / `tsconfig.node`)
- **electron-vite 5** + **Vite 7** — build tooling

### UI & Styling

- **Tailwind CSS 3.4** + **tailwindcss-animate**
- **Radix UI** (shadcn-style primitives) — accessible dialogs, popovers, selects
- **Framer Motion** — animation
- **Lucide React** — icons
- **Recharts** — charts

### Data & State

- **Drizzle ORM 0.45** + **better-sqlite3 12** — type-safe local database
- **Zustand 5** — lightweight state management
- **Zod 4** — schema validation
- **React Router 7** — routing

### Utilities

- **date-fns 4** — date math
- **jsPDF** + **jspdf-autotable** — PDF invoices
- **cmdk** — command palette (`Cmd/Ctrl + K`)
- **@anthropic-ai/sdk** — AI assistant (externalized, not bundled)

---

## 📁 Project Structure

```
valute-app/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App lifecycle, tray, schedulers
│   │   ├── handlers.ts    # IPC handlers (compact `reg()` helper)
│   │   ├── db/            # Drizzle schema + self-migrating SQLite init
│   │   └── services/      # Business logic (one file per domain)
│   ├── renderer/          # React frontend
│   │   └── src/
│   │       ├── components/    # UI components (ui/, clients/, widgets)
│   │       ├── pages/         # One page per route
│   │       ├── hooks/         # Custom hooks (e.g. useTimer)
│   │       ├── store/         # Zustand stores
│   │       └── lib/           # Utilities (currency, themes, invoices)
│   ├── preload/           # Typed IPC bridge (index.ts + index.d.ts)
│   └── shared/            # Pure logic + types (money, earnings, grades, recurrence)
├── .github/workflows/     # ci.yml (PRs) + release.yml (tags)
└── resources/             # App icons & assets
```

The `src/shared/` directory holds DB-free, zero-dependency pure logic (money conversion, earnings math, grade calculation, recurrence expansion). It's the first place covered by unit tests and the safest target for refactoring.

---

## 📦 Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start development (electron-vite)                |
| `npm run build`      | Typecheck + build for production                 |
| `npm run start`      | Preview the production build                     |
| `npm test`           | Run the Vitest unit-test suite                   |
| `npm run test:watch` | Run tests in watch mode                          |
| `npm run typecheck`  | Type-check both the web and node tsconfigs       |
| `npm run lint`       | Run ESLint                                       |
| `npm run format`     | Format code with Prettier                        |

---

## 🧪 Testing & CI

- **Unit tests** run on [Vitest](https://vitest.dev/) and cover the pure shared modules (`src/shared/*`): money conversion, earnings math, grade calculation, and recurrence expansion. Run them with `npm test`.
- **CI** (`.github/workflows/ci.yml`) runs on every push to `main` and on pull requests: TypeScript typecheck + tests are hard gates; ESLint is advisory while pre-existing lint debt is being cleared.
- **Releases** (`.github/workflows/release.yml`) build and publish Windows, macOS, and Linux artifacts on version tags, gated by typecheck + tests.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request — CI will typecheck and run the tests automatically

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Report Bug](https://github.com/melihzafer/valute-app/issues)** • **[Request Feature](https://github.com/melihzafer/valute-app/issues)**

Made with ❤️ by [melihzafer](https://github.com/melihzafer)

</div>
