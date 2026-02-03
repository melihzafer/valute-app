// src/main/services/ScreenshotService.ts
// Screenshot capture, scheduling, and CRUD operations (Phase 10)

import { desktopCapturer, app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db'
import { screenshots, logs } from '../db/schema'
import type { ScreenshotIPC } from '../../shared/types'
import * as SettingsService from './SettingsService'
import { triggerCaptureFlash } from '../index'

// Timer state for scheduling
let captureTimer: NodeJS.Timeout | null = null
let countdownTimer: NodeJS.Timeout | null = null
let pendingCapture: { projectId: string; logId: string | null } | null = null
let mainWindowRef: BrowserWindow | null = null
let showCountdownWindowCallback: ((seconds: number) => void) | null = null

// Set the main window reference (called from index.ts)
export function setMainWindow(window: BrowserWindow | null): void {
  mainWindowRef = window
}

// Set the callback for showing countdown window
export function setShowCountdownWindowCallback(callback: (seconds: number) => void): void {
  showCountdownWindowCallback = callback
}

// Get the screenshots directory path
export function getScreenshotsDir(): string {
  return path.join(app.getPath('userData'), 'screenshots')
}

// Capture the screen and save to file
export async function captureScreen(projectId: string, logId: string | null = null): Promise<ScreenshotIPC> {
  const db = getDb()

  // Get blur settings
  const settings = await SettingsService.getAllSettings()
  const blurIntensity = settings.screenshot.blurIntensity

  // Get screen sources
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  })

  if (sources.length === 0) {
    throw new Error('No screen sources available')
  }

  const primaryScreen = sources[0]
  const image = primaryScreen.thumbnail
  
  let pngBuffer: Buffer

  // Apply blur if needed
  if (blurIntensity === 'low' || blurIntensity === 'high') {
    // Convert to bitmap and apply blur using canvas
    const size = image.getSize()
    const bitmap = image.toBitmap()
    
    // Create canvas to manipulate image
    const { createCanvas } = require('canvas')
    const canvas = createCanvas(size.width, size.height)
    const ctx = canvas.getContext('2d')
    
    // Create ImageData from bitmap
    const imageData = ctx.createImageData(size.width, size.height)
    imageData.data.set(bitmap)
    ctx.putImageData(imageData, 0, 0)
    
    // Apply blur filter
    const blurAmount = blurIntensity === 'low' ? 8 : 20
    ctx.filter = `blur(${blurAmount}px)`
    ctx.drawImage(canvas, 0, 0)
    
    // Convert back to PNG
    pngBuffer = canvas.toBuffer('image/png')
  } else {
    // No blur - use original image
    pngBuffer = image.toPNG()
  }

  // Create directory structure
  const projectDir = path.join(getScreenshotsDir(), projectId)
  await fs.promises.mkdir(projectDir, { recursive: true })

  // Generate filename with timestamp
  const timestamp = new Date()
  const filename = `${timestamp.getTime()}.png`
  const filePath = path.join(projectDir, filename)

  // Write the file
  await fs.promises.writeFile(filePath, pngBuffer)

  // Create database record
  const id = uuidv4()
  const now = new Date()

  await db.insert(screenshots).values({
    id,
    projectId,
    logId,
    filePath,
    timestamp,
    createdAt: now
  })

  // Trigger flash effect
  triggerCaptureFlash()

  return {
    id,
    projectId,
    logId,
    filePath,
    timestamp: timestamp.toISOString(),
    createdAt: now.toISOString()
  }
}

// Get all screenshots for a project
export async function getScreenshotsByProject(projectId: string): Promise<ScreenshotIPC[]> {
  const db = getDb()

  const results = await db
    .select()
    .from(screenshots)
    .where(eq(screenshots.projectId, projectId))
    .orderBy(desc(screenshots.timestamp))

  return results.map((ss) => ({
    id: ss.id,
    projectId: ss.projectId,
    logId: ss.logId,
    filePath: ss.filePath,
    timestamp: ss.timestamp.toISOString(),
    createdAt: ss.createdAt?.toISOString() || new Date().toISOString()
  }))
}

// Delete a screenshot with optional time deduction
export async function deleteScreenshot(id: string, deductTime: boolean = false): Promise<void> {
  const db = getDb()

  // Get the screenshot record
  const [screenshot] = await db.select().from(screenshots).where(eq(screenshots.id, id))

  if (!screenshot) {
    throw new Error('Screenshot not found')
  }

  // Delete the file if it exists
  try {
    await fs.promises.unlink(screenshot.filePath)
  } catch (err) {
    // File might already be deleted, continue
    console.warn('Could not delete screenshot file:', err)
  }

  // Deduct time from associated log if requested
  if (deductTime && screenshot.logId) {
    const settings = await SettingsService.getAllSettings()
    const deductionSeconds = settings.screenshot.frequency * 60 // Convert minutes to seconds

    const [log] = await db.select().from(logs).where(eq(logs.id, screenshot.logId))

    if (log && log.duration) {
      const newDuration = Math.max(0, log.duration - deductionSeconds)
      await db.update(logs).set({ duration: newDuration }).where(eq(logs.id, screenshot.logId))
    }
  }

  // Delete the database record
  await db.delete(screenshots).where(eq(screenshots.id, id))
}

