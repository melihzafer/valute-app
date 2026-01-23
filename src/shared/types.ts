// src/shared/types.ts

export type PricingModel = 'HOURLY' | 'FIXED' | 'UNIT_BASED' | 'SUBSCRIPTION';

export interface Project {
  id: string;
  name: string;
  clientName?: string;
  pricingModel: PricingModel;
  hourlyRate: number; // For HOURLY, or price per unit for UNIT_BASED (in cents)
  fixedPrice?: number; // For FIXED pricing (in cents)
  currency: string;
  unitName?: string; // For UNIT_BASED: "Page", "Article", "Video", etc.
  status: 'active' | 'archived';
  createdAt: Date;
}

// IPC-safe version with string dates for serialization
export interface ProjectIPC {
  id: string;
  name: string;
  clientName?: string;
  pricingModel: PricingModel;
  hourlyRate: number;
  fixedPrice?: number;
  currency: string;
  unitName?: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Log {
  id: string;
  projectId: string;
  startTime: Date;
  endTime: Date | null;
  accumulatedTime: number; // in seconds (for HOURLY)
  quantity?: number; // for UNIT_BASED tracking (e.g., 1.5 pages)
  description: string;
}

// IPC-safe version with string dates for serialization
export interface LogIPC {
  id: string;
  projectId: string;
  startTime: string;
  endTime: string | null;
  accumulatedTime: number;
  quantity?: number;
  description: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  issueDate: Date;
  dueDate: Date;
  logs: Log[];
  totalHours: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

// IPC-safe version with string dates for serialization
export interface InvoiceIPC {
  id: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  logs: LogIPC[];
  totalHours: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}

export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  accumulatedTime: number;
  startTime: number | null;
  projectId: string | null;
  description: string | null;
  currentProjectName: string | null;
}
