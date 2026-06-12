// src/renderer/src/components/TimeReportSection.tsx
// 1d / 1w / 1m time-tracking report: range presets, summary cards,
// per-project breakdown, and PDF + Markdown export.

import React, { useState, useEffect, useCallback } from 'react'
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format
} from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { TimeReport } from '../../../shared/types'
import { formatCurrency } from '../lib/utils'
import { Button } from './ui/Button'
import { Clock, DollarSign, FolderKanban, FileDown, FileText } from 'lucide-react'

type Preset = 'day' | 'week' | 'month'

const PRESETS: { id: Preset; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' }
]

function rangeForPreset(preset: Preset): { start: Date; end: Date } {
  const now = new Date()
  switch (preset) {
    case 'day':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 })
      }
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

const TimeReportSection: React.FC = () => {
  const [preset, setPreset] = useState<Preset>('week')
  const [report, setReport] = useState<TimeReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async (p: Preset) => {
    setIsLoading(true)
    const { start, end } = rangeForPreset(p)
    const res = await window.api.getTimeReport(start.toISOString(), end.toISOString())
    if (res.success && res.data) setReport(res.data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load(preset)
  }, [preset, load])

  // Total billable is summed in cents; display in the dominant currency (first row, else USD).
  const displayCurrency = report?.rows[0]?.currency || 'USD'
  const periodLabel = PRESETS.find((x) => x.id === preset)?.label || ''

  const handleExportPdf = async () => {
    if (!report) return
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Valute — Time Report', 14, 16)
    doc.setFontSize(11)
    doc.text(
      `${periodLabel}: ${format(new Date(report.startDate), 'PP')} – ${format(new Date(report.endDate), 'PP')}`,
      14,
      24
    )
    doc.text(
      `Total: ${formatDuration(report.totalSeconds)}  •  Billable: ${formatCurrency(report.totalBillableCents, displayCurrency)}  •  Projects: ${report.activeProjectCount}`,
      14,
      31
    )

    autoTable(doc, {
      startY: 38,
      head: [['Project', 'Tracked', 'Billable', 'Unbilled', 'Logs']],
      body: report.rows.map((r) => [
        r.projectName,
        formatDuration(r.totalSeconds),
        formatCurrency(r.billableCents, r.currency),
        formatCurrency(r.unbilledCents, r.currency),
        String(r.logCount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: 'bold' },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 }
    })

    const buffer = doc.output('arraybuffer') as ArrayBuffer
    await window.api.saveExportFile(
      `time-report-${preset}-${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      buffer,
      [{ name: 'PDF', extensions: ['pdf'] }]
    )
  }

  const handleExportMarkdown = async () => {
    if (!report) return
    const lines: string[] = []
    lines.push(`# Valute — Time Report (${periodLabel})`)
    lines.push('')
    lines.push(
      `_${format(new Date(report.startDate), 'PP')} – ${format(new Date(report.endDate), 'PP')}_`
    )
    lines.push('')
    lines.push(`- **Total tracked:** ${formatDuration(report.totalSeconds)}`)
    lines.push(`- **Billable:** ${formatCurrency(report.totalBillableCents, displayCurrency)}`)
    lines.push(`- **Active projects:** ${report.activeProjectCount}`)
    lines.push('')
    lines.push('| Project | Tracked | Billable | Unbilled | Logs |')
    lines.push('| --- | --- | --- | --- | --- |')
    for (const r of report.rows) {
      lines.push(
        `| ${r.projectName} | ${formatDuration(r.totalSeconds)} | ${formatCurrency(r.billableCents, r.currency)} | ${formatCurrency(r.unbilledCents, r.currency)} | ${r.logCount} |`
      )
    }
    lines.push('')
    await window.api.saveExportFile(
      `time-report-${preset}-${format(new Date(), 'yyyy-MM-dd')}.md`,
      lines.join('\n'),
      [{ name: 'Markdown', extensions: ['md'] }]
    )
  }

  const hasData = report && report.rows.length > 0

  return (
    <section className="mb-8 p-6 bg-card border border-border rounded-lg shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Time Report</h2>
        <div className="flex items-center gap-2">
          {/* Range presets */}
          <div className="flex rounded-md border border-border overflow-hidden">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={
                  'px-3 py-1.5 text-sm transition-colors ' +
                  (preset === p.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-transparent text-muted-foreground hover:text-foreground')
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={!hasData}>
            <FileDown className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportMarkdown} disabled={!hasData}>
            <FileText className="h-4 w-4 mr-1" /> Markdown
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="bg-background border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5" /> Total Tracked
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatDuration(report?.totalSeconds || 0)}
          </p>
        </div>
        <div className="bg-background border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <DollarSign className="h-3.5 w-3.5" /> Billable
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(report?.totalBillableCents || 0, displayCurrency)}
          </p>
        </div>
        <div className="bg-background border border-border/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <FolderKanban className="h-3.5 w-3.5" /> Active Projects
          </div>
          <p className="text-2xl font-bold text-foreground">{report?.activeProjectCount || 0}</p>
        </div>
      </div>

      {/* Per-project breakdown */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      ) : hasData ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-4 font-medium">Project</th>
                <th className="py-2 pr-4 font-medium">Tracked</th>
                <th className="py-2 pr-4 font-medium">Billable</th>
                <th className="py-2 pr-4 font-medium">Unbilled</th>
                <th className="py-2 font-medium text-right">Logs</th>
              </tr>
            </thead>
            <tbody>
              {report!.rows.map((r) => (
                <tr key={r.projectId} className="border-b border-border/50">
                  <td className="py-2 pr-4 text-foreground">{r.projectName}</td>
                  <td className="py-2 pr-4 text-foreground font-mono">
                    {formatDuration(r.totalSeconds)}
                  </td>
                  <td className="py-2 pr-4 text-foreground">
                    {formatCurrency(r.billableCents, r.currency)}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {formatCurrency(r.unbilledCents, r.currency)}
                  </td>
                  <td className="py-2 text-right text-muted-foreground">{r.logCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No tracked time in this period.
        </p>
      )}
    </section>
  )
}

export default TimeReportSection