// Read screenshot image as base64
export async function getScreenshotImage(filePath: string): Promise<string> {
  try {
    const buffer = await fs.promises.readFile(filePath)
    return buffer.toString('base64')
  } catch (err) {
    throw new Error('Failed to read screenshot file')
  }
}

// Schedule the next screenshot capture
export async function scheduleNextCapture(projectId: string, logId: string | null): Promise<void> {
  cancelScheduledCapture()

  const settings = await SettingsService.getAllSettings()

  if (!settings.screenshot.enabled) {
    return
  }

  const frequencyMs = settings.screenshot.frequency * 60 * 1000
  const notify = settings.screenshot.notifyBeforeCapture
  const countdownMs = 10000 // 10 seconds countdown

  // Calculate delay accounting for countdown time
  const delay = notify ? Math.max(0, frequencyMs - countdownMs) : frequencyMs

  captureTimer = setTimeout(async () => {
    if (notify) {
      // Show floating countdown window instead of sending IPC to main window
      if (showCountdownWindowCallback) {
        showCountdownWindowCallback(10)
      }
      pendingCapture = { projectId, logId }

      countdownTimer = setTimeout(async () => {
        if (pendingCapture) {
          // Capture the pending capture info before the nested setTimeout
          const captureInfo = pendingCapture

          // Wait for countdown window to close and clear from screen
          // Countdown window closes after 1500ms, add extra 500ms buffer = 2000ms total
          setTimeout(async () => {
            try {
              await captureScreen(captureInfo.projectId, captureInfo.logId)
              // Notify main window that capture is complete
              if (mainWindowRef && !mainWindowRef.isDestroyed()) {
                mainWindowRef.webContents.send('screenshot-captured')
              }
              // Also notify for timer reopen
              ipcMain.emit('screenshot-captured-complete')
            } catch (err) {
              console.error('Screenshot capture failed:', err)
            }
            pendingCapture = null
            // Schedule next capture
            scheduleNextCapture(captureInfo.projectId, captureInfo.logId)
          }, 2000) // 2-second delay after countdown completes
        }
      }, countdownMs)
    } else {
      // Silent capture
      try {
        await captureScreen(projectId, logId)
        if (mainWindowRef && !mainWindowRef.isDestroyed()) {
          mainWindowRef.webContents.send('screenshot-captured')
        }
        // Also notify for timer reopen
        ipcMain.emit('screenshot-captured-complete')
      } catch (err) {
        console.error('Screenshot capture failed:', err)
      }
      // Schedule next capture
      scheduleNextCapture(projectId, logId)
    }
  }, delay)
}

// Cancel any scheduled capture
export function cancelScheduledCapture(): void {
  if (captureTimer) {
    clearTimeout(captureTimer)
    captureTimer = null
  }
  if (countdownTimer) {
    clearTimeout(countdownTimer)
    countdownTimer = null
  }
  pendingCapture = null
}

// Skip the pending capture (user clicked Skip)
export function skipPendingCapture(): void {
  if (countdownTimer) {
    clearTimeout(countdownTimer)
    countdownTimer = null
  }

  const captureInfo = pendingCapture
  pendingCapture = null

  // Reschedule for next interval
  if (captureInfo) {
    scheduleNextCapture(captureInfo.projectId, captureInfo.logId)
  }
}

// Check if there's a pending capture
export function hasPendingCapture(): boolean {
  return pendingCapture !== null
}

// Export single screenshot
export async function exportScreenshot(filePath: string, destinationPath?: string): Promise<string> {
  let exportPath = destinationPath

  if (!exportPath) {
    const result = await dialog.showSaveDialog({
      defaultPath: path.basename(filePath),
      filters: [{ name: 'PNG Image', extensions: ['png'] }]
    })

    if (result.canceled || !result.filePath) {
      throw new Error('Export canceled')
    }
    exportPath = result.filePath
  }

  await fs.promises.copyFile(filePath, exportPath)
  return exportPath
}

// Export all screenshots for a project
export async function exportAllScreenshots(projectId: string): Promise<{ count: number; folder: string }> {
  const db = getDb()

  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Export Folder'
  })

  if (result.canceled || result.filePaths.length === 0) {
    throw new Error('Export canceled')
  }

  const exportFolder = result.filePaths[0]

  const projectScreenshots = await db
    .select()
    .from(screenshots)
    .where(eq(screenshots.projectId, projectId))
    .orderBy(screenshots.timestamp)

  let count = 0
  for (const ss of projectScreenshots) {
    const timestamp = new Date(ss.timestamp).getTime()
    const filename = `screenshot_${timestamp}.png`
    const exportPath = path.join(exportFolder, filename)

    await fs.promises.copyFile(ss.filePath, exportPath)
    count++
  }

  return { count, folder: exportFolder }
}
