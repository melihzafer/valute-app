import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (data: unknown) => ipcRenderer.invoke('create-project', data),
  updateProject: (id: string, data: unknown) => ipcRenderer.invoke('update-project', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('delete-project', id),
  projectOpenFolder: (path: string) => ipcRenderer.invoke('project:open-folder', path),
  projectRunCommand: (command: string, cwd?: string) =>
    ipcRenderer.invoke('project:run-command', command, cwd),

  // Logs
  getLogsByProject: (projectId: string) => ipcRenderer.invoke('get-logs-by-project', projectId),
  saveLog: (data: unknown) => ipcRenderer.invoke('save-log', data),
  deleteLog: (id: string) => ipcRenderer.invoke('delete-log', id),

  // Invoices
  getLogsForInvoice: (startDate: string, endDate: string, projectId?: string) =>
    ipcRenderer.invoke('get-logs-for-invoice', startDate, endDate, projectId),
  getUnbilledLogs: (projectId: string) => ipcRenderer.invoke('get-unbilled-logs', projectId),
  getUnbilledExpenses: (projectId: string) =>
    ipcRenderer.invoke('get-unbilled-expenses', projectId),
  createInvoice: (data: unknown, pdfBuffer?: ArrayBuffer) =>
    ipcRenderer.invoke('create-invoice', data, pdfBuffer),
  getAllInvoices: () => ipcRenderer.invoke('get-all-invoices'),
  getInvoicesByProject: (projectId: string) =>
    ipcRenderer.invoke('get-invoices-by-project', projectId),
  updateInvoiceStatus: (id: string, status: 'draft' | 'sent' | 'paid' | 'overdue') =>
    ipcRenderer.invoke('update-invoice-status', id, status),
  deleteInvoice: (id: string) => ipcRenderer.invoke('delete-invoice', id),

  // Expenses
  getExpensesByProject: (projectId: string) =>
    ipcRenderer.invoke('get-expenses-by-project', projectId),
  createExpense: (data: unknown) => ipcRenderer.invoke('create-expense', data),
  deleteExpense: (id: string) => ipcRenderer.invoke('delete-expense', id),

  // Timer
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  setTimerState: (state: unknown) => ipcRenderer.invoke('set-timer-state', state),
  startTimer: (projectId: string, description?: string) =>
    ipcRenderer.invoke('start-timer', projectId, description),
  pauseTimer: () => ipcRenderer.invoke('pause-timer'),
  resumeTimer: () => ipcRenderer.invoke('resume-timer'),
  stopTimer: () => ipcRenderer.invoke('stop-timer'),

  // Dialogs
  showSaveDialog: (options: {
    defaultPath?: string
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: {
    properties?: Array<'openFile' | 'openDirectory' | 'multiSelections'>
    filters?: Array<{ name: string; extensions: string[] }>
  }) => ipcRenderer.invoke('show-open-dialog', options),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openDirectory: (dirPath: string) => ipcRenderer.invoke('open-directory', dirPath),
  openApp: (appPath: string) => ipcRenderer.invoke('open-app', appPath),

  // Asset Vault
  createAsset: (data: {
    projectId: string
    name: string
    path: string
    type: 'folder' | 'file' | 'link'
  }) => ipcRenderer.invoke('create-asset', data),
  getAssetsByProject: (projectId: string) => ipcRenderer.invoke('get-assets-by-project', projectId),
  deleteAsset: (id: string) => ipcRenderer.invoke('delete-asset', id),
  openAsset: (path: string) => ipcRenderer.invoke('open-asset', path),

  // Project Notes
  updateProjectNotes: (id: string, notes: string) =>
    ipcRenderer.invoke('update-project-notes', id, notes),
  getProjectById: (id: string) => ipcRenderer.invoke('get-project-by-id', id),

  // Daily Reports
  saveDailyReport: (projectId: string, content: string, reportDate?: string) =>
    ipcRenderer.invoke('save-daily-report', projectId, content, reportDate),
  getDailyReports: (projectId: string) => ipcRenderer.invoke('get-daily-reports', projectId),
  deleteDailyReport: (id: string) => ipcRenderer.invoke('delete-daily-report', id),
  openDailyReportFile: (filePath: string) => ipcRenderer.invoke('open-daily-report-file', filePath),

  // Time Reports
  getTimeReport: (startDate: string, endDate: string) =>
    ipcRenderer.invoke('get-time-report', startDate, endDate),
  saveExportFile: (
    defaultPath: string,
    data: string | ArrayBuffer,
    filters?: Array<{ name: string; extensions: string[] }>
  ) => ipcRenderer.invoke('save-export-file', defaultPath, data, filters),

  // Ideas (Brainstorm)
  getIdeas: () => ipcRenderer.invoke('get-ideas'),
  createIdea: (data: unknown) => ipcRenderer.invoke('create-idea', data),
  updateIdea: (id: string, data: unknown) => ipcRenderer.invoke('update-idea', id, data),
  deleteIdea: (id: string) => ipcRenderer.invoke('delete-idea', id),
  promoteIdea: (id: string) => ipcRenderer.invoke('promote-idea', id),

  // M7 Notes
  getNotes: () => ipcRenderer.invoke('get-notes'),
  createNote: (data: unknown) => ipcRenderer.invoke('create-note', data),
  updateNote: (id: string, data: unknown) => ipcRenderer.invoke('update-note', id, data),
  deleteNote: (id: string) => ipcRenderer.invoke('delete-note', id),

  // M8 Tasks
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  createTask: (data: unknown) => ipcRenderer.invoke('create-task', data),
  updateTask: (id: string, data: unknown) => ipcRenderer.invoke('update-task', id, data),
  deleteTask: (id: string) => ipcRenderer.invoke('delete-task', id),

  // M8 Goals
  getGoals: () => ipcRenderer.invoke('get-goals'),
  createGoal: (data: unknown) => ipcRenderer.invoke('create-goal', data),
  updateGoal: (id: string, data: unknown) => ipcRenderer.invoke('update-goal', id, data),
  deleteGoal: (id: string) => ipcRenderer.invoke('delete-goal', id),

  // M8 Habits
  getHabits: () => ipcRenderer.invoke('get-habits'),
  createHabit: (data: unknown) => ipcRenderer.invoke('create-habit', data),
  updateHabit: (id: string, data: unknown) => ipcRenderer.invoke('update-habit', id, data),
  deleteHabit: (id: string) => ipcRenderer.invoke('delete-habit', id),
  toggleHabit: (id: string, date?: string) => ipcRenderer.invoke('toggle-habit', id, date),

  // M3 University
  getCourses: () => ipcRenderer.invoke('get-courses'),
  createCourse: (data: unknown) => ipcRenderer.invoke('create-course', data),
  updateCourse: (id: string, data: unknown) => ipcRenderer.invoke('update-course', id, data),
  deleteCourse: (id: string) => ipcRenderer.invoke('delete-course', id),
  getAssignments: (courseId?: string) => ipcRenderer.invoke('get-assignments', courseId),
  createAssignment: (data: unknown) => ipcRenderer.invoke('create-assignment', data),
  updateAssignment: (id: string, data: unknown) =>
    ipcRenderer.invoke('update-assignment', id, data),
  deleteAssignment: (id: string) => ipcRenderer.invoke('delete-assignment', id),
  getGpa: () => ipcRenderer.invoke('get-gpa'),

  // M5 Mood Journal
  getMoodEntries: () => ipcRenderer.invoke('get-mood-entries'),
  saveMoodEntry: (data: unknown) => ipcRenderer.invoke('save-mood-entry', data),
  deleteMoodEntry: (id: string) => ipcRenderer.invoke('delete-mood-entry', id),

  // M4 Health & Wellbeing
  getHealthEntries: () => ipcRenderer.invoke('get-health-entries'),
  saveHealthEntry: (data: unknown) => ipcRenderer.invoke('save-health-entry', data),
  deleteHealthEntry: (id: string) => ipcRenderer.invoke('delete-health-entry', id),
  getHealthStats: () => ipcRenderer.invoke('get-health-stats'),

  // M1/M2 Life dashboard + stats
  getLifeOverview: () => ipcRenderer.invoke('get-life-overview'),
  getLifeStats: (days?: number) => ipcRenderer.invoke('get-life-stats', days),

  // M11 Calendar, Reminders & Notifications
  getEvents: () => ipcRenderer.invoke('get-events'),
  createEvent: (data: unknown) => ipcRenderer.invoke('create-event', data),
  updateEvent: (id: string, data: unknown) => ipcRenderer.invoke('update-event', id, data),
  deleteEvent: (id: string) => ipcRenderer.invoke('delete-event', id),
  getCalendar: (startISO: string, endISO: string) =>
    ipcRenderer.invoke('get-calendar', startISO, endISO),
  getUpcoming: (days?: number) => ipcRenderer.invoke('get-upcoming', days),
  testNotification: () => ipcRenderer.invoke('test-notification'),

  // M10 AI Assistant
  aiStatus: () => ipcRenderer.invoke('ai-status'),
  aiChat: (messages: unknown, includeData?: boolean) =>
    ipcRenderer.invoke('ai-chat', messages, includeData),
  aiQuickAdd: (text: string) => ipcRenderer.invoke('ai-quick-add', text),
  aiWeeklySummary: () => ipcRenderer.invoke('ai-weekly-summary'),
  aiInsights: () => ipcRenderer.invoke('ai-insights'),

  // M13 Backup / restore & templates
  backupToFile: () => ipcRenderer.invoke('backup-to-file'),
  restoreFromFile: () => ipcRenderer.invoke('restore-from-file'),
  applyTemplate: (persona: string) => ipcRenderer.invoke('apply-template', persona),

  // M12 Encrypted backup + companion server
  backupToFileEncrypted: (passphrase: string) =>
    ipcRenderer.invoke('backup-to-file-encrypted', passphrase),
  restoreFromFileEncrypted: (passphrase: string) =>
    ipcRenderer.invoke('restore-from-file-encrypted', passphrase),
  backupAutoRunNow: () => ipcRenderer.invoke('backup-auto-run-now'),
  companionStatus: () => ipcRenderer.invoke('companion-status'),
  companionStart: (port?: number) => ipcRenderer.invoke('companion-start', port),
  companionStop: () => ipcRenderer.invoke('companion-stop'),

  // Floating Timer
  openFloatingTimer: () => ipcRenderer.invoke('open-floating-timer'),
  closeFloatingTimer: () => ipcRenderer.invoke('close-floating-timer'),
  isFloatingTimerOpen: () => ipcRenderer.invoke('is-floating-timer-open'),
  syncTimerToFloating: (timerState: unknown) =>
    ipcRenderer.send('sync-timer-to-floating', timerState),
  sendFloatingTimerAction: (action: string) => ipcRenderer.send('floating-timer-action', action),
  onTimerStateUpdate: (callback: (timerState: unknown) => void) => {
    ipcRenderer.on('timer-state-update', (_, timerState) => callback(timerState))
    return () => ipcRenderer.removeAllListeners('timer-state-update')
  },
  onFloatingTimerAction: (callback: (action: string) => void) => {
    ipcRenderer.on('floating-timer-action', (_, action) => callback(action))
    return () => ipcRenderer.removeAllListeners('floating-timer-action')
  },
  onFloatingTimerClosed: (callback: () => void) => {
    ipcRenderer.on('floating-timer-closed', () => callback())
    return () => ipcRenderer.removeAllListeners('floating-timer-closed')
  },

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getRevenueChart: (days: number) => ipcRenderer.invoke('get-revenue-chart', days),
  getRecentActivity: (limit: number) => ipcRenderer.invoke('get-recent-activity', limit),
  getMonthlyGoal: () => ipcRenderer.invoke('get-monthly-goal'),
  setMonthlyGoal: (amountCents: number) => ipcRenderer.invoke('set-monthly-goal', amountCents),

  // Clients
  getClients: () => ipcRenderer.invoke('get-clients'),
  getClientsWithBalances: () => ipcRenderer.invoke('get-clients-with-balances'),
  getClientById: (id: string) => ipcRenderer.invoke('get-client-by-id', id),
  createClient: (data: unknown) => ipcRenderer.invoke('create-client', data),
  updateClient: (id: string, data: unknown) => ipcRenderer.invoke('update-client', id, data),
  deleteClient: (id: string) => ipcRenderer.invoke('delete-client', id),
  getClientBalance: (clientId: string) => ipcRenderer.invoke('get-client-balance', clientId),
  getClientLedger: (clientId: string) => ipcRenderer.invoke('get-client-ledger', clientId),
  getProjectsByClient: (clientId: string) => ipcRenderer.invoke('get-projects-by-client', clientId),
  migrateClientNames: () => ipcRenderer.invoke('migrate-client-names'),

  // Payments
  getPaymentsByClient: (clientId: string) => ipcRenderer.invoke('get-payments-by-client', clientId),
  createPayment: (data: unknown) => ipcRenderer.invoke('create-payment', data),
  updatePayment: (id: string, data: unknown) => ipcRenderer.invoke('update-payment', id, data),
  deletePayment: (id: string) => ipcRenderer.invoke('delete-payment', id),
  getAllPayments: () => ipcRenderer.invoke('get-all-payments'),

  // Settings
  getAllSettings: () => ipcRenderer.invoke('get-all-settings'),
  getSetting: (key: string) => ipcRenderer.invoke('get-setting', key),
  setSetting: (key: string, value: string) => ipcRenderer.invoke('set-setting', key, value),
  setSettings: (settings: unknown) => ipcRenderer.invoke('set-settings', settings),

  // Data Export/Import
  exportDatabase: () => ipcRenderer.invoke('export-database'),
  importDatabase: (data: unknown) => ipcRenderer.invoke('import-database', data),

  // Screenshots (Phase 10)
  getScreenshotsByProject: (projectId: string) =>
    ipcRenderer.invoke('get-screenshots-by-project', projectId),
  deleteScreenshot: (id: string, deductTime: boolean = false) =>
    ipcRenderer.invoke('delete-screenshot', id, deductTime),
  captureScreenshotNow: () => ipcRenderer.invoke('capture-screenshot-now'),
  skipPendingCapture: () => ipcRenderer.invoke('skip-pending-capture'),
  getScreenshotImage: (filePath: string) => ipcRenderer.invoke('get-screenshot-image', filePath),
  onScreenshotCountdownStart: (callback: (data: { seconds: number }) => void) => {
    ipcRenderer.on('screenshot-countdown-start', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('screenshot-countdown-start')
  },
  onScreenshotCaptured: (callback: () => void) => {
    ipcRenderer.on('screenshot-captured', () => callback())
    return () => ipcRenderer.removeAllListeners('screenshot-captured')
  },
  onScreenshotCountdownCancelled: (callback: () => void) => {
    ipcRenderer.on('screenshot-countdown-cancelled', () => callback())
    return () => ipcRenderer.removeAllListeners('screenshot-countdown-cancelled')
  },

  // Focus Guard (Phase 9.5)
  focusConfirm: () => ipcRenderer.invoke('focus-confirm'),
  focusStop: () => ipcRenderer.invoke('focus-stop'),
  focusSwitch: () => ipcRenderer.invoke('focus-switch'),
  getFocusContext: () => ipcRenderer.invoke('get-focus-context'),
  onFocusAction: (callback: (action: 'stop' | 'switch') => void) => {
    ipcRenderer.on('focus-action', (_, action) => callback(action))
    return () => ipcRenderer.removeAllListeners('focus-action')
  },

  // Screenshot countdown (Phase 10 - Floating Window)
  screenshotSkip: () => ipcRenderer.invoke('screenshot-skip'),
  onScreenshotCountdown: (callback: (data: { seconds: number }) => void) => {
    ipcRenderer.on('update-countdown', (_, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('update-countdown')
  },

  // Screenshot export
  exportScreenshot: (filePath: string, destinationPath?: string) =>
    ipcRenderer.invoke('export-screenshot', filePath, destinationPath),
  exportAllScreenshots: (projectId: string) =>
    ipcRenderer.invoke('export-all-screenshots', projectId),

  // Timer state query for auto-reopen after screenshot
  onQueryTimerStateForReopen: (callback: () => void) => {
    ipcRenderer.on('query-timer-state-for-reopen', callback)
    return () => ipcRenderer.removeAllListeners('query-timer-state-for-reopen')
  },
  sendTimerStateForReopen: (isRunning: boolean) =>
    ipcRenderer.send('timer-state-response-for-reopen', isRunning),

  // App Launcher
  getLauncherApps: () => ipcRenderer.invoke('get-launcher-apps'),
  setLauncherApps: (apps: unknown) => ipcRenderer.invoke('set-launcher-apps', apps),

  // GitHub Integration
  githubGetRepoSummary: (githubUrl: string) =>
    ipcRenderer.invoke('github:get-repo-summary', githubUrl),
  githubCreateIssue: (taskId: string, projectId: string, title: string, notes: string | null) =>
    ipcRenderer.invoke('github:create-issue', taskId, projectId, title, notes),
  githubSyncIssues: (projectId: string) => ipcRenderer.invoke('github:sync-issues', projectId),

  // M15 — Project Hub (Terminal, Claude Code, Telegram, etc.)
  projectOpenTerminal: (path: string, terminal: string) =>
    ipcRenderer.invoke('project:open-terminal', path, terminal),
  projectRunOpencode: (path: string) => ipcRenderer.invoke('project:run-opencode', path),
  projectRunClaudeCode: (path: string, goal?: string) =>
    ipcRenderer.invoke('project:run-claude-code', path, goal),
  projectStopClaudeCode: () => ipcRenderer.invoke('project:stop-claude-code'),
  projectGetClaudeStatus: () => ipcRenderer.invoke('project:get-claude-status'),
  telegramSendMessage: (text: string) => ipcRenderer.invoke('telegram:send-message', text),
  telegramTestConnection: () => ipcRenderer.invoke('telegram:test-connection'),
  aiChatOllama: (model: string, messages: unknown[]) =>
    ipcRenderer.invoke('ai:chat-ollama', model, messages),
  aiChatOpenRouter: (model: string, messages: unknown[]) =>
    ipcRenderer.invoke('ai:chat-openrouter', model, messages),
  aiChatOpenAI: (baseUrl: string, model: string, messages: unknown[]) =>
    ipcRenderer.invoke('ai:chat-openai', baseUrl, model, messages),
  aiListOllamaModels: () => ipcRenderer.invoke('ai:list-ollama-models'),
  aiListOpenRouterModels: () => ipcRenderer.invoke('ai:list-openrouter-models')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
