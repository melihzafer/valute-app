// src/renderer/src/lib/invoiceGenerator.ts

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Project, Log, Invoice } from '../../../shared/types'
import { calculateEarnings } from './utils'

// Helper to format currency, assuming it's available or defined elsewhere if not using Intl.NumberFormat directly
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat(undefined, {
    // Use undefined for system default locale
    style: 'currency',
    currency: currency
  }).format(amount)
}

export const generateInvoicePDF = (
  invoiceData: Omit<Invoice, 'id'>,
  project: Project,
  logs: Log[]
): jsPDF => {
  const doc = new jsPDF()
  let yPos = 15 // Starting Y position

  // --- Header ---
  doc.setFontSize(18)
  doc.text('Vault - Invoice', 14, yPos)
  yPos += 10

  doc.setFontSize(12)
  doc.text(`Project: ${project.name}`, 14, yPos)
  yPos += 7
  doc.text(`Invoice Date: ${invoiceData.issueDate.toLocaleDateString()}`, 14, yPos)
  yPos += 7
  doc.text(`Due Date: ${invoiceData.dueDate.toLocaleDateString()}`, 14, yPos)
  yPos += 15

  // --- Summary ---
  let totalHours = 0
  logs.forEach((log) => {
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
  doc.text(`Total Earnings: ${formatCurrency(totalEarnings, project.currency)}`, 14, yPos)
  yPos += 15

  // --- Detailed Log Table ---
  const tableColumn = [
    { header: 'Date', dataKey: 'date' },
    { header: 'Start Time', dataKey: 'startTime' },
    { header: 'End Time', dataKey: 'endTime' },
    { header: 'Duration', dataKey: 'duration' },
    { header: 'Description', dataKey: 'description' }
  ]

  const tableRows = logs.map((log) => {
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
  ;(doc as any).autoTable({
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [200, 200, 200], // Light grey header
      textColor: [0, 0, 0], // Black text
      fontStyle: 'bold'
    },
    columnStyles: {
      date: { cellWidth: 30 },
      startTime: { cellWidth: 35 },
      endTime: { cellWidth: 35 },
      duration: { cellWidth: 35, halign: 'right' },
      description: { cellWidth: 'auto' } // Auto width for description
    },
    didParseCell: (data: {
      column: { dataKey: string }
      cell: { raw: string; text: string[] }
    }) => {
      // Wrap long descriptions
      if (data.column.dataKey === 'description' && data.cell.raw.length > 50) {
        data.cell.text = doc.splitTextToSize(data.cell.raw, 150)
      }
    },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 10, fontStyle: 'normal' }
  })

  return doc
}
