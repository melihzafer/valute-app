// src/shared/schemas.ts
import { z } from 'zod'

// Pricing Model Schema
export const PricingModelSchema = z.enum(['HOURLY', 'FIXED', 'UNIT_BASED', 'SUBSCRIPTION'])

// Base Project Schema (without refinements - can be used with .omit())
export const ProjectSchemaBase = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: 'Project name cannot be empty.' }),
  clientName: z.string().optional(),
  pricingModel: PricingModelSchema,
  hourlyRate: z.number().nonnegative({ message: 'Rate must be non-negative.' }),
  fixedPrice: z.number().positive().optional(),
  currency: z
    .string()
    .min(3, { message: 'Currency must be at least 3 characters long.' })
    .max(3, { message: 'Currency must be at most 3 characters long.' }),
  unitName: z.string().min(1).optional(),
  status: z.enum(['active', 'archived']),
  createdAt: z.preprocess((arg) => new Date(arg as string), z.date())
})

// Project Schema with refinements (for full validation)
export const ProjectSchema = ProjectSchemaBase.refine(
  (data) => {
    // If UNIT_BASED, unitName is required and hourlyRate must be positive
    if (data.pricingModel === 'UNIT_BASED') {
      return !!data.unitName && data.hourlyRate > 0
    }
    // If FIXED, fixedPrice is required and must be positive
    if (data.pricingModel === 'FIXED') {
      return !!data.fixedPrice && data.fixedPrice > 0
    }
    // If HOURLY, hourlyRate must be positive
    if (data.pricingModel === 'HOURLY') {
      return data.hourlyRate > 0
    }
    return true
  },
  {
    message: 'Invalid pricing configuration: check required fields for selected pricing model'
  }
)

// Log Schema
export const LogSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  startTime: z.preprocess((arg) => new Date(arg as string), z.date()),
  endTime: z.preprocess((arg) => (arg ? new Date(arg as string) : null), z.date().nullable()),
  accumulatedTime: z.number().nonnegative({ message: 'Accumulated time must be non-negative.' }),
  quantity: z.number().positive().optional(),
  description: z.string().default('')
})

// Invoice Schema
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  issueDate: z.preprocess((arg) => new Date(arg as string), z.date()),
  dueDate: z.preprocess((arg) => new Date(arg as string), z.date()),
  logs: z.array(LogSchema),
  totalHours: z.number().nonnegative({ message: 'Total hours must be non-negative.' }),
  totalAmount: z.number().nonnegative({ message: 'Total amount must be non-negative.' }),
  currency: z.string().min(3).max(3),
  status: z.enum(['draft', 'sent', 'paid', 'overdue'])
})
