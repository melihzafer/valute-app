// src/main/services/BackupService.ts
// M13 — full, lossless backup & restore covering EVERY table (work + life-OS).
// Works at the raw-SQLite level so it stays correct as the schema grows.

import { app, dialog } from 'electron'
import * as fs from 'fs'
import * as crypto from 'crypto'
import { getRawDb } from '../db/index'

export interface FullBackup {
  app: string
  version: string
  exportedAt: string
  tables: Record<string, Record<string, unknown>[]>
}

function listTables(): string[] {
  const db = getRawDb()
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[]
  return rows.map((r) => r.name)
}

/** Build an in-memory backup of every table (raw primitive values, JSON-safe). */
export function createBackup(): FullBackup {
  const db = getRawDb()
  const tables: Record<string, Record<string, unknown>[]> = {}
  for (const name of listTables()) {
    tables[name] = db.prepare(`SELECT * FROM "${name}"`).all() as Record<string, unknown>[]
  }
  return {
    app: 'valute',
    version: app.getVersion(),
    exportedAt: new Date().toISOString(),
    tables
  }
}

/** Restore a backup, replacing all current data. Returns per-table row counts. */
export function restoreBackup(backup: FullBackup): Record<string, number> {
  if (!backup || typeof backup !== 'object' || !backup.tables) {
    throw new Error('Invalid backup file.')
  }
  const db = getRawDb()
  const existing = new Set(listTables())
  const counts: Record<string, number> = {}

  db.pragma('foreign_keys = OFF')
  const tx = db.transaction(() => {
    // Clear every existing table first.
    for (const name of existing) db.prepare(`DELETE FROM "${name}"`).run()

    for (const [name, rows] of Object.entries(backup.tables)) {
      if (!existing.has(name) || !Array.isArray(rows) || rows.length === 0) {
        counts[name] = 0
        continue
      }
      // Only restore columns that still exist in the current schema.
      const cols = (db.prepare(`PRAGMA table_info("${name}")`).all() as { name: string }[]).map(
        (c) => c.name
      )
      let n = 0
      for (const row of rows) {
        const keys = Object.keys(row).filter((k) => cols.includes(k))
        if (keys.length === 0) continue
        const placeholders = keys.map(() => '?').join(', ')
        const sql = `INSERT INTO "${name}" (${keys.map((k) => `"${k}"`).join(', ')}) VALUES (${placeholders})`
        db.prepare(sql).run(...keys.map((k) => normalize((row as any)[k])))
        n++
      }
      counts[name] = n
    }
  })
  try {
    tx()
  } finally {
    db.pragma('foreign_keys = ON')
  }
  return counts
}

// SQLite can only bind primitives — coerce booleans and stray objects.
function normalize(v: unknown): string | number | bigint | Buffer | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'object') return JSON.stringify(v)
  return v as string | number
}

/** Show a save dialog and write a backup file. Returns the path, or null if cancelled. */
export async function backupToFile(): Promise<string | null> {
  const stamp = new Date().toISOString().slice(0, 10)
  const result = await dialog.showSaveDialog({
    title: 'Save Valute backup',
    defaultPath: `valute-backup-${stamp}.json`,
    filters: [{ name: 'Valute Backup', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return null
  const backup = createBackup()
  fs.writeFileSync(result.filePath, JSON.stringify(backup, null, 2), 'utf-8')
  return result.filePath
}

/** Show an open dialog, read a backup file and restore it. Returns counts, or null if cancelled. */
export async function restoreFromFile(): Promise<Record<string, number> | null> {
  const result = await dialog.showOpenDialog({
    title: 'Restore Valute backup',
    properties: ['openFile'],
    filters: [{ name: 'Valute Backup', extensions: ['json'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
  const backup = JSON.parse(raw) as FullBackup
  return restoreBackup(backup)
}

// ---------------------------------------------------------------------------
// Encrypted backups (M12) — AES-256-GCM with a scrypt-derived key.
// The resulting file can be safely placed on any cloud drive for "optional
// sync"; only someone with the passphrase can read it.
// ---------------------------------------------------------------------------

interface EncryptedEnvelope {
  app: 'valute'
  enc: 'aes-256-gcm'
  kdf: 'scrypt'
  salt: string
  iv: string
  tag: string
  data: string
}

function encrypt(plaintext: string, passphrase: string): EncryptedEnvelope {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = crypto.scryptSync(passphrase, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    app: 'valute',
    enc: 'aes-256-gcm',
    kdf: 'scrypt',
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64')
  }
}

function decrypt(env: EncryptedEnvelope, passphrase: string): string {
  const salt = Buffer.from(env.salt, 'base64')
  const iv = Buffer.from(env.iv, 'base64')
  const tag = Buffer.from(env.tag, 'base64')
  const key = crypto.scryptSync(passphrase, salt, 32)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([
    decipher.update(Buffer.from(env.data, 'base64')),
    decipher.final()
  ]).toString('utf-8')
}

/** Save an encrypted backup. Returns the path, or null if cancelled. */
export async function backupToFileEncrypted(passphrase: string): Promise<string | null> {
  if (!passphrase || passphrase.length < 4)
    throw new Error('Passphrase must be at least 4 characters.')
  const stamp = new Date().toISOString().slice(0, 10)
  const result = await dialog.showSaveDialog({
    title: 'Save encrypted Valute backup',
    defaultPath: `valute-backup-${stamp}.vbackup`,
    filters: [{ name: 'Encrypted Valute Backup', extensions: ['vbackup'] }]
  })
  if (result.canceled || !result.filePath) return null
  const envelope = encrypt(JSON.stringify(createBackup()), passphrase)
  fs.writeFileSync(result.filePath, JSON.stringify(envelope), 'utf-8')
  return result.filePath
}

/** Restore from an encrypted backup. Returns counts, or null if cancelled. Throws on wrong passphrase. */
export async function restoreFromFileEncrypted(
  passphrase: string
): Promise<Record<string, number> | null> {
  const result = await dialog.showOpenDialog({
    title: 'Restore encrypted Valute backup',
    properties: ['openFile'],
    filters: [{ name: 'Encrypted Valute Backup', extensions: ['vbackup'] }]
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const env = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8')) as EncryptedEnvelope
  let plaintext: string
  try {
    plaintext = decrypt(env, passphrase)
  } catch {
    throw new Error('Could not decrypt — wrong passphrase or corrupted file.')
  }
  return restoreBackup(JSON.parse(plaintext) as FullBackup)
}
