// src/renderer/src/pages/ReportsPage.tsx

import React, { useState, useEffect } from 'react'
import type { Log, InvoiceIPC } from '../../../shared/types'
import { useProjectStore } from '../store/useProjectStore'
import { calculateEarnings } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { CalendarDays, FileText, Filter, X } from 'lucide-react'
import LogList from '../components/LogList'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const ReportsPage: React.FC = () => {
  const { projects, fetchProjects } = useProjectStore()

  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([])
  const [reportError, setReportError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    // Optionally load timer state if relevant for reports
    // loadTimerState();
  }, [fetchProjects])

  const handleFetchLogs = async () => {
    setReportError(null)
    if (!startDate || !endDate || !selectedProjectId) {
      setReportError('Please select a project, start date, and end date.')
      return
    }

    try {
      console.log('[ReportsPage] Fetching logs with:', { startDate, endDate, selectedProjectId })
      const response = await window.api.getLogsForInvoice(startDate, endDate, selectedProjectId)
      console.log('[ReportsPage] Response:', response)
      if (response.success && response.data) {
        const parsedLogs = response.data.map((log) => ({
          ...log,
          startTime: new Date(log.startTime),
          endTime: log.endTime ? new Date(log.endTime) : null
        }))
        console.log('[ReportsPage] Parsed logs:', parsedLogs.length)
        setFilteredLogs(parsedLogs)
      } else {
        setReportError(response.error || 'Failed to fetch logs for report.')
        setFilteredLogs([])
      }
    } catch (error) {
      console.error('Error fetching logs for report:', error)
      setReportError('An error occurred while fetching logs.')
      setFilteredLogs([])
    }
  }

  const handleGeneratePDF = async () => {
    if (!selectedProjectId || filteredLogs.length === 0) {
      setReportError('Cannot generate PDF: No project selected or no logs found for the period.')
      return
    }

    const project = projects.find((p) => p.id === selectedProjectId)
    if (!project) {
      setReportError('Selected project not found.')
      return
    }

    const doc = new jsPDF()
    let yPos = 15 // Starting Y position

    // --- Header ---
    doc.setFontSize(18)
    doc.text('Vault - Time Tracking Report', 14, yPos)
    yPos += 10

    doc.setFontSize(12)
    doc.text(`Project: ${project.name}`, 14, yPos)
    yPos += 7
    doc.text(
      `Period: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`,
      14,
      yPos
    )
    yPos += 15

    // --- Summary ---
    let totalHours = 0
    filteredLogs.forEach((log) => {
      totalHours += log.accumulatedTime
    })
    const totalEarnings = calculateEarnings(totalHours, project.hourlyRate)

    doc.setFontSize(14)
    doc.text('Summary:', 14, yPos)
    yPos += 7
    doc.text(
      `Total Hours: ${Math.floor(totalHours / 3600)}h ${Math.floor((totalHours % 3600) / 60)}m`,
      14,
      yPos
    ) 
    yPos += 7
    //i want total earning to be shown as 100.00 instead of 10000
    doc.text(`Total Earnings: ${(totalEarnings / 100).toFixed(2)} ${project.currency}`, 14, yPos)
    yPos += 15

    // --- Detailed Log Table ---
    const tableColumn = [
      { header: 'Date', dataKey: 'date' },
      { header: 'Start Time', dataKey: 'startTime' },
      { header: 'End Time', dataKey: 'endTime' },
      { header: 'Duration', dataKey: 'duration' },
      { header: 'Description', dataKey: 'description' }
    ]
    const tableRows = filteredLogs.map((log) => {
      const logStartTime = new Date(log.startTime)
      const logEndTime = log.endTime ? new Date(log.endTime) : null
      const durationHours = Math.floor(log.accumulatedTime / 3600)
      const durationMinutes = Math.floor((log.accumulatedTime % 3600) / 60)
      const durationSeconds = log.accumulatedTime % 60
      const durationString = `${durationHours}h ${durationMinutes}m ${durationSeconds}s`

      return {
        date: logStartTime.toLocaleDateString(),
        startTime: logStartTime.toLocaleTimeString(),
        endTime: logEndTime ? logEndTime.toLocaleTimeString() : '-',
        duration: durationString,
        description: log.description || '-'
      }
    })

    // Add the table to the PDF
    autoTable(doc, {
      startY: yPos,
      head: [tableColumn.map(col => col.header)],
      body: tableRows.map(row => tableColumn.map(col => row[col.dataKey])),
      theme: 'striped',
      headStyles: {
        fillColor: [240, 240, 240], // Lighter, more neutral gray
        textColor: [30, 30, 30], // Softer black
        fontStyle: 'bold'
      },
      columnStyles: {
        date: { cellWidth: 30 },
        startTime: { cellWidth: 35 },
        endTime: { cellWidth: 35 },
        duration: { cellWidth: 35, halign: 'right' },
        description: { cellWidth: 'auto' } // Auto width for description
      },
      didParseCell: (data: any) => {
        // Wrap long descriptions
        if (data.column.dataKey === 'description' && data.cell.raw && data.cell.raw.length > 50) {
          data.cell.text = doc.splitTextToSize(data.cell.raw, 150)
        }
      },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10, fontStyle: 'normal' }
    })

    // --- Footer / Save Prompt ---
    // In a real app, you'd call window.api.saveInvoice here with the PDF buffer.
    // For now, we just log that it would be generated.
    console.log('PDF generated. Would now prompt user to save.')

    // Example: Calling saveInvoice (requires pdfBuffer, which we don't have directly here)
    // const pdfOutput = doc.output('arraybuffer'); // Get PDF as ArrayBuffer
    // window.api.saveInvoice(new Uint8Array(pdfOutput));

    // Convert the ArrayBuffer to Uint8Array then to ArrayBuffer for IPC
    const pdfArrayBuffer = doc.output('arraybuffer') as ArrayBuffer
    // Create invoice data for saving
    const invoiceData: Omit<InvoiceIPC, 'id'> = {
      projectId: selectedProjectId,
      invoiceNumber: `RPT-${Date.now()}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems: filteredLogs.map((log) => ({
        id: log.id,
        type: 'hourly' as const,
        date: log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
        description: log.description || 'Time entry',
        hours: log.accumulatedTime / 3600,
        hourlyRate: project?.hourlyRate || 0,
        amount: Math.round((log.accumulatedTime / 3600) * (project?.hourlyRate || 0))
      })),
      subtotal: Math.round(totalEarnings * 100),
      total: Math.round(totalEarnings * 100),
      currency: project?.currency || 'USD',
      status: 'draft'
    }
    // Call the IPC handler to save the invoice with proper async feedback
    try {
      const response = await window.api.createInvoice(invoiceData, pdfArrayBuffer)
      if (response.success) {
        alert('Invoice PDF generated and saved successfully!')
        // Optionally refresh invoice list or navigate
      } else {
        setReportError(response.error || 'Failed to save invoice PDF')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      setReportError('An error occurred while saving the invoice PDF')
    }
  }

  return (
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-foreground mb-8">Reports</h1>

      <section className="mb-8 p-6 bg-card border border-border rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-foreground mb-4">Generate Report</h2>
        {reportError && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{reportError}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-700"
              onClick={() => setReportError(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div>
            <label htmlFor="projectSelect" className="block text-sm font-medium text-foreground">
              Project
            </label>
            <select
              id="projectSelect"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-border bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
            >
              <option value="" disabled>
                Select a project
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
              Start Date
            </label>
            <div className="relative">
              <Input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pr-10"
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground">
              End Date
            </label>
            <div className="relative">
              <Input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate} // End date should be after start date
                className="pr-10"
              />
              <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={handleFetchLogs}>
            <Filter className="h-4 w-4 mr-1" /> Filter Logs
          </Button>
          <Button
            onClick={handleGeneratePDF}
            disabled={filteredLogs.length === 0 || !selectedProjectId}
          >
            <FileText className="h-4 w-4 mr-1" /> Generate PDF Report
          </Button>
        </div>
      </section>

      {/* Display Filtered Logs */}
      {filteredLogs.length > 0 && (
        <section className="p-6 bg-card border border-border rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Filtered Time Logs</h2>
          <LogList
            logs={filteredLogs}
            projects={projects}
            onEditLog={() => {}} // Not implementing edit/delete from report view for now
            onDeleteLog={() => {}}
          />
        </section>
      )}
    </div>
  )
}

export default ReportsPage
