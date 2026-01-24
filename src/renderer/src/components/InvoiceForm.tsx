// src/renderer/src/components/InvoiceForm.tsx

import React, { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import type { Log, Invoice } from '../../../shared/types'
import { calculateEarnings } from '../lib/utils'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { FileText } from 'lucide-react'

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF']

interface InvoiceFormProps {
  onSubmitInvoice: (invoiceData: Omit<Invoice, 'id'>, pdfBuffer: ArrayBuffer) => Promise<void>
  initialData?: Partial<Invoice>
  selectedLogs: Log[]
  onClose: () => void
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmitInvoice,
  initialData,
  selectedLogs,
  onClose
}) => {
  const { projects } = useProjectStore()
  const [projectId, setProjectId] = useState<string>(initialData?.projectId || '')
  const [issueDate, setIssueDate] = useState<string>(
    initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split('T')[0] : ''
  )
  const [dueDate, setDueDate] = useState<string>(
    initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : ''
  )
  const [currency, setCurrency] = useState<string>(initialData?.currency || 'USD')
  const [error, setError] = useState<string | null>(null)

  const project = projects.find((p) => p.id === projectId)
  const totalHours = selectedLogs.reduce((sum, log) => sum + log.accumulatedTime, 0)
  const totalAmount = project ? calculateEarnings(totalHours, project.hourlyRate) : 0

  const handleGenerateAndSave = async () => {
    setError(null)
    if (!projectId || !issueDate || !dueDate || !project) {
      setError('Please fill in all required fields.')
      return
    }

    // Prepare invoice data using lineItems format
    const invoiceData: Omit<Invoice, 'id'> = {
      projectId,
      invoiceNumber: `INV-${Date.now()}`,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      lineItems: selectedLogs.map((log) => ({
        id: log.id,
        type: 'hourly' as const,
        date: log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
        description: log.description || 'Time entry',
        hours: log.accumulatedTime / 3600,
        hourlyRate: project.hourlyRate,
        amount: Math.round((log.accumulatedTime / 3600) * project.hourlyRate)
      })),
      subtotal: totalAmount,
      total: totalAmount,
      currency: project.currency,
      status: 'draft'
    }

    try {
      // Create an empty ArrayBuffer as placeholder for PDF
      const dummyPdfBuffer = new ArrayBuffer(0)

      await onSubmitInvoice(invoiceData, dummyPdfBuffer)
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate or save invoice.'
      setError(message)
    }
  }

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Create Invoice</h2>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700">
            Project
          </label>
          <Select
            id="projectSelect"
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value)
              const selectedProject = projects.find((p) => p.id === e.target.value)
              if (selectedProject) {
                setCurrency(selectedProject.currency)
              }
            }}
            required
            disabled={!!initialData} // Disable if editing, use projectId from initialData
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
            Issue Date
          </label>
          <Input
            type="date"
            id="issueDate"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            Due Date
          </label>
          <Input
            type="date"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={issueDate} // Due date should be after issue date
            required
          />
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
            Currency
          </label>
          <Select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            required
          >
            {currencies.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-lg font-semibold text-gray-900">
          Total Amount: {calculateEarnings(totalHours, project?.hourlyRate || 0).toFixed(2)}{' '}
          {currency}
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={handleGenerateAndSave}
            disabled={!projectId || !issueDate || !dueDate || !project || selectedLogs.length === 0}
          >
            <FileText className="h-4 w-4 mr-1" /> Generate & Save Invoice
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceForm
