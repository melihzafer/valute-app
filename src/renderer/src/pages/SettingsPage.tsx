// src/renderer/src/pages/SettingsPage.tsx
// Settings Page with Tabbed Interface - Phase 9

import React, { useEffect, useMemo, useState } from 'react'
import {
  Settings,
  Globe,
  Focus,
  Database,
  Info,
  Shield,
  Download,
  Upload,
  AlertTriangle,
  Camera,
  Save,
  RotateCcw,
  Palette,
  Check
} from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUIStore } from '../store/useUIStore'
import { THEME_PRESETS } from '../lib/themes'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { toast } from '../store/useToastStore'
import DataSyncSection from '../components/DataSyncSection'
import type { AppSettings, Currency, DateFormat } from '../../../shared/types'
import { DEFAULT_SETTINGS } from '../../../shared/types'

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'TRY', label: 'Turkish Lira (₺)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' }
]

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
]

const NUDGE_INTERVALS = [
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' }
]

const SCREENSHOT_FREQUENCIES = [
  { value: 1, label: 'Every 1 minutes' },
  { value: 5, label: 'Every 5 minutes' },
  { value: 10, label: 'Every 10 minutes' },
  { value: 15, label: 'Every 15 minutes' },
  { value: 30, label: 'Every 30 minutes' }
]

const BLUR_OPTIONS = [
  { value: 'off', label: 'No blur (full clarity)' },
  { value: 'low', label: 'Light blur' },
  { value: 'high', label: 'Heavy blur' }
]

type TabId = 'general' | 'appearance' | 'focus' | 'screenshots' | 'data' | 'about'

