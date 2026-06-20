// src/renderer/src/components/DailyReportPanel.tsx
// paste an end-of-day report -> auto-saves to disk as a .md file
// and shows it in an in-app timeline with accordion toggles and markdown preview.

import React, { useState, useEffect, useCallback } from 'react'
import type { DailyReportIPC, Log } from '../../../shared/types'
import { Button } from './ui/Button'
import { Textarea } from './ui/Textarea'
import {
  FileText,
  Save,
  Trash2,
  ExternalLink,
  Loader2,
  Check,
  Clock,
  ChevronDown,
  ChevronRight,
  Edit2,
  X
} from 'lucide-react'
import { cn } from '../lib/utils'

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

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  const regex = /(\*\*|`)(.*?)\1/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    const type = match[1]
    const content = match[2]
    const index = match.index

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }

    if (type === '**') {
      parts.push(
        <strong key={index} className="font-bold text-foreground">
          {content}
        </strong>
      )
    } else {
      parts.push(
        <code key={index} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
          {content}
        </code>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n')

  return (
    <div className="space-y-1.5 text-sm text-foreground/90 font-sans leading-relaxed">
      {lines.map((line, idx) => {
        // Headings
        if (line.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-xl font-bold mt-4 mb-2 text-foreground">
              {parseInline(line.slice(2))}
            </h1>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-lg font-bold mt-3 mb-1.5 text-foreground">
              {parseInline(line.slice(3))}
            </h2>
          )
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold mt-2 mb-1 text-foreground">
              {parseInline(line.slice(4))}
            </h3>
          )
        }

        // Bullet Lists
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          const contentStr = line.trim().slice(2)
          return (
            <ul key={idx} className="list-disc list-inside pl-4 space-y-1 my-0.5">
              <li>{parseInline(contentStr)}</li>
            </ul>
          )
        }

        // Numbered Lists
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)$/)
        if (numMatch) {
          return (
            <ol key={idx} className="list-decimal list-inside pl-4 space-y-1 my-0.5">
              <li>{parseInline(numMatch[2])}</li>
            </ol>
          )
        }

        // Empty line
        if (line.trim() === '') {
          return <div key={idx} className="h-1.5" />
        }

        // Standard paragraph
        return <p key={idx}>{parseInline(line)}</p>
      })}
    </div>
  )
}

interface DailyReportItemProps {
  report: DailyReportIPC
  projectId: string
  dayKey: string
  tracked: number
  onRefresh: () => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const DailyReportItem: React.FC<DailyReportItemProps> = ({
  report,
  projectId,
  dayKey,
  tracked,
  onRefresh,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(report.content)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditContent(report.content)
  }, [report.content])

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editContent.trim()) return
    setIsSaving(true)
    try {
      const res = await window.api.saveDailyReport(projectId, editContent.trim(), report.reportDate)
      if (res.success) {
        setIsEditing(false)
        await onRefresh()
      } else {
        console.error('Failed to update daily report:', res.error)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden transition-all duration-200 hover:border-border/80">
      {/* Header / Accordion Toggle */}
      <div
        onClick={() => {
          if (!isEditing) setIsOpen(!isOpen)
        }}
        className={cn(
          'flex items-center justify-between p-4 cursor-pointer select-none hover:bg-accent/30 transition-colors',
          isOpen && 'border-b border-border/50 bg-accent/10'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
          <span className="text-sm font-semibold text-foreground">{dayKey}</span>
          {tracked > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
              <Clock className="h-3 w-3 text-primary/70" />
              {formatDuration(tracked)} tracked
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!isEditing && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                title="Edit Report"
                onClick={() => {
                  setIsOpen(true)
                  setIsEditing(true)
                }}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              {report.filePath && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  title="Open file"
                  onClick={() => window.api.openDailyReportFile(report.filePath!)}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Delete"
                onClick={() => onDelete(report.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-4 bg-card animate-in fade-in slide-in-from-top-1 duration-150">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[140px] resize-y font-mono text-sm w-full"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(report.content)
                  }}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleUpdate} disabled={isSaving || !editContent.trim()}>
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <MarkdownPreview content={report.content} />
          )}
        </div>
      )}
    </div>
  )
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
        <div className="space-y-3">
          {reports.map((report) => {
            const date = new Date(report.reportDate)
            const dayKey = toDateKey(date)
            const tracked = trackedByDay[dayKey] || 0
            return (
              <DailyReportItem
                key={report.id}
                report={report}
                projectId={projectId}
                dayKey={dayKey}
                tracked={tracked}
                onRefresh={refresh}
                onDelete={handleDelete}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DailyReportPanel
