// src/main/index.ts

import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
// import icon from '../../resources/icon.png?asset' // Placeholder for icon
import { setupIpcHandlers } from './handlers'
import { initializeDatabase, closeDatabase } from './db/index'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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

app.whenReady().then(() => {
  // Initialize the database first
  try {
    initializeDatabase()
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database initialization failed:', err)
    app.quit()
    return
  }

  setupIpcHandlers() // Setup IPC handlers after DB is ready

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

