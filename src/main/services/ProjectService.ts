// src/main/services/ProjectService.ts
// Updated to use Drizzle ORM

import { v4 as uuidv4 } from 'uuid';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getDb } from '../db/index';
import { projects, logs, invoices } from '../db/schema';
import type { Project, Log, Invoice } from '../../shared/types';

// --- Project Service ---

export async function getProjects(): Promise<Project[]> {
  const db = getDb();
  const result = db.select().from(projects).all();

  // Map database 'type' to frontend 'pricingModel'
  return result.map(project => ({
    ...project,
    pricingModel: project.type as any,
    status: project.archived ? 'archived' : 'active',
  })) as Project[];
}

export async function createProject(projectData: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
  const db = getDb();

  // MAP frontend 'pricingModel' to database 'type' column
  const newProject = {
    id: uuidv4(),
    name: projectData.name,
    clientName: projectData.clientName || null,
    type: projectData.pricingModel || 'HOURLY', // CRITICAL FIX: Map pricingModel to type
    currency: projectData.currency || 'USD',
    hourlyRate: projectData.hourlyRate || 0,
    fixedPrice: projectData.fixedPrice || null,
    unitName: projectData.unitName || null,
    archived: projectData.status === 'archived' ? 1 : 0,
    assetsPath: null, // Optional field
    createdAt: new Date(),
  };

  db.insert(projects).values(newProject as any).run();

  // Return with frontend-expected field name
  return {
    ...newProject,
    pricingModel: newProject.type as any,
    status: newProject.archived ? 'archived' : 'active',
  } as Project;
}

export async function updateProject(id: string, projectData: Partial<Omit<Project, 'createdAt'>>): Promise<Project> {
  const db = getDb();

  // Map frontend fields to database columns
  const updateData: any = {
    name: projectData.name,
    clientName: projectData.clientName,
    type: projectData.pricingModel, // Map pricingModel to type
    currency: projectData.currency,
    hourlyRate: projectData.hourlyRate,
    fixedPrice: projectData.fixedPrice,
    unitName: projectData.unitName,
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  // Convert status to archived flag if present
  if (projectData.status !== undefined) {
    updateData.archived = projectData.status === 'archived' ? 1 : 0;
  }

  db.update(projects)
    .set(updateData)
    .where(eq(projects.id, id))
    .run();

  const updated = db.select().from(projects).where(eq(projects.id, id)).get();

  if (!updated) {
    throw new Error(`Project with id ${id} not found.`);
  }

  // Map back to frontend format
  return {
    ...updated,
    pricingModel: updated.type as any,
    status: updated.archived ? 'archived' : 'active',
  } as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb();

  const result = db.delete(projects)
    .where(eq(projects.id, id))
    .run();

  if (result.changes === 0) {
    throw new Error(`Project with id ${id} not found.`);
  }

  // Foreign keys with CASCADE will automatically delete related logs and invoices
}

// --- Log Service ---

export async function getLogsByProject(projectId: string): Promise<Log[]> {
  const db = getDb();
  const result = db.select()
    .from(logs)
    .where(eq(logs.projectId, projectId))
    .all();

  return result as Log[];
}

export async function saveLog(logData: Omit<Log, 'id'>): Promise<Log> {
  const db = getDb();

  const newLog = {
    id: uuidv4(),
    ...logData,
    startTime: logData.startTime,
    endTime: logData.endTime,
    accumulatedTime: logData.accumulatedTime,
    description: logData.description || '',
  };

  db.insert(logs).values(newLog as any).run();

  return newLog as Log;
}

export async function deleteLog(id: string): Promise<void> {
  const db = getDb();

  const result = db.delete(logs)
    .where(eq(logs.id, id))
    .run();

  if (result.changes === 0) {
    throw new Error(`Log with id ${id} not found.`);
  }
}

export async function getLogsByDateRange(startDate: Date, endDate: Date): Promise<Log[]> {
  const db = getDb();

  const startTimestamp = startDate.getTime();
  const endTimestamp = endDate.getTime();

  const result = db.select()
    .from(logs)
    .where(
      and(
        gte(logs.startTime, startTimestamp as any),
        lte(logs.startTime, endTimestamp as any)
      )
    )
    .all();

  return result as Log[];
}

// --- Invoice Service ---

export async function saveInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<Invoice> {
  const db = getDb();

  const newInvoice = {
    id: uuidv4(),
    ...invoiceData,
    issueDate: invoiceData.issueDate,
    dueDate: invoiceData.dueDate,
    // Serialize logs as JSON for storage
    logs: JSON.stringify(invoiceData.logs),
  };

  db.insert(invoices).values(newInvoice as any).run();

  return {
    ...newInvoice,
    logs: invoiceData.logs, // Return original logs array
  } as Invoice;
}

export async function getInvoicesByProject(projectId: string): Promise<Invoice[]> {
  const db = getDb();

  const result = db.select()
    .from(invoices)
    .where(eq(invoices.projectId, projectId))
    .all();

  // Parse logs JSON back to array
  return result.map(inv => ({
    ...inv,
    logs: JSON.parse(inv.logs as string),
  })) as Invoice[];
}
