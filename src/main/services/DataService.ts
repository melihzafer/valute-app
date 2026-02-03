// src/main/services/DataService.ts
// Database export/import service for backup and restore

import { getDb } from '../db/index'
import { projects, clients, logs, expenses, invoices, payments, assets, screenshots } from '../db/schema'
import { app } from 'electron'
import type { DatabaseExport } from '../../shared/types'

/**
 * Export the entire database to a JSON structure
 */
export async function exportDatabase(): Promise<DatabaseExport> {
  const db = getDb()

  // Fetch all data from each table
  const projectsData = db.select().from(projects).all()
  const clientsData = db.select().from(clients).all()
  const logsData = db.select().from(logs).all()
  const expensesData = db.select().from(expenses).all()
  const invoicesData = db.select().from(invoices).all()
  const paymentsData = db.select().from(payments).all()
  const assetsData = db.select().from(assets).all()
  const screenshotsData = db.select().from(screenshots).all()

  // Convert dates to ISO strings for JSON serialization
  const processProjects = projectsData.map((p) => ({
    ...p,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt || '')
  }))

  const processClients = clientsData.map((c) => ({
    ...c,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt || '')
  }))

  const processLogs = logsData.map((l) => ({
    ...l,
    startTime: l.startTime instanceof Date ? l.startTime.toISOString() : String(l.startTime || ''),
    endTime: l.endTime instanceof Date ? l.endTime.toISOString() : l.endTime ? String(l.endTime) : null,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt || '')
  }))

  const processExpenses = expensesData.map((e) => ({
    ...e,
    date: e.date instanceof Date ? e.date.toISOString() : String(e.date || ''),
    createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : String(e.createdAt || '')
  }))

  const processInvoices = invoicesData.map((i) => ({
    ...i,
    issueDate: i.issueDate instanceof Date ? i.issueDate.toISOString() : String(i.issueDate || ''),
    dueDate: i.dueDate instanceof Date ? i.dueDate.toISOString() : String(i.dueDate || ''),
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt || '')
  }))

  const processPayments = paymentsData.map((p) => ({
    ...p,
    date: p.date instanceof Date ? p.date.toISOString() : String(p.date || ''),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt || '')
  }))

  const processAssets = assetsData.map((a) => ({
    ...a,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt || '')
  }))

  const processScreenshots = screenshotsData.map((s) => ({
    ...s,
    timestamp: s.timestamp instanceof Date ? s.timestamp.toISOString() : String(s.timestamp || ''),
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt || '')
  }))

  return {
    version: app.getVersion(),
    exportedAt: new Date().toISOString(),
    data: {
      projects: processProjects as any,
      clients: processClients as any,
      logs: processLogs as any,
      expenses: processExpenses as any,
      invoices: processInvoices as any,
      payments: processPayments as any,
      assets: processAssets as any,
      screenshots: processScreenshots as any
    }
  }
}

/**
 * Import database from a backup JSON structure
 * WARNING: This will clear existing data!
 */
