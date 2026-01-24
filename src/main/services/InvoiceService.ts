// src/main/services/InvoiceService.ts
// Refactored to use Drizzle ORM

import { v4 as uuidv4 } from 'uuid'
import { eq, and, isNull, inArray } from 'drizzle-orm'
import { getDb } from '../db/index'
import { invoices, logs, expenses } from '../db/schema'
import type { Invoice, Log, Expense, InvoiceLineItem } from '../../shared/types'

// --- Invoice Service ---

/**
 * Get all unbilled logs for a project
 */
export async function getUnbilledLogs(projectId: string): Promise<Log[]> {
  const db = getDb()
  const result = db
    .select()
    .from(logs)
    .where(and(eq(logs.projectId, projectId), isNull(logs.invoiceId)))
    .all()

  // Map DB fields to frontend fields
  return result.map((log) => ({
    id: log.id,
    projectId: log.projectId,
    startTime: log.startTime,
    endTime: log.endTime,
    accumulatedTime: log.duration || 0,
    quantity: log.quantity,
    description: log.notes || '',
    invoiceId: log.invoiceId
  })) as Log[]
}

/**
 * Get all unbilled expenses for a project
 */
export async function getUnbilledExpenses(projectId: string): Promise<Expense[]> {
  const db = getDb()
  const result = db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.projectId, projectId),
        isNull(expenses.invoiceId),
        eq(expenses.isBillable, true)
      )
    )
    .all()

  return result as Expense[]
}

/**
 * Create a new invoice and mark logs/expenses as billed
 */
export async function createInvoice(
  invoiceData: Omit<Invoice, 'id'>
): Promise<Invoice> {
  const db = getDb()

  // Extract log and expense IDs from line items
  const logIds = invoiceData.lineItems
    .filter((item) => item.type === 'hourly' || item.type === 'unit')
    .map((item) => item.id)

  const expenseIds = invoiceData.lineItems
    .filter((item) => item.type === 'expense')
    .map((item) => item.id)

  // Use transaction to ensure atomicity
  const newInvoice = db.transaction((tx) => {
    // Insert the invoice
    const invoiceId = uuidv4()
    const invoice = {
      id: invoiceId,
      projectId: invoiceData.projectId,
      invoiceNumber: invoiceData.invoiceNumber,
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      status: invoiceData.status || 'draft',
      subtotal: invoiceData.subtotal,
      tax: invoiceData.taxAmount || 0,
      total: invoiceData.total,
      currency: invoiceData.currency,
      notes: invoiceData.notes || null,
      lineItems: JSON.stringify(invoiceData.lineItems),
      createdAt: new Date()
    }

    tx.insert(invoices)
      .values(invoice as any)
      .run()

    // Mark logs as billed
    if (logIds.length > 0) {
      tx.update(logs)
        .set({ invoiceId: invoiceId })
        .where(inArray(logs.id, logIds))
        .run()
    }

    // Mark expenses as billed
    if (expenseIds.length > 0) {
      tx.update(expenses)
        .set({ invoiceId: invoiceId })
        .where(inArray(expenses.id, expenseIds))
        .run()
    }

    return {
      id: invoiceId,
      projectId: invoice.projectId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxAmount: invoice.tax,
      total: invoice.total,
      currency: invoice.currency,
      notes: invoice.notes || undefined,
      lineItems: invoiceData.lineItems
    } as Invoice
  })

  console.log(`Invoice created: ${newInvoice.id}`)
  return newInvoice
}

/**
 * Get all invoices
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  const db = getDb()
  const result = db.select().from(invoices).all()

  return result.map((inv) => ({
    id: inv.id,
    projectId: inv.projectId,
    invoiceNumber: inv.invoiceNumber,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    status: inv.status as 'draft' | 'sent' | 'paid' | 'overdue',
    subtotal: inv.subtotal,
    taxAmount: inv.tax || 0,
    total: inv.total,
    currency: inv.currency || 'USD',
    notes: inv.notes || undefined,
    lineItems: JSON.parse(inv.lineItems) as InvoiceLineItem[]
  })) as Invoice[]
}

/**
 * Get invoices by project ID
 */
export async function getInvoicesByProject(projectId: string): Promise<Invoice[]> {
  const db = getDb()
  const result = db
    .select()
    .from(invoices)
    .where(eq(invoices.projectId, projectId))
    .all()

  return result.map((inv) => ({
    id: inv.id,
    projectId: inv.projectId,
    invoiceNumber: inv.invoiceNumber,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    status: inv.status as 'draft' | 'sent' | 'paid' | 'overdue',
    subtotal: inv.subtotal,
    taxAmount: inv.tax || 0,
    total: inv.total,
    currency: inv.currency || 'USD',
    notes: inv.notes || undefined,
    lineItems: JSON.parse(inv.lineItems) as InvoiceLineItem[]
  })) as Invoice[]
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const db = getDb()
  const result = db.select().from(invoices).where(eq(invoices.id, id)).get()

  if (!result) return null

  return {
    id: result.id,
    projectId: result.projectId,
    invoiceNumber: result.invoiceNumber,
    issueDate: result.issueDate,
    dueDate: result.dueDate,
    status: result.status as 'draft' | 'sent' | 'paid' | 'overdue',
    subtotal: result.subtotal,
    taxAmount: result.tax || 0,
    total: result.total,
    currency: result.currency || 'USD',
    notes: result.notes || undefined,
    lineItems: JSON.parse(result.lineItems) as InvoiceLineItem[]
  } as Invoice
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  id: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue'
): Promise<Invoice> {
  const db = getDb()

  db.update(invoices).set({ status }).where(eq(invoices.id, id)).run()

  const updated = await getInvoiceById(id)
  if (!updated) {
    throw new Error(`Invoice with id ${id} not found`)
  }

  return updated
}

/**
 * Delete invoice (and unmark logs/expenses as billed)
 */
export async function deleteInvoice(id: string): Promise<void> {
  const db = getDb()

  db.transaction((tx) => {
    // Unmark logs as billed
    tx.update(logs).set({ invoiceId: null }).where(eq(logs.invoiceId, id)).run()

    // Unmark expenses as billed
    tx.update(expenses).set({ invoiceId: null }).where(eq(expenses.invoiceId, id)).run()

    // Delete the invoice
    tx.delete(invoices).where(eq(invoices.id, id)).run()
  })

  console.log(`Invoice deleted: ${id}`)
}
