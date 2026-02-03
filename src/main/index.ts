// src/main/index.ts

import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { setupIpcHandlers } from './handlers'
import { initializeDatabase, closeDatabase } from './db/index'
import * as FocusGuardService from './services/FocusGuardService'
import * as ScreenshotService from './services/ScreenshotService'

let mainWindow: BrowserWindow | null = null
let floatingTimerWindow: BrowserWindow | null = null
let focusWindow: BrowserWindow | null = null
let screenshotCountdownWindow: BrowserWindow | null = null
let flashWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    icon, // Set icon for Windows/Linux
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Maximize the window instead of fullscreen
  mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Set the main window reference for screenshot service
    ScreenshotService.setMainWindow(mainWindow)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load the index.html of the electron-vite window
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createFloatingTimerWindow(): BrowserWindow {
  if (floatingTimerWindow && !floatingTimerWindow.isDestroyed()) {
    floatingTimerWindow.focus()
    return floatingTimerWindow
  }

  floatingTimerWindow = new BrowserWindow({
    width: 300,
    height: 180,
    minWidth: 250,
    minHeight: 150,
    maxWidth: 400,
    maxHeight: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    show: false,
    icon, // Set icon for floating window
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Position in bottom-right corner
  const { screen } = require('electron')
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  floatingTimerWindow.setPosition(width - 320, height - 200)

  floatingTimerWindow.on('ready-to-show', () => {
    floatingTimerWindow?.show()
    // The floating window will request initial state via get-timer-state on mount
    // No need to send it here - avoids race conditions
  })

  floatingTimerWindow.on('closed', () => {
    floatingTimerWindow = null
    // Notify main window that floating timer was closed
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('floating-timer-closed')
    }
  })

  // Load the floating timer route
  if (process.env.ELECTRON_RENDERER_URL) {
    floatingTimerWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/floating-timer`)
  } else {
    floatingTimerWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/floating-timer'
    })
  }

  return floatingTimerWindow
}

function createFocusWindow(): BrowserWindow {
  if (focusWindow && !focusWindow.isDestroyed()) {
    focusWindow.focus()
    return focusWindow
  }

  focusWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    center: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  focusWindow.on('ready-to-show', () => {
    focusWindow?.show()
    focusWindow?.focus()
  })

  focusWindow.on('closed', () => {
    focusWindow = null
  })

  // Load the focus nudge route
  if (process.env.ELECTRON_RENDERER_URL) {
    focusWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/focus-nudge`)
  } else {
    focusWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/focus-nudge'
    })
  }

  return focusWindow
}

function hideFocusWindow(): void {
  if (focusWindow && !focusWindow.isDestroyed()) {
    focusWindow.close()
    focusWindow = null
  }
}

