// src/renderer/src/pages/SettingsPage.tsx
// Settings Page with Tabbed Interface - Phase 9

import React, { useEffect, useState } from 'react'
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
  Camera
} from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import type { Currency, DateFormat } from '../../../shared/types'

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

type TabId = 'general' | 'focus' | 'screenshots' | 'data' | 'about'

const SettingsPage: React.FC = () => {
  const { settings, loadSettings, updateSettings, isLoading } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleExport = async () => {
    setExportStatus('Exporting...')
    try {
      const response = await window.api.exportDatabase()
      if (response.success && response.data) {
        const json = JSON.stringify(response.data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })

        // Use save dialog
        const filePath = await window.api.showSaveDialog({
          defaultPath: `valute-backup-${new Date().toISOString().split('T')[0]}.json`,
          filters: [{ name: 'JSON', extensions: ['json'] }]
        })

        if (filePath) {
          // Create a download link as fallback (Electron will handle the save)
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `valute-backup-${new Date().toISOString().split('T')[0]}.json`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          setExportStatus('Export successful!')
        } else {
          setExportStatus(null)
        }
      } else {
        setExportStatus(`Export failed: ${response.error}`)
      }
    } catch (error: any) {
      setExportStatus(`Export failed: ${error.message}`)
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

      // Read file using fetch (works for local files in Electron)
      const filePath = result.filePaths[0]
      const response = await fetch(`file://${filePath}`)
      const data = await response.json()

      setImportStatus('Importing data...')
      const importResponse = await window.api.importDatabase(data)

      if (importResponse.success && importResponse.data) {
        const counts = importResponse.data.counts
        const total = Object.values(counts).reduce((a, b) => a + b, 0)
        setImportStatus(`Import successful! Restored ${total} records.`)
        // Reload the page to reflect changes
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setImportStatus(`Import failed: ${importResponse.error}`)
      }
    } catch (error: any) {
      setImportStatus(`Import failed: ${error.message}`)
    }

    setTimeout(() => setImportStatus(null), 5000)
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Globe className="h-4 w-4" /> },
    { id: 'focus', label: 'Focus', icon: <Focus className="h-4 w-4" /> },
    { id: 'screenshots', label: 'Screenshots', icon: <Camera className="h-4 w-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
    { id: 'about', label: 'About', icon: <Info className="h-4 w-4" /> }
  ]

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

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
        <section className="p-6 bg-card rounded-lg border border-border space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Regional Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Default Currency
                </label>
                <Select
                  value={settings.general.currency}
                  onChange={(e) =>
                    updateSettings({ general: { ...settings.general, currency: e.target.value as Currency } })
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date Format
                </label>
                <Select
                  value={settings.general.dateFormat}
                  onChange={(e) =>
                    updateSettings({ general: { ...settings.general, dateFormat: e.target.value as DateFormat } })
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
        </section>
      )}

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
                    checked={settings.focus.enabled}
                    onChange={(e) =>
                      updateSettings({ focus: { ...settings.focus, enabled: e.target.checked } })
                    }
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {settings.focus.enabled && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Check-in Interval
                  </label>
                  <Select
                    value={settings.focus.nudgeInterval.toString()}
                    onChange={(e) =>
                      updateSettings({ focus: { ...settings.focus, nudgeInterval: parseInt(e.target.value) } })
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Proof of Work Screenshots</h3>
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
                    checked={settings.screenshot?.enabled ?? false}
                    onChange={(e) =>
                      updateSettings({
                        screenshot: { ...settings.screenshot, enabled: e.target.checked }
                      })
                    }
                    className="sr-only peer"
                    disabled={isLoading}
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {settings.screenshot?.enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Capture Frequency
                    </label>
                    <Select
                      value={(settings.screenshot?.frequency ?? 10).toString()}
                      onChange={(e) =>
                        updateSettings({
                          screenshot: { ...settings.screenshot, frequency: parseInt(e.target.value) }
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
                        checked={settings.screenshot?.notifyBeforeCapture ?? true}
                        onChange={(e) =>
                          updateSettings({
                            screenshot: { ...settings.screenshot, notifyBeforeCapture: e.target.checked }
                          })
                        }
                        className="sr-only peer"
                        disabled={isLoading}
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Gallery Blur (Privacy)
                    </label>
                    <Select
                      value={settings.screenshot?.blurIntensity ?? 'off'}
                      onChange={(e) =>
                        updateSettings({
                          screenshot: {
                            ...settings.screenshot,
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
                      Screenshots are always stored unblurred. Blur only affects viewing in the gallery.
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
                  <Button
                    onClick={handleImportConfirm}
                    variant="destructive"
                    className="flex-1"
                  >
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
    </div>
  )
}

export default SettingsPage
