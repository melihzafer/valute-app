// src/renderer/src/components/DataSyncSection.tsx
// M12 — encrypted backup + LAN companion controls for the Settings → Data tab.

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { toast } from '../store/useToastStore'
import type { CompanionStatus } from '../../../shared/types'
import { Lock, Smartphone, Wifi, WifiOff, Copy, DatabaseBackup } from 'lucide-react'

const DataSyncSection: React.FC = () => {
  const [pass, setPass] = useState('')
  const [companion, setCompanion] = useState<CompanionStatus | null>(null)
  const [busy, setBusy] = useState(false)

  // Q4 — auto-backup config (local draft + explicit Save, Settings pattern)
  const [autoEnabled, setAutoEnabled] = useState(false)
  const [intervalDays, setIntervalDays] = useState(7)
  const [backupFolder, setBackupFolder] = useState('')
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [autoBusy, setAutoBusy] = useState(false)

  const loadCompanion = useCallback(async () => {
    const res = await window.api.companionStatus()
    if (res.success && res.data) setCompanion(res.data)
  }, [])

  useEffect(() => {
    loadCompanion()
  }, [loadCompanion])

  // Q4 — load current auto-backup settings (key-value settings store)
  // getSetting returns an IPCResponse envelope; unwrap to the raw string|null.
  const readSetting = useCallback(async (key: string): Promise<string | null> => {
    const res = await window.api.getSetting(key)
    return res.success ? (res.data ?? null) : null
  }, [])

  const loadAutoBackup = useCallback(async () => {
    try {
      const [en, iv, fo, lr] = await Promise.all([
        readSetting('backup.autoEnabled'),
        readSetting('backup.intervalDays'),
        readSetting('backup.folder'),
        readSetting('backup.lastRun')
      ])
      setAutoEnabled(en ? JSON.parse(en) : false)
      setIntervalDays(iv ? JSON.parse(iv) : 7)
      setBackupFolder(fo ? JSON.parse(fo) : '')
      setLastRun(lr ? JSON.parse(lr) : null)
    } catch {
      /* defaults */
    }
  }, [readSetting])

  useEffect(() => {
    loadAutoBackup()
  }, [loadAutoBackup])

  const saveAutoBackup = async (): Promise<void> => {
    setAutoBusy(true)
    try {
      await window.api.setSetting('backup.autoEnabled', JSON.stringify(autoEnabled))
      await window.api.setSetting('backup.intervalDays', JSON.stringify(intervalDays))
      await window.api.setSetting('backup.folder', JSON.stringify(backupFolder))
      toast.success('Auto-backup settings saved')
    } catch {
      toast.error('Failed to save auto-backup settings')
    }
    setAutoBusy(false)
  }

  const runBackupNow = async (): Promise<void> => {
    setAutoBusy(true)
    const res = await window.api.backupAutoRunNow()
    setAutoBusy(false)
    if (res.success && res.data) {
      toast.success(`Backup saved to ${res.data}`)
      const lr = await readSetting('backup.lastRun')
      setLastRun(lr ? JSON.parse(lr) : null)
    } else {
      toast.error(res.error || 'Backup failed')
    }
  }

  const saveEncrypted = async (): Promise<void> => {
    if (pass.length < 4) {
      toast.error('Passphrase must be at least 4 characters')
      return
    }
    const res = await window.api.backupToFileEncrypted(pass)
    if (res.success && res.data) toast.success('Encrypted backup saved')
    else if (res.success) toast.info('Cancelled')
    else toast.error(res.error || 'Backup failed')
  }

  const restoreEncrypted = async (): Promise<void> => {
    if (pass.length < 4) {
      toast.error('Enter the passphrase used for the backup')
      return
    }
    if (!window.confirm('Restore will REPLACE all current data. Continue?')) return
    const res = await window.api.restoreFromFileEncrypted(pass)
    if (res.success && res.data) {
      const total = Object.values(res.data).reduce((a, b) => a + b, 0)
      toast.success(`Restored ${total} records`)
    } else if (res.success) {
      toast.info('Cancelled')
    } else {
      toast.error(res.error || 'Restore failed')
    }
  }

  const toggleCompanion = async (): Promise<void> => {
    setBusy(true)
    const res = companion?.running
      ? await window.api.companionStop()
      : await window.api.companionStart()
    setBusy(false)
    if (res.success && res.data) {
      setCompanion(res.data)
      toast.success(res.data.running ? 'Companion server started' : 'Companion server stopped')
    } else {
      toast.error(res.error || 'Failed')
    }
  }

  return (
    <>
      {/* Q4 — Scheduled auto-backup */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <DatabaseBackup className="h-4 w-4" /> Scheduled auto-backup
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Automatically save a full snapshot of your data (every table, work + life) to a folder on
          your disk. Leave the folder empty to use the app data folder. The last 20 automatic
          backups are kept; older ones are pruned.
        </p>
        <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoEnabled}
            onChange={(e) => setAutoEnabled(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">Enable automatic backup</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 mb-3">
          <Input
            type="number"
            min={1}
            value={intervalDays}
            onChange={(e) => setIntervalDays(Math.max(1, Number(e.target.value) || 1))}
            placeholder="7"
            className="h-10 text-base border rounded-md"
          />
          <Input
            type="text"
            value={backupFolder}
            onChange={(e) => setBackupFolder(e.target.value)}
            placeholder="Folder (empty = app data/backups)"
            className="h-10 text-base border rounded-md"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="default" onClick={saveAutoBackup} disabled={autoBusy}>
            Save settings
          </Button>
          <Button variant="outline" onClick={runBackupNow} disabled={autoBusy}>
            Back up now
          </Button>
          {lastRun && (
            <span className="text-xs text-muted-foreground">
              Last automatic run: {new Date(lastRun).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Encrypted backup */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Lock className="h-4 w-4" /> Encrypted backup (for sync)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Save an AES-256 encrypted snapshot you can safely drop in any cloud drive (Dropbox,
          iCloud, Drive…). Only this passphrase can open it — keep it somewhere safe, it can&apos;t
          be recovered.
        </p>
        <Input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder="Backup passphrase"
          className="h-10 text-base border rounded-md"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Button variant="outline" className="justify-center" onClick={saveEncrypted}>
            Save Encrypted
          </Button>
          <Button
            variant="outline"
            className="justify-center border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={restoreEncrypted}
          >
            Restore Encrypted
          </Button>
        </div>
      </div>

      {/* Companion server */}
      <div className="p-6 bg-card rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Smartphone className="h-4 w-4" /> Mobile companion (local network)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start a small server on your computer so your phone — on the same Wi-Fi — can quick-add
          tasks, see what&apos;s coming up, and control the timer. Your data never leaves your
          network.
        </p>
        <Button
          onClick={toggleCompanion}
          disabled={busy}
          variant={companion?.running ? 'outline' : 'default'}
          className="justify-center gap-2"
        >
          {companion?.running ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}
          {companion?.running ? 'Stop companion server' : 'Start companion server'}
        </Button>

        {companion?.running && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">
              Open one of these on your phone&apos;s browser (keep this app running):
            </p>
            {companion.urls.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Running on port {companion.port}, but no LAN address was detected.
              </p>
            )}
            {companion.urls.map((url) => (
              <div key={url} className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted rounded px-2 py-1.5 truncate">{url}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(url)
                    toast.success('Link copied')
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export default DataSyncSection
