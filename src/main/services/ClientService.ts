// src/main/services/ClientService.ts

import { v4 as uuidv4 } from 'uuid'
import { eq, sql, isNotNull, and, ne } from 'drizzle-orm'
import { getDb } from '../db/index'
import { clients, projects, invoices, payments } from '../db/schema'
import type { Client, ClientBalance, ClientWithBalance, LedgerEntry } from '../../shared/types'

// --- Client CRUD ---

export async function getClients(): Promise<Client[]> {
  const db = getDb()
  const result = db.select().from(clients).all()
  return result as Client[]
}

export async function getClientById(id: string): Promise<Client | null> {
  const db = getDb()
  const result = db.select().from(clients).where(eq(clients.id, id)).get()
  return result ? (result as Client) : null
}

export async function createClient(
  clientData: Omit<Client, 'id' | 'createdAt'>
): Promise<Client> {
  const db = getDb()

  const newClient = {
    id: uuidv4(),
    name: clientData.name,
    company: clientData.company || null,
    email: clientData.email || null,
    phone: clientData.phone || null,
    address: clientData.address || null,
    notes: clientData.notes || null,
    createdAt: new Date()
  }

  db.insert(clients)
    .values(newClient as any)
    .run()

  return newClient as Client
}

export async function updateClient(
  id: string,
  clientData: Partial<Omit<Client, 'id' | 'createdAt'>>
): Promise<Client> {
  const db = getDb()

  const updateData: any = {}
  if (clientData.name !== undefined) updateData.name = clientData.name
  if (clientData.company !== undefined) updateData.company = clientData.company
  if (clientData.email !== undefined) updateData.email = clientData.email
  if (clientData.phone !== undefined) updateData.phone = clientData.phone
  if (clientData.address !== undefined) updateData.address = clientData.address
  if (clientData.notes !== undefined) updateData.notes = clientData.notes

  db.update(clients).set(updateData).where(eq(clients.id, id)).run()

  const updated = db.select().from(clients).where(eq(clients.id, id)).get()

  if (!updated) {
    throw new Error(`Client with id ${id} not found.`)
  }

  return updated as Client
}

export async function deleteClient(id: string): Promise<void> {
  const db = getDb()

  const result = db.delete(clients).where(eq(clients.id, id)).run()

  if (result.changes === 0) {
    throw new Error(`Client with id ${id} not found.`)
  }
}

// --- Balance Calculations ---

export async function getClientBalance(clientId: string): Promise<ClientBalance> {
  const db = getDb()

  // Get all projects for this client
  const clientProjects = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .all()

  const projectIds = clientProjects.map((p) => p.id)

  // Sum all invoice totals for client's projects
  let totalInvoiced = 0
  if (projectIds.length > 0) {
    for (const projectId of projectIds) {
      const invoiceSum = db
        .select({ total: sql<number>`COALESCE(SUM(total), 0)` })
        .from(invoices)
        .where(eq(invoices.projectId, projectId))
        .get()
      totalInvoiced += invoiceSum?.total || 0
    }
  }

  // Sum all payments for this client
  const paymentSum = db
    .select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
    .from(payments)
    .where(eq(payments.clientId, clientId))
    .get()
  const totalPaid = paymentSum?.total || 0

  return {
    clientId,
    totalInvoiced,
    totalPaid,
    balance: totalInvoiced - totalPaid
  }
}

export async function getClientsWithBalances(): Promise<ClientWithBalance[]> {
  const db = getDb()
  const allClients = db.select().from(clients).all()

  const result: ClientWithBalance[] = []

  for (const client of allClients) {
    const balance = await getClientBalance(client.id)

    // Count projects for this client
    const projectCount = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(projects)
      .where(eq(projects.clientId, client.id))
      .get()

    result.push({
      id: client.id,
      name: client.name,
      company: client.company || undefined,
      email: client.email || undefined,
      phone: client.phone || undefined,
      address: client.address || undefined,
      notes: client.notes || undefined,
      createdAt:
        client.createdAt instanceof Date
          ? client.createdAt.toISOString()
          : String(client.createdAt),
      balance: balance.balance,
      projectCount: projectCount?.count || 0
    })
  }

  return result
}