function createScreenshotCountdownWindow(seconds: number): BrowserWindow {
  if (screenshotCountdownWindow && !screenshotCountdownWindow.isDestroyed()) {
    screenshotCountdownWindow.focus()
    // Update countdown time
    screenshotCountdownWindow.webContents.send('update-countdown', { seconds })
    return screenshotCountdownWindow
  }

  screenshotCountdownWindow = new BrowserWindow({
    width: 420,
    height: 260,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // Position in top-right corner
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  screenshotCountdownWindow.setPosition(width - 440, 20)

  screenshotCountdownWindow.on('ready-to-show', () => {
    screenshotCountdownWindow?.show()
    screenshotCountdownWindow?.focus()
    if (screenshotCountdownWindow && !screenshotCountdownWindow.isDestroyed()) {
      screenshotCountdownWindow.webContents.send('update-countdown', { seconds })
    }
  })

  screenshotCountdownWindow.on('closed', () => {
    screenshotCountdownWindow = null
  })

  // Load the screenshot countdown route
  if (process.env.ELECTRON_RENDERER_URL) {
    screenshotCountdownWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/screenshot-countdown`)
  } else {
    screenshotCountdownWindow.loadFile(join(__dirname, '../renderer/index.html'), {
      hash: '/screenshot-countdown'
    })
  }

  return screenshotCountdownWindow
}

function hideScreenshotCountdownWindow(): void {
  if (screenshotCountdownWindow && !screenshotCountdownWindow.isDestroyed()) {
    screenshotCountdownWindow.close()
    screenshotCountdownWindow = null
  }
}

function showCaptureFlash(): void {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.bounds

  flashWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // Softer flash with reduced opacity and gray color
  flashWindow.loadURL(
    `data:text/html,<html><body style="margin:0;padding:0;background:rgba(220,220,220,0.35);animation:fadeOut 0.3s ease-out forwards;"><style>@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }</style></body></html>`
  )

  // Auto-close after animation
  setTimeout(() => {
    if (flashWindow && !flashWindow.isDestroyed()) {
      flashWindow.close()
      flashWindow = null
    }
  }, 300)
}

export function triggerCaptureFlash(): void {
  showCaptureFlash()
}

function setupFloatingTimerHandlers(): void {
  ipcMain.handle('open-floating-timer', () => {
    createFloatingTimerWindow()
    return { success: true }
  })

  ipcMain.handle('close-floating-timer', () => {
    if (floatingTimerWindow && !floatingTimerWindow.isDestroyed()) {
      floatingTimerWindow.close()
      floatingTimerWindow = null
    }
    return { success: true }
  })

  ipcMain.handle('is-floating-timer-open', () => {
    return {
      success: true,
      data: floatingTimerWindow !== null && !floatingTimerWindow.isDestroyed()
    }
  })

  // Sync timer state to floating window
  ipcMain.on('sync-timer-to-floating', (_, timerState) => {
    if (floatingTimerWindow && !floatingTimerWindow.isDestroyed()) {
      floatingTimerWindow.webContents.send('timer-state-update', timerState)
    }
  })

  // Sync timer actions from floating window to main
  ipcMain.on('floating-timer-action', (_, action) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('floating-timer-action', action)
    }
  })
}

function setupFocusWindowHandlers(): void {
  // Set the callback for showing focus window
  FocusGuardService.setShowFocusWindowCallback(() => {
    createFocusWindow()
  })

  ipcMain.handle('focus-confirm', () => {
    FocusGuardService.confirmFocus()
    hideFocusWindow()
    return { success: true }
  })

  ipcMain.handle('focus-stop', async () => {
    hideFocusWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('focus-action', 'stop')
    }
    return { success: true }
  })

  ipcMain.handle('focus-switch', async () => {
    hideFocusWindow()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('focus-action', 'switch')
      mainWindow.show()
      mainWindow.focus()
    }
    return { success: true }
  })

  ipcMain.handle('get-focus-context', () => {
    return { success: true, data: FocusGuardService.getContext() }
  })
}

function setupScreenshotCountdownHandlers(): void {
  // Set the callback for showing countdown window
  ScreenshotService.setShowCountdownWindowCallback((seconds) => {
    createScreenshotCountdownWindow(seconds)
  })

  ipcMain.handle('screenshot-skip', () => {
    ScreenshotService.skipPendingCapture()
    hideScreenshotCountdownWindow()
    return { success: true }
  })

  // Listen for screenshot-captured event and reopen timer window
  ipcMain.on('screenshot-captured-complete', () => {
    // Only reopen timer if it was previously open or if timer is running
    if (floatingTimerWindow === null || floatingTimerWindow.isDestroyed()) {
      // Check if timer is running by querying main window
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('query-timer-state-for-reopen')
      }
    }
  })

  // Handle response from main window about timer state
  ipcMain.on('timer-state-response-for-reopen', (_, isRunning) => {
    if (isRunning) {
      createFloatingTimerWindow()
    }
  })
}

// Export helper function to broadcast timer state to floating window
export function broadcastTimerStateToFloating(timerState: unknown): void {
  if (floatingTimerWindow && !floatingTimerWindow.isDestroyed()) {
    floatingTimerWindow.webContents.send('timer-state-update', timerState)
  }
}

app.whenReady().then(async () => {
  // Initialize the database first
  try {
    await initializeDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database initialization failed:', err)
    app.quit()
    return
  }

  setupIpcHandlers() // Setup IPC handlers after DB is ready
  setupFloatingTimerHandlers() // Setup floating timer handlers
  setupFocusWindowHandlers() // Setup focus window handlers
  setupScreenshotCountdownHandlers() // Setup screenshot countdown handlers

  // Set app user model id for windows
  if (process.platform === 'win32') {
    app.setAppUserModelId(process.env.npm_package_build_appId || 'com.example.vault')
  }

  createWindow()

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase() // Clean up database connection
    app.quit()
  }
})

// Clean up on app quit
app.on('before-quit', () => {
  closeDatabase()
})
