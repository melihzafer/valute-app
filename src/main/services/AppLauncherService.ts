// src/main/services/AppLauncherService.ts
// User-configurable one-click app launcher storage

import { shell } from 'electron'
import { getDb } from '../db/index'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { LauncherApp } from '../../shared/types'

const APPS_KEY = 'launcher.apps'

export async function getApps(): Promise<LauncherApp[]> {
  const db = getDb()
  const row = db.select().from(settings).where(eq(settings.key, APPS_KEY)).get()
  if (!row?.value) return []
  try {
    const parsed = JSON.parse(row.value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // ignore invalid JSON
  }
  return []
}

export async function setApps(apps: LauncherApp[]): Promise<void> {
  const db = getDb()
  const value = JSON.stringify(apps)
  const existing = db.select().from(settings).where(eq(settings.key, APPS_KEY)).get()

  if (existing) {
    db.update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, APPS_KEY))
      .run()
  } else {
    db.insert(settings).values({ key: APPS_KEY, value, updatedAt: new Date() }).run()
  }
}

export async function addApp(app: Omit<LauncherApp, 'id'>): Promise<LauncherApp> {
  const apps = await getApps()
  const newApp: LauncherApp = { id: crypto.randomUUID(), ...app }
  await setApps([...apps, newApp])
  return newApp
}

export async function removeApp(id: string): Promise<void> {
  const apps = await getApps()
  await setApps(apps.filter((a) => a.id !== id))
}

export async function openApp(path: string): Promise<IPCResponse<void>> {
  try {
    const result = await shell.openPath(path)
    if (result) {
      return { success: false, error: result }
    }
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to open app'
    return { success: false, error: message }
  }
}

export async function openDirectory(path: string): Promise<IPCResponse<void>> {
  try {
    const result = await shell.openPath(path)
    if (result) {
      return { success: false, error: result }
    }
    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to open directory'
    return { success: false, error: message }
  }
}

// Re-use shared IPCResponse shape locally
interface IPCResponse<T> {
  success: boolean
  data?: T
  error?: string
}
