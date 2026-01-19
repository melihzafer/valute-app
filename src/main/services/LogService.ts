// src/main/services/LogService.ts

import { v4 as uuidv4 } from 'uuid';
import db from '../db/store';
import type { Log } from '../../shared/types';
import { LogSchema } from '../../shared/schemas';

// --- Log Service ---

export async function getLogsByProject(projectId: string): Promise<Log[]> {
  await db.read();
  return db.data.logs.filter(log => log.projectId === projectId);
}

export async function saveLog(logData: Omit<Log, 'id'>): Promise<Log> {
  await db.read();
  const newLog: Log = {
    id: uuidv4(),
    ...logData,
  };
  // Validate using Zod schema before adding
  LogSchema.parse(newLog);
  db.data.logs.push(newLog);
  await db.write();
  return newLog;
}

export async function deleteLog(id: string): Promise<void> {
  await db.read();
  const initialLength = db.data.logs.length;
  db.data.logs = db.data.logs.filter(log => log.id !== id);
  if (db.data.logs.length === initialLength) {
    throw new Error(`Log with id ${id} not found.`);
  }
  await db.write();
}

export async function getLogsByDateRange(startDate: Date, endDate: Date): Promise<Log[]> {
  await db.read();
  return db.data.logs.filter(log => {
    const startTime = new Date(log.startTime);
    return startTime >= startDate && startTime <= endDate;
  });
}