const SettingsPage: React.FC = () => {
  const { settings, loadSettings, updateSettings, isLoading, error } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [draft, setDraft] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Sync draft from loaded settings (only when not currently dirty-edited by user)
  useEffect(() => {
    setDraft(settings)
  }, [settings])

  const isDirty = useMemo(() => {
    return (
      draft.general.currency !== settings.general.currency ||
      draft.general.dateFormat !== settings.general.dateFormat ||
      draft.focus.enabled !== settings.focus.enabled ||
      draft.focus.nudgeInterval !== settings.focus.nudgeInterval ||
      (draft.screenshot?.enabled ?? false) !== (settings.screenshot?.enabled ?? false) ||
      (draft.screenshot?.frequency ?? 0) !== (settings.screenshot?.frequency ?? 0) ||
      (draft.screenshot?.notifyBeforeCapture ?? true) !==
        (settings.screenshot?.notifyBeforeCapture ?? true) ||
      (draft.screenshot?.blurIntensity ?? 'off') !==
        (settings.screenshot?.blurIntensity ?? 'off') ||
      (draft.github?.pat ?? '') !== (settings.github?.pat ?? '')
    )
  }, [draft, settings])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateSettings(draft)
      toast.success('Settings saved')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    setDraft(settings)
    toast.info('Changes discarded')
  }

  const handleExport = async () => {
    setExportStatus('Exporting...')
    try {
      const response = await window.api.exportDatabase()
      if (response.success && response.data) {
        const json = JSON.stringify(response.data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })

        const filePath = await window.api.showSaveDialog({
          defaultPath: `valute-backup-${new Date().toISOString().split('T')[0]}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        })

        if (filePath) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `valute-backup-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setExportStatus('Export successful!')
          toast.success('Export successful')
        } else {
          setExportStatus(null)
        }
      } else {
        setExportStatus(`Export failed: ${response.error}`)
        toast.error(`Export failed: ${response.error}`)
      }
    } catch (error: any) {
      setExportStatus(`Export failed: ${error.message}`)
      toast.error(`Export failed: ${error.message}`)
    }

    setTimeout(() => setExportStatus(null), 3000)
  }

  const handleImportClick = () => {
    setImportConfirmOpen(true)
  }

  const handleImportConfirm = async () => {
    setImportConfirmOpen(false)
    setImportStatus('Selecting file...')

    try {
      const result = await window.api.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })

      if (result.canceled || result.filePaths.length === 0) {
        setImportStatus(null)
        return
      }

      setImportStatus('Reading file...')

      const filePath = result.filePaths[0]
      const response = await fetch(`file://${filePath}`)
      const data = await response.json()

      setImportStatus('Importing data...')
      const importResponse = await window.api.importDatabase(data)

      if (importResponse.success && importResponse.data) {
        const counts = importResponse.data.counts
        const total = Object.values(counts).reduce((a, b) => a + b, 0)
        setImportStatus(`Import successful! Restored ${total} records.`)
        toast.success(`Imported ${total} records`)
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setImportStatus(`Import failed: ${importResponse.error}`)
        toast.error(`Import failed: ${importResponse.error}`)
      }
    } catch (error: any) {
      setImportStatus(`Import failed: ${error.message}`)
      toast.error(`Import failed: ${error.message}`)
    }

    setTimeout(() => setImportStatus(null), 5000)
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Globe className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
    { id: 'focus', label: 'Focus', icon: <Focus className="h-4 w-4" /> },
    { id: 'screenshots', label: 'Screenshots', icon: <Camera className="h-4 w-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
    { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> }
  ]

  return (
    <div className="max-w-4xl pb-24">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        </div>
        {isDirty && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Unsaved changes
          </span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <section className="p-6 bg-card rounded-lg border border-border space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Regional Settings</h3>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="defaultCurrency"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Default Currency
                </label>
                <Select
                  id="defaultCurrency"
                  value={draft.general.currency}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      general: { ...draft.general, currency: e.target.value as Currency }
                    })
                  }
                  disabled={isLoading}
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr.value} value={curr.value}>
                      {curr.label}
                    </option>
                  ))}
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Used as the default when creating new projects
                </p>
              </div>

              <div>
                <label
                  htmlFor="dateFormat"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Date Format
                </label>
                <Select
                  id="dateFormat"
                  value={draft.general.dateFormat}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      general: { ...draft.general, dateFormat: e.target.value as DateFormat }
                    })
                  }
                  disabled={isLoading}
                >
                  {DATE_FORMATS.map((fmt) => (
                    <option key={fmt.value} value={fmt.value}>
                      {fmt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6 mt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">GitHub Integration</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="githubPat"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Personal Access Token (PAT)
                </label>
                <input
                  id="githubPat"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="ghp_..."
                  value={draft.github?.pat ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      github: { ...draft.github, pat: e.target.value }
                    })
                  }
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Required to fetch open issues, pull requests, and sync status labels for projects
                  linked to GitHub repositories.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && <AppearanceSection />}

      {/* Focus Tab */}
      {activeTab === 'focus' && (
        <section className="p-6 bg-card rounded-lg border border-border space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Focus Guard</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get gentle reminders during long work sessions to check if you're still focused.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Enable Focus Guard</p>
                  <p className="text-sm text-muted-foreground">
                    Show nudge reminders during long timer sessions
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.focus.enabled}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        focus: { ...draft.focus, enabled: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {draft.focus.enabled && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label
                    htmlFor="nudgeInterval"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Check-in Interval
                  </label>
                  <Select
                    id="nudgeInterval"
                    value={draft.focus.nudgeInterval.toString()}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        focus: {
                          ...draft.focus,
                          nudgeInterval: parseInt(e.target.value)
                        }
                      })
                    }
                    disabled={isLoading}
                  >
                    {NUDGE_INTERVALS.map((interval) => (
                      <option key={interval.value} value={interval.value}>
                        {interval.label}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How long to wait before showing a focus reminder
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Screenshots Tab */}
      {activeTab === 'screenshots' && (
        <section className="p-6 bg-card rounded-lg border border-border space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Proof of Work Screenshots
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Automatically capture screenshots during timer sessions for proof of work.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Enable Screenshot Capture</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically take screenshots while the timer is running
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.screenshot?.enabled ?? false}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        screenshot: {
                          ...(draft.screenshot ?? settings.screenshot),
                          enabled: e.target.checked
                        }
                      })
                    }
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {draft.screenshot?.enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label
                      htmlFor="screenshotFrequency"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Capture Frequency
                    </label>
                    <Select
                      id="screenshotFrequency"
                      value={(draft.screenshot?.frequency ?? 10).toString()}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          screenshot: {
                            ...(draft.screenshot ?? settings.screenshot),
                            frequency: parseInt(e.target.value)
                          }
                        })
                      }
                      disabled={isLoading}
                    >
                      {SCREENSHOT_FREQUENCIES.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Privacy Control</p>
                      <p className="text-sm text-muted-foreground">
                        Show 10-second warning before each capture with option to skip
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.screenshot?.notifyBeforeCapture ?? true}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            screenshot: {
                              ...(draft.screenshot ?? settings.screenshot),
                              notifyBeforeCapture: e.target.checked
                            }
                          })
                        }
                        className="sr-only peer"
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor="blurIntensity"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Gallery Blur (Privacy)
                    </label>
                    <Select
                      id="blurIntensity"
                      value={draft.screenshot?.blurIntensity ?? 'off'}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          screenshot: {
                            ...(draft.screenshot ?? settings.screenshot),
                            blurIntensity: e.target.value as 'off' | 'low' | 'high'
                          }
                        })
                      }
                      disabled={isLoading}
                    >
                      {BLUR_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Screenshots are always stored unblurred. Blur only affects viewing in the
                      gallery.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Data Tab */}
      {activeTab === 'data' && (
        <section className="space-y-6">
          <DataSyncSection />
          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Full Backup (everything)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save or restore a complete snapshot of <em>all</em> your data — work, finance,
              calendar, tasks, habits, courses, health, mood and notes — to a single JSON file.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-center gap-2"
                onClick={async () => {
                  const res = await window.api.backupToFile()
                  if (res.success && res.data) toast.success('Backup saved')
                  else if (res.success) toast.info('Backup cancelled')
                  else toast.error(res.error || 'Backup failed')
                }}
              >
                <Download className="h-4 w-4" /> Save Full Backup
              </Button>
              <Button
                variant="outline"
                className="justify-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  if (!window.confirm('Restore will REPLACE all current data with the backup. Continue?')) return
                  const res = await window.api.restoreFromFile()
                  if (res.success && res.data) {
                    const total = Object.values(res.data).reduce((a, b) => a + b, 0)
                    toast.success(`Restored ${total} records`)
                  } else if (res.success) {
                    toast.info('Restore cancelled')
                  } else {
                    toast.error(res.error || 'Restore failed')
                  }
                }}
              >
                <Upload className="h-4 w-4" /> Restore Full Backup
              </Button>
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Starter templates</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add a ready-made set of sample data for a persona. Additive — it won&apos;t delete
              anything you already have.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['freelancer', 'student', 'creator'] as const).map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  className="justify-center capitalize"
                  onClick={async () => {
                    const res = await window.api.applyTemplate(p)
                    if (res.success && res.data) {
                      const total = Object.values(res.data.created).reduce((a, b) => a + b, 0)
                      toast.success(`Added ${total} ${p} items`)
                    } else {
                      toast.error(res.error || 'Failed to apply template')
                    }
                  }}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">Backup & Restore</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Export your data for backup or transfer to another device.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full justify-center gap-2"
                disabled={isLoading}
              >
                <Download className="h-4 w-4" />
                Export All Data
              </Button>

              {exportStatus && (
                <p className="text-sm text-center text-muted-foreground">{exportStatus}</p>
              )}
            </div>
          </div>

          <div className="p-6 bg-destructive/5 rounded-lg border border-destructive/20">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Importing data will replace all existing data. This action cannot be undone.
                </p>
              </div>
            </div>

            {!importConfirmOpen ? (
              <Button
                onClick={handleImportClick}
                variant="outline"
                className="w-full justify-center gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                <Upload className="h-4 w-4" />
                Import / Restore Backup
              </Button>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <p className="text-sm text-destructive font-medium">
                  Are you sure? This will delete all current data and replace it with the backup.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setImportConfirmOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleImportConfirm} variant="destructive" className="flex-1">
                    Yes, Replace All Data
                  </Button>
                </div>
              </div>
            )}

            {importStatus && (
              <p className="text-sm text-center text-muted-foreground mt-3">{importStatus}</p>
            )}
          </div>
        </section>
      )}

      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          <section className="p-6 bg-card rounded-lg border border-border">
            <div className="flex items-center mb-4">
              <Info className="h-6 w-6 text-primary mr-3" />
              <h2 className="text-xl font-semibold text-foreground">About Valute</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Valute is an offline-first, privacy-centric time tracking and invoicing application.
              All your data stays local on your device - nothing is ever sent to the cloud.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Version: 1.0.0</p>
              <p>Built with Electron + React + TypeScript</p>
            </div>
          </section>

          <section className="p-6 bg-card rounded-lg border border-border">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-foreground">Privacy & Security</h2>
            </div>
            <ul className="text-muted-foreground space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                All data stored locally on your device
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                No cloud sync or external data transmission
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Context isolation enabled for security
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                No tracking or analytics
              </li>
            </ul>
          </section>
        </div>
      )}

      {/* Sticky Save Bar (only when dirty, hides on About/Data tabs) */}
      {isDirty && activeTab !== 'data' && activeTab !== 'about' && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-card border border-border rounded-full shadow-xl px-4 py-2 animate-in slide-in-from-bottom-full fade-in">
          <span className="text-sm text-muted-foreground">You have unsaved changes</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDiscard}
            disabled={isSaving}
            className="gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  )
}

