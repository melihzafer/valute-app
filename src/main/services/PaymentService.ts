// src/main/services/PaymentService.ts

import { v4 as uuidv4 } from 'uuid'
import { eq, desc } from 'drizzle-orm'
import { getDb } from '../db/index'
import { payments } from '../db/schema'
import type { Payment, PaymentMethod } from '../../shared/types'

export async function getPaymentsByClient(clientId: string): Promise<Payment[]> {
  const db = getDb()
  const result = db
    .select()
    .from(payments)
    .where(eq(payments.clientId, clientId))
    .orderBy(desc(payments.date))
    .all()

  return result.map((pmt) => ({
    id: pmt.id,
    clientId: pmt.clientId,
    invoiceId: pmt.invoiceId,
    amount: pmt.amount,
    date: pmt.date as Date,
    method: pmt.method as PaymentMethod,
    reference: pmt.reference || undefined,
    notes: pmt.notes || undefined,
    createdAt: pmt.createdAt as Date
  }))
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  const db = getDb()
  const result = db.select().from(payments).where(eq(payments.id, id)).get()

  if (!result) return null

  return {
    id: result.id,
    clientId: result.clientId,
    invoiceId: result.invoiceId,
    amount: result.amount,
    date: result.date as Date,
    method: result.method as PaymentMethod,
    reference: result.reference || undefined,
    notes: result.notes || undefined,
    createdAt: result.createdAt as Date
  }
}

export async function createPayment(
  paymentData: Omit<Payment, 'id' | 'createdAt'>
): Promise<Payment> {
  const db = getDb()

  const newPayment = {
    id: uuidv4(),
    clientId: paymentData.clientId,
    invoiceId: paymentData.invoiceId || null,
    amount: paymentData.amount,
    date: paymentData.date,
    method: paymentData.method,
    reference: paymentData.reference || null,
    notes: paymentData.notes || null,
    createdAt: new Date()
  }

  db.insert(payments)
    .values(newPayment as any)
    .run()

  return {
    id: newPayment.id,
    clientId: newPayment.clientId,
    invoiceId: newPayment.invoiceId,
    amount: newPayment.amount,
    date: newPayment.date as Date,
    method: newPayment.method as PaymentMethod,
    reference: newPayment.reference || undefined,
    notes: newPayment.notes || undefined,
    createdAt: newPayment.createdAt
  }
}

export async function updatePayment(
  id: string,
  data: Partial<Omit<Payment, 'id' | 'createdAt'>>
): Promise<Payment> {
  const db = getDb()

  const updateData: any = {}
  if (data.clientId !== undefined) updateData.clientId = data.clientId
  if (data.invoiceId !== undefined) updateData.invoiceId = data.invoiceId
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.date !== undefined) updateData.date = data.date
  if (data.method !== undefined) updateData.method = data.method
  if (data.reference !== undefined) updateData.reference = data.reference
  if (data.notes !== undefined) updateData.notes = data.notes

  db.update(payments).set(updateData).where(eq(payments.id, id)).run()

  const updated = db.select().from(payments).where(eq(payments.id, id)).get()

  if (!updated) {
    throw new Error(`Payment with id ${id} not found.`)
  }

  return {
    id: updated.id,
    clientId: updated.clientId,
    invoiceId: updated.invoiceId,
    amount: updated.amount,
    date: updated.date as Date,
    method: updated.method as PaymentMethod,
    reference: updated.reference || undefined,
    notes: updated.notes || undefined,
    createdAt: updated.createdAt as Date
  }
}

export async function deletePayment(id: string): Promise<void> {
  const db = getDb()

  const result = db.delete(payments).where(eq(payments.id, id)).run()

  if (result.changes === 0) {
    throw new Error(`Payment with id ${id} not found.`)
  }
}

export async function getAllPayments(): Promise<Payment[]> {
  const db = getDb()
  const result = db.select().from(payments).orderBy(desc(payments.date)).all()

  return result.map((pmt) => ({
    id: pmt.id,
    clientId: pmt.clientId,
    invoiceId: pmt.invoiceId,
    amount: pmt.amount,
    date: pmt.date as Date,
    method: pmt.method as PaymentMethod,
    reference: pmt.reference || undefined,
    notes: pmt.notes || undefined,
    createdAt: pmt.createdAt as Date
  }))
}
