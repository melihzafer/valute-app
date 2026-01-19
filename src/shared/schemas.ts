// src/shared/schemas.ts
import { z } from 'zod';

// Project Schema
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: "Project name cannot be empty." }),
  hourlyRate: z.number().positive({ message: "Hourly rate must be positive." }),
  currency: z.string().min(3, { message: "Currency must be at least 3 characters long." }).max(3, { message: "Currency must be at most 3 characters long." }),
  status: z.enum(['active', 'archived']),
  createdAt: z.preprocess((arg) => new Date(arg as string), z.date()),
});

// Log Schema
export const LogSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  startTime: z.preprocess((arg) => new Date(arg as string), z.date()),
  endTime: z.preprocess((arg) => arg ? new Date(arg as string) : null, z.date().nullable()),
  accumulatedTime: z.number().nonnegative({ message: "Accumulated time must be non-negative." }),
  description: z.string().default(''),
});

// Invoice Schema
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  issueDate: z.preprocess((arg) => new Date(arg as string), z.date()),
  dueDate: z.preprocess((arg) => new Date(arg as string), z.date()),
  logs: z.array(LogSchema),
  totalHours: z.number().nonnegative({ message: "Total hours must be non-negative." }),
  totalAmount: z.number().nonnegative({ message: "Total amount must be non-negative." }),
  currency: z.string().min(3).max(3),
  status: z.enum(['draft', 'sent', 'paid', 'overdue']),
});