// Tema secimi aninda uygulanir ve kalici olarak saklanir (zustand persist)
const FONT_SIZES = [
  { px: 12, label: 'Tiny' },
  { px: 13, label: 'Small' },
  { px: 14, label: 'Compact' },
  { px: 16, label: 'Default' },
  { px: 18, label: 'Large' }
]

const AppearanceSection: React.FC = () => {
  const { theme, customTheme, setTheme, setCustomTheme, fontScale, setFontScale } = useUIStore()

  return (
    <section className="p-6 bg-card rounded-lg border border-border space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Interface Size</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Scales every font and component in the app. Applies instantly.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {FONT_SIZES.map((s) => (
            <Button
              key={s.px}
              type="button"
              variant={fontScale === s.px ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFontScale(s.px)}
            >
              {s.label}
            </Button>
          ))}
          <input
            type="range"
            min={11}
            max={20}
            step={1}
            value={fontScale}
            onChange={(e) => setFontScale(parseInt(e.target.value))}
            className="ml-2 w-40 accent-[hsl(var(--primary))]"
            title="Fine-tune size"
          />
          <span className="text-xs text-muted-foreground tabular-nums">{fontScale}px</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pick a look — changes apply instantly and are saved automatically.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.id)}
              className={`relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02] ${
                theme === preset.id ? 'border-primary' : 'border-border'
              }`}
              style={{ backgroundColor: preset.preview.bg }}
            >
              <div
                className="h-10 rounded-lg mb-2 flex items-end p-1.5 gap-1"
                style={{ backgroundColor: preset.preview.card }}
              >
                <div
                  className="h-2 w-8 rounded-full"
                  style={{ backgroundColor: preset.preview.accent }}
                />
                <div
                  className="h-2 w-4 rounded-full opacity-40"
                  style={{ backgroundColor: preset.preview.accent }}
                />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: preset.isDark ? '#e8e8f0' : '#1a1d28' }}
              >
                {preset.name}
              </span>
              {theme === preset.id && (
                <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </span>
              )}
            </button>
          ))}

          {/* Custom theme card */}
          <button
            onClick={() => setCustomTheme(customTheme)}
            className={`relative rounded-xl border-2 p-3 text-left transition-all hover:scale-[1.02] bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 ${
              theme === 'custom' ? 'border-primary' : 'border-border'
            }`}
          >
            <div className="h-10 rounded-lg mb-2 bg-background/60 flex items-end p-1.5 gap-1">
              <div
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: customTheme.accent }}
              />
            </div>
            <span className="text-xs font-medium text-foreground">Custom</span>
            {theme === 'custom' && (
              <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </span>
            )}
          </button>
        </div>
      </div>

      {theme === 'custom' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Base</label>
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map((base) => (
                <Button
                  key={base}
                  type="button"
                  variant={customTheme.base === base ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCustomTheme({ ...customTheme, base })}
                >
                  {base === 'light' ? 'Light' : 'Dark'}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="accentColor" className="block text-sm font-medium text-foreground mb-2">
              Accent color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="accentColor"
                type="color"
                value={customTheme.accent}
                onChange={(e) => setCustomTheme({ ...customTheme, accent: e.target.value })}
                className="h-10 w-16 rounded-lg border border-border bg-transparent cursor-pointer"
              />
              <span className="text-sm text-muted-foreground font-mono">{customTheme.accent}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Buttons, highlights and the timer take this color.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default SettingsPage
