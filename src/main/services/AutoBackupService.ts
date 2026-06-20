// src/main/services/AutoBackupService.ts
// Q4 (GROWTH_IDEAS) — scheduled auto-backup. BackupService.createBackup() zaten
// tüm tabloları dump ediyor; bu servis onu periyodik olarak diske yazar.
// NotificationService ile aynı tick pattern'i. Manuel backup (dialog'lu) ayrı.

import { app, Notification } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { createBackup } from './BackupService'
import { getSetting, setSetting } from './SettingsService'

let tickInterval: NodeJS.Timeout | null = null

interface AutoBackupSettings {
  enabled: boolean
  intervalDays: number
  folder: string // boşsa userData/backups
}

async function readSettings(): Promise<AutoBackupSettings> {
  const parse = async (key: string, fallback: unknown): Promise<unknown> => {
    try {
      const raw = await getSetting(key)
      return raw == null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  }
  return {
    enabled: (await parse('backup.autoEnabled', false)) as boolean,
    intervalDays: (await parse('backup.intervalDays', 7)) as number,
    folder: (await parse('backup.folder', '')) as string
  }
}

function resolveFolder(folder: string): string {
  return folder && folder.trim() ? folder : path.join(app.getPath('userData'), 'backups')
}

function notify(title: string, body: string): void {
  if (!Notification.isSupported()) return
  try {
    new Notification({ title, body }).show()
  } catch (err) {
    console.error('[AutoBackup] notification failed:', err)
  }
}

/**
 * Bir backup dosyası yazar (dialog yok). lastRun'i günceller ve bildirir.
 * Hem periyodik tick hem de manuel "şimdi yedekle" için kullanılır.
 * Yazılan dosyanın yolunu döner; hata olursa throw.
 */
export async function runAutoBackupNow(): Promise<string> {
  const settings = await readSettings()
  const folder = resolveFolder(settings.folder)
  fs.mkdirSync(folder, { recursive: true })

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const filePath = path.join(folder, `valute-backup-${stamp}.json`)
  const backup = createBackup()
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf-8')

  await setSetting('backup.lastRun', JSON.stringify(new Date().toISOString()))

  // Eski otomatik backup'ları temizle — son 20'yi tut (manuel .vbackup'lara dokunmaz).
  try {
    pruneOldBackups(folder)
  } catch (err) {
    console.warn('[AutoBackup] prune failed:', err)
  }

  notify('Valute backup saved', filePath)
  return filePath
}

/** Klasördeki valute-backup-*.json dosyalarından en yeni N tanesini tutar. */
function pruneOldBackups(folder: string, keep = 20): void {
  const entries = fs
    .readdirSync(folder)
    .filter((f) => f.startsWith('valute-backup-') && f.endsWith('.json'))
    .map((f) => ({ f, mtime: fs.statSync(path.join(folder, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  for (const entry of entries.slice(keep)) {
    fs.unlinkSync(path.join(folder, entry.f))
  }
}

async function tick(): Promise<void> {
  let settings: AutoBackupSettings
  try {
    settings = await readSettings()
  } catch {
    return
  }
  if (!settings.enabled) return

  // Son çalıştırmadan bu yana yeterli gün geçti mi?
  let lastRunMs = 0
  try {
    const raw = await getSetting('backup.lastRun')
    if (raw) lastRunMs = new Date(JSON.parse(raw)).getTime()
  } catch {
    /* hiç çalışmamış — lastRunMs = 0 */
  }

  const intervalMs = Math.max(1, settings.intervalDays) * 24 * 60 * 60 * 1000
  if (Date.now() - lastRunMs < intervalMs) return

  try {
    await runAutoBackupNow()
  } catch (err) {
    console.error('[AutoBackup] scheduled run failed:', err)
    notify('Valute auto-backup failed', err instanceof Error ? err.message : String(err))
  }
}

/** Uygulama açılışında çağrılır. İlk kontrol 30s sonra, sonra her 10dk. */
export function startAutoBackupService(): void {
  if (tickInterval) clearInterval(tickInterval)
  setTimeout(() => void tick(), 30_000)
  tickInterval = setInterval(() => void tick(), 10 * 60 * 1000)
}

export function stopAutoBackupService(): void {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}
