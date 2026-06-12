// src/renderer/src/components/ProjectInvoicePanel.tsx
// Project-level invoicing: shows unbilled total and generates an invoice from
// unbilled logs in a single click (M3 entry point), plus lists existing invoices.

import React, { useState, useEffect, useCallback } from 'react'
import type { Project, Invoice, InvoiceIPC, LogIPC } from '../../../shared/types'
import { generateInvoicePDF } from '../lib/invoiceGenerator'
import { formatCurrency } from '../lib/utils'
import { Button } from './ui/Button'
import InvoiceList from './InvoiceList'
import { FilePlus, Loader2 } from 'lucide-react'

interface ProjectInvoicePanelProps {
  project: Project
}

const ProjectInvoicePanel: React.FC<ProjectInvoicePanelProps> = ({ project }) => {
  const [unbilledLogs, setUnbilledLogs] = useState<LogIPC[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [logsRes, invRes] = await Promise.all([
      window.api.getUnbilledLogs(project.id),
      window.api.getInvoicesByProject(project.id)
    ])
    if (logsRes.success && logsRes.data) setUnbilledLogs(logsRes.data)
    if (invRes.success && invRes.data) {
      setInvoices(
        invRes.data.map((inv) => ({
          ...inv,
          issueDate: new Date(inv.issueDate),
          dueDate: new Date(inv.dueDate)
        })) as unknown as Invoice[]
      )
    }
  }, [project.id])

  useEffect(() => {
    refresh()
  }, [refresh])

  const unbilledSeconds = unbilledLogs.reduce((s, l) => s + (l.accumulatedTime || 0), 0)
  const unbilledCents = Math.round((unbilledSeconds / 3600) * (project.hourlyRate || 0))

  const handleGenerate = async () => {
    if (unbilledLogs.length === 0) return
    setError(null)
    setIsGenerating(true)
    try {
      const issueDate = new Date()
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      const invoiceData: Omit<InvoiceIPC, 'id'> = {
        projectId: project.id,
        invoiceNumber: `INV-${Date.now()}`,
        issueDate: issueDate.toISOString(),
        dueDate: dueDate.toISOString(),
        lineItems: unbilledLogs.map((log) => ({
          id: log.id,
          type: 'hourly' as const,
          date: typeof log.startTime === 'string' ? log.startTime : String(log.startTime),
          description: log.description || 'Time entry',
          hours: log.accumulatedTime / 3600,
          hourlyRate: project.hourlyRate,
          amount: Math.round((log.accumulatedTime / 3600) * project.hourlyRate)
        })),
        subtotal: unbilledCents,
        total: unbilledCents,
        currency: project.currency,
        status: 'draft'
      }

      // Build a PDF so the user is prompted to save it alongside the DB record.
      const logsForPdf = unbilledLogs.map((l) => ({
        ...l,
        startTime: new Date(l.startTime),
        endTime: l.endTime ? new Date(l.endTime) : null
      })) as any
      const doc = generateInvoicePDF(
        { ...invoiceData, issueDate, dueDate } as any,
        project,
        logsForPdf
      )
      const pdfBuffer = doc.output('arraybuffer') as ArrayBuffer

      const res = await window.api.createInvoice(invoiceData, pdfBuffer)
      if (!res.success) {
        setError(res.error || 'Failed to create invoice.')
      } else {
        await refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate invoice.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMarkAsPaid = async (id: string) => {
    await window.api.updateInvoiceStatus(id, 'paid')
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return
    await window.api.deleteInvoice(id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Unbilled summary + one-click generate */}
      <div className="bg-card border border-border/50 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Unbilled work</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(unbilledCents, project.currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {unbilledLogs.length} log{unbilledLogs.length === 1 ? '' : 's'} ·{' '}
            {Math.floor(unbilledSeconds / 3600)}h {Math.floor((unbilledSeconds % 3600) / 60)}m
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={unbilledLogs.length === 0 || isGenerating}>
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FilePlus className="mr-2 h-4 w-4" />
          )}
          Generate Invoice
        </Button>
      </div>

      {/* Existing invoices */}
      <div>
        <h3 className="text-lg font-medium text-foreground mb-3">Invoices</h3>
        <InvoiceList
          invoices={invoices}
          projects={[project]}
          onViewInvoice={() => {}}
          onEditInvoice={() => {}}
          onDeleteInvoice={handleDelete}
          onMarkAsPaid={handleMarkAsPaid}
        />
      </div>
    </div>
  )
}

export default ProjectInvoicePanel