export async function importDatabase(
  data: DatabaseExport
): Promise<{ success: boolean; counts: Record<string, number> }> {
  const db = getDb()
  const counts: Record<string, number> = {
    clients: 0,
    projects: 0,
    logs: 0,
    expenses: 0,
    invoices: 0,
    payments: 0,
    assets: 0,
    screenshots: 0
  }

  try {
    // Clear existing data in reverse dependency order
    db.delete(screenshots).run()
    db.delete(assets).run()
    db.delete(payments).run()
    db.delete(expenses).run()
    db.delete(logs).run()
    db.delete(invoices).run()
    db.delete(projects).run()
    db.delete(clients).run()

    // Import clients first (no foreign keys)
    if (data.data.clients) {
      for (const client of data.data.clients) {
        db.insert(clients)
          .values({
            id: client.id,
            name: client.name,
            company: client.company || null,
            email: client.email || null,
            phone: client.phone || null,
            address: client.address || null,
            notes: client.notes || null,
            createdAt: new Date(client.createdAt)
          })
          .run()
        counts.clients++
      }
    }

    // Import projects (references clients)
    if (data.data.projects) {
      for (const project of data.data.projects) {
        db.insert(projects)
          .values({
            id: project.id,
            name: project.name,
            clientId: (project as any).clientId || null,
            clientName: project.clientName || null,
            type: project.pricingModel || 'HOURLY',
            currency: project.currency || 'USD',
            hourlyRate: project.hourlyRate || 0,
            fixedPrice: project.fixedPrice || null,
            unitName: project.unitName || null,
            archived: project.status === 'archived' ? 1 : 0,
            notes: project.notes || null,
            createdAt: new Date(project.createdAt)
          } as any)
          .run()
        counts.projects++
      }
    }

    // Import invoices (references projects)
    if (data.data.invoices) {
      for (const invoice of data.data.invoices) {
        db.insert(invoices)
          .values({
            id: invoice.id,
            projectId: invoice.projectId,
            invoiceNumber: invoice.invoiceNumber,
            issueDate: new Date(invoice.issueDate),
            dueDate: new Date(invoice.dueDate),
            status: invoice.status || 'draft',
            subtotal: invoice.subtotal,
            tax: invoice.taxAmount || null,
            total: invoice.total,
            currency: invoice.currency || 'USD',
            notes: invoice.notes || null,
            lineItems: JSON.stringify(invoice.lineItems),
            createdAt: new Date()
          } as any)
          .run()
        counts.invoices++
      }
    }

    // Import logs (references projects, invoices)
    if (data.data.logs) {
      for (const log of data.data.logs) {
        db.insert(logs)
          .values({
            id: log.id,
            projectId: log.projectId,
            startTime: new Date(log.startTime),
            endTime: log.endTime ? new Date(log.endTime) : null,
            duration: log.accumulatedTime || 0,
            notes: log.description || '',
            quantity: log.quantity || null,
            invoiceId: log.invoiceId || null,
            createdAt: new Date()
          } as any)
          .run()
        counts.logs++
      }
    }

    // Import expenses (references projects, invoices)
    if (data.data.expenses) {
      for (const expense of data.data.expenses) {
        db.insert(expenses)
          .values({
            id: expense.id,
            projectId: expense.projectId,
            description: expense.description,
            amount: expense.amount,
            isBillable: expense.isBillable ? 1 : 0,
            date: new Date(expense.date),
            invoiceId: expense.invoiceId || null,
            createdAt: new Date()
          } as any)
          .run()
        counts.expenses++
      }
    }

    // Import payments (references clients, invoices)
    if (data.data.payments) {
      for (const payment of data.data.payments) {
        db.insert(payments)
          .values({
            id: payment.id,
            clientId: payment.clientId,
            invoiceId: payment.invoiceId || null,
            amount: payment.amount,
            date: new Date(payment.date),
            method: payment.method,
            reference: payment.reference || null,
            notes: payment.notes || null,
            createdAt: new Date(payment.createdAt)
          } as any)
          .run()
        counts.payments++
      }
    }

    // Import assets (references projects)
    if (data.data.assets) {
      for (const asset of data.data.assets) {
        db.insert(assets)
          .values({
            id: asset.id,
            projectId: asset.projectId,
            name: asset.name,
            path: asset.path,
            type: asset.type,
            createdAt: new Date(asset.createdAt)
          } as any)
          .run()
        counts.assets++
      }
    }

    // Import screenshots (references projects, logs)
    if (data.data.screenshots) {
      for (const screenshot of data.data.screenshots) {
        db.insert(screenshots)
          .values({
            id: screenshot.id,
            projectId: screenshot.projectId,
            logId: screenshot.logId || null,
            filePath: screenshot.filePath,
            timestamp: new Date(screenshot.timestamp),
            createdAt: new Date(screenshot.createdAt)
          } as any)
          .run()
        counts.screenshots++
      }
    }

    return { success: true, counts }
  } catch (error) {
    console.error('Import failed:', error)
    throw error
  }
}
