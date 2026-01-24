# 💼 Valute

> **A modern desktop time tracking and project management application built with Electron, React, and TypeScript.**

[![Version](https://img.shields.io/badge/version-1.0.5-blue.svg)](https://github.com/melihzafer/valute-app)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-powered-47848F?logo=electron)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Features

- ⏱️ **Time Tracking** - Track your work hours with precision using integrated timers
- 📊 **Project Management** - Organize projects with detailed logging and metrics
- 💰 **Invoice Generation** - Create professional PDF invoices with jsPDF
- 📈 **Analytics Dashboard** - Visualize project data and time spent with beautiful charts
- 🎨 **Modern UI** - Clean, responsive interface built with Tailwind CSS and Radix UI
- 🌓 **Dark Mode** - Easy on the eyes with full dark mode support
- 💾 **Local Database** - Secure, fast data storage with Drizzle ORM and SQLite
- ⚡ **Fast & Native** - Desktop-native performance with Electron
- 🎯 **Unit Counter** - Track deliverables and milestones
- 💸 **Expense Tracking** - Monitor project costs and expenses

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/melihzafer/valute-app.git
cd valute-app

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building

```bash
# Build for production
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
- **Electron** - Cross-platform desktop app framework
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **Framer Motion** - Animation library
- **Lucide React** - Beautiful icon set
- **Recharts** - Chart library for data visualization

### Data & State
- **Drizzle ORM** - Type-safe database ORM
- **SQLite** - Embedded relational database
- **Zustand** - Lightweight state management
- **Zod** - TypeScript-first schema validation

### Features
- **React Router** - Client-side routing
- **date-fns** - Modern date utility library
- **jsPDF** - PDF generation
- **cmdk** - Command menu for keyboard shortcuts

---

## 📁 Project Structure

```
valute-app/
├── src/
│   ├── main/          # Electron main process
│   │   ├── handlers.ts
│   │   ├── db/        # Database schema & migrations
│   │   └── services/  # Business logic services
│   ├── renderer/      # React frontend
│   │   └── src/
│   │       ├── components/  # UI components
│   │       ├── pages/       # Application pages
│   │       ├── hooks/       # Custom React hooks
│   │       ├── store/       # Zustand state stores
│   │       └── lib/         # Utilities
│   ├── preload/       # Electron preload scripts
│   └── shared/        # Shared types & schemas
├── drizzle/           # Database schemas
└── resources/         # App icons & assets
```

---

## 🎯 Core Capabilities

### Time Tracking
- Start/stop timers for different projects
- Floating timer widget for always-visible tracking
- Manual time log entries
- Detailed time breakdowns

### Project Management
- Create and organize unlimited projects
- Track project status and progress
- Log work sessions with descriptions
- Monitor unit-based deliverables

### Invoice Generation
- Generate professional PDF invoices
- Customizable invoice templates
- Automatic calculations
- Track paid/unpaid status

### Dashboard & Analytics
- Visual overview of all projects
- Time spent analytics
- Revenue tracking
- Recent activity feed

---

## 🎨 Features Showcase

- **Command Menu**: Quick access to all features with `Cmd/Ctrl + K`
- **Dark/Light Theme**: Seamless theme switching
- **Responsive Design**: Works perfectly on any screen size
- **Keyboard Shortcuts**: Power-user friendly
- **Data Export**: Export your data anytime
- **Offline First**: Works without internet connection

---

## 📦 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type-check TypeScript files |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Electron Vite](https://electron-vite.org/)
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">

**[Website](https://electron-vite.org)** • **[Documentation](https://electron-vite.org)** • **[Report Bug](https://github.com/melihzafer/valute-app/issues)** • **[Request Feature](https://github.com/melihzafer/valute-app/issues)**

Made with ❤️ by [melihzafer](https://github.com/melihzafer)

</div>