// --- Ledger ---

export async function getClientLedger(clientId: string): Promise<LedgerEntry[]> {
  const db = getDb()

  // Get all projects for this client
  const clientProjects = db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.clientId, clientId))
    .all()

  const projectIds = clientProjects.map((p) => p.id)

  // Get all invoices for client's projects
  const clientInvoices: LedgerEntry[] = []
  if (projectIds.length > 0) {
    for (const projectId of projectIds) {
      const projectInvoices = db.select().from(invoices).where(eq(invoices.projectId, projectId)).all()

      for (const inv of projectInvoices) {
        clientInvoices.push({
          id: `inv-${inv.id}`,
          type: 'invoice',
          date: inv.issueDate instanceof Date ? inv.issueDate.toISOString() : String(inv.issueDate),
          description: `Invoice #${inv.invoiceNumber}`,
          amount: inv.total,
          runningBalance: 0, // Will be calculated below
          referenceId: inv.id
        })
      }
    }
  }

  // Get all payments for this client
  const clientPayments = db.select().from(payments).where(eq(payments.clientId, clientId)).all()

  const paymentEntries: LedgerEntry[] = clientPayments.map((pmt) => ({
    id: `pmt-${pmt.id}`,
    type: 'payment' as const,
    date: pmt.date instanceof Date ? pmt.date.toISOString() : String(pmt.date),
    description: `Payment received${pmt.reference ? ` (Ref: ${pmt.reference})` : ''}`,
    amount: -pmt.amount, // Negative for payments
    runningBalance: 0, // Will be calculated below
    referenceId: pmt.id
  }))

  // Merge and sort chronologically
  const allEntries = [...clientInvoices, ...paymentEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate running balance
  let runningBalance = 0
  for (const entry of allEntries) {
    if (entry.type === 'invoice') {
      runningBalance += entry.amount
    } else {
      runningBalance += entry.amount // Already negative
    }
    entry.runningBalance = runningBalance
  }

  return allEntries
}

// --- Projects by Client ---

export async function getProjectsByClient(clientId: string): Promise<any[]> {
  const db = getDb()
  const result = db.select().from(projects).where(eq(projects.clientId, clientId)).all()

  return result.map((project) => ({
    ...project,
    pricingModel: project.type as any,
    status: project.archived ? 'archived' : 'active'
  }))
}

// --- Migration Helper ---

export async function migrateClientNames(): Promise<{ created: number; linked: number }> {
  const db = getDb()
  let created = 0
  let linked = 0

  // Get projects that have clientName but no clientId
  const projectsToMigrate = db
    .select()
    .from(projects)
    .where(and(isNotNull(projects.clientName), ne(projects.clientName, '')))
    .all()

  // Get unique client names
  const uniqueNames = [...new Set(projectsToMigrate.map((p) => p.clientName).filter(Boolean))]

  for (const clientName of uniqueNames) {
    if (!clientName) continue

    // Check if client already exists with this name
    let existingClient = db.select().from(clients).where(eq(clients.name, clientName)).get()

    if (!existingClient) {
      // Create new client
      const clientId = uuidv4()
      db.insert(clients)
        .values({
          id: clientId,
          name: clientName,
          createdAt: new Date()
        } as any)
        .run()
      created++

      // Update projects with this client name
      const updateResult = db
        .update(projects)
        .set({ clientId: clientId })
        .where(eq(projects.clientName, clientName))
        .run()

      linked += updateResult.changes
    } else {
      // Update projects with this client name
      const updateResult = db
        .update(projects)
        .set({ clientId: existingClient.id })
        .where(eq(projects.clientName, clientName))
        .run()

      linked += updateResult.changes
    }
  }

  return { created, linked }
}
