// src/main/services/SettingsService.ts
// Settings service using key-value store pattern

import { eq } from 'drizzle-orm'
import { getDb } from '../db/index'
import { settings } from '../db/schema'
import type { AppSettings } from '../../shared/types'
import { DEFAULT_SETTINGS } from '../../shared/types'

/**
 * Get a single setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const db = getDb()
  const result = db.select().from(settings).where(eq(settings.key, key)).get()
  return result?.value ?? null
}

/**
 * Set a single setting (upsert pattern)
 */
export async function setSetting(key: string, value: string): Promise<void> {
  const db = getDb()
  const existing = db.select().from(settings).where(eq(settings.key, key)).get()

  if (existing) {
    db.update(settings)
      .set({ value, updatedAt: new Date() })
      .where(eq(settings.key, key))
      .run()
  } else {
    db.insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .run()
  }
}

/**
 * Get all settings as AppSettings object
 * Returns defaults merged with stored values
 */
export async function getAllSettings(): Promise<AppSettings> {
  const db = getDb()
  const allSettings = db.select().from(settings).all()

  // Start with defaults and overlay stored values
  const result: AppSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))

  for (const setting of allSettings) {
    try {
      const parsedValue = JSON.parse(setting.value || 'null')

      if (setting.key.startsWith('general.')) {
        const subKey = setting.key.replace('general.', '') as keyof typeof result.general
        if (subKey in result.general && parsedValue !== null) {
          ;(result.general as any)[subKey] = parsedValue
        }
      } else if (setting.key.startsWith('focus.')) {
        const subKey = setting.key.replace('focus.', '') as keyof typeof result.focus
        if (subKey in result.focus && parsedValue !== null) {
          ;(result.focus as any)[subKey] = parsedValue
        }
      } else if (setting.key.startsWith('screenshot.')) {
        const subKey = setting.key.replace('screenshot.', '') as keyof typeof result.screenshot
        if (subKey in result.screenshot && parsedValue !== null) {
          ;(result.screenshot as any)[subKey] = parsedValue
        }
      }
    } catch (e) {
      // Skip invalid JSON values
      console.warn(`Invalid JSON for setting ${setting.key}:`, e)
    }
  }

  return result
}

/**
 * Set multiple settings at once
 */
export async function setSettings(settingsObj: Partial<AppSettings>): Promise<void> {
  if (settingsObj.general) {
    for (const [key, value] of Object.entries(settingsObj.general)) {
      if (value !== undefined) {
        await setSetting(`general.${key}`, JSON.stringify(value))
      }
    }
  }

  if (settingsObj.focus) {
    for (const [key, value] of Object.entries(settingsObj.focus)) {
      if (value !== undefined) {
        await setSetting(`focus.${key}`, JSON.stringify(value))
      }
    }
  }

  if (settingsObj.screenshot) {
    for (const [key, value] of Object.entries(settingsObj.screenshot)) {
      if (value !== undefined) {
        await setSetting(`screenshot.${key}`, JSON.stringify(value))
      }
    }
  }
}

/**
 * Delete a setting
 */
export async function deleteSetting(key: string): Promise<void> {
  const db = getDb()
  db.delete(settings).where(eq(settings.key, key)).run()
}

/**
 * Reset all settings to defaults
 */
export async function resetSettings(): Promise<void> {
  const db = getDb()

  // Delete all settings that start with general., focus., or screenshot.
  const allSettings = db.select().from(settings).all()
  for (const setting of allSettings) {
    if (setting.key.startsWith('general.') || setting.key.startsWith('focus.') || setting.key.startsWith('screenshot.')) {
      db.delete(settings).where(eq(settings.key, setting.key)).run()
    }
  }
}
