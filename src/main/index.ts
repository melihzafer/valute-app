// src/main/index.ts

import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { setupIpcHandlers } from './handlers'
import { initializeDatabase, closeDatabase } from './db/index'

let mainWindow: BrowserWindow | null = null
let floatingTimerWindow: BrowserWindow | null = null

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
