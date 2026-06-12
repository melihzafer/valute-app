// src/renderer/src/components/DailyReportPanel.tsx
// HOT feature: paste an end-of-day report -> auto-saves to disk as a .md file
// and shows it in an in-app timeline.

import React, { useState, useEffect, useCallback } from 'react'
import type { DailyReportIPC, Log } from '../../../shared/types'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import { FileText, Save, Trash2, ExternalLink, Loader2, Check, Clock } from 'lucide-react'

interface DailyReportPanelProps {
  projectId: string
  logs: Log[]
}

const toDateKey = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const DailyReportPanel: React.FC<DailyReportPanelProps> = ({ projectId, logs }) => {
  const [draft, setDraft] = useState('')
  const [reports, setReports] = useState<DailyReportIPC[]>([])
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const refresh = useCallback(async () => {
    const res = await window.api.getDailyReports(projectId)
    if (res.success && res.data) setReports(res.data)
  }, [projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Tracked seconds bucketed by YYYY-MM-DD, to annotate each report with that day's hours.
  const trackedByDay = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const log of logs) {
      const start = log.startTime instanceof Date ? log.startTime : new Date(log.startTime)
      const key = toDateKey(start)
      map[key] = (map[key] || 0) + (log.accumulatedTime || 0)
    }
    return map
  }, [logs])

  const handleSave = async () => {
    if (!draft.trim()) return
    setSaveStatus('saving')
    const res = await window.api.saveDailyReport(projectId, draft.trim())
    if (res.success) {
      setDraft('')
      setSaveStatus('saved')
      await refresh()
      setTimeout(() => setSaveStatus('idle'), 2000)
    } else {
      setSaveStatus('idle')
      console.error('Failed to save daily report:', res.error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this daily report? The saved file will also be removed.')) return
    await window.api.deleteDailyReport(id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      {/* Capture box */}
      <div className="bg-card border border-border/50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Paste what you did today — it saves as a dated markdown file and shows below.
          </p>
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-green-500">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
        </div>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={'## Today\n- Implemented ...\n- Fixed ...\n- Next: ...'}
          className="min-h-[160px] resize-y font-mono text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!draft.trim() || saveStatus === 'saving'}>
            <Save className="mr-2 h-4 w-4" />
            Save Daily Report
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No daily reports yet. Paste your first one above.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const date = new Date(report.reportDate)
            const dayKey = toDateKey(date)
            const tracked = trackedByDay[dayKey]
            return (
              <div
                key={report.id}
                className="bg-card border border-border/50 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{dayKey}</span>
                    {tracked > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(tracked)} tracked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {report.filePath && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-auto"
                        title="Open file"
                        onClick={() => window.api.openDailyReportFile(report.filePath!)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto text-muted-foreground hover:text-destructive"
                      title="Delete"
                      onClick={() => handleDelete(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm text-foreground/90 font-sans">
                  {report.content}
                </pre>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DailyReportPanel
