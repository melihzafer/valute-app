// src/renderer/src/store/useInvoiceStore.ts

import { create } from 'zustand';
import type { Invoice, Log, InvoiceIPC, IPCResponse } from '../../../shared/types';

interface InvoiceStore {
  invoices: Invoice[];
  selectedLogsForInvoice: Log[];
  isLoading: boolean;
  error: string | null;
  fetchInvoices: () => Promise<void>;
  generateAndSaveInvoice: (invoiceData: Omit<InvoiceIPC, 'id'>, pdfBuffer: ArrayBuffer) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  markInvoiceAsPaid: (invoiceId: string) => Promise<void>;
  setSelectedLogsForInvoice: (logs: Log[]) => void;
  clearSelectedLogsForInvoice: () => void;
}

export const useInvoiceStore = create<InvoiceStore>((set) => ({
  invoices: [],
  selectedLogsForInvoice: [],
  isLoading: false,
  error: null,

  fetchInvoices: async () => {
    set({ isLoading: true, error: null });
    try {
      // Assuming an API call to fetch invoices exists
      const response: IPCResponse<InvoiceIPC[]> = { success: true, data: [] };
      if (response.success && response.data) {
        const parsedInvoices: Invoice[] = response.data.map(inv => ({
          ...inv,
          issueDate: new Date(inv.issueDate),
          dueDate: new Date(inv.dueDate),
          logs: inv.logs.map(log => ({
            ...log,
            startTime: new Date(log.startTime),
            endTime: log.endTime ? new Date(log.endTime) : null
          }))
        }));
        set({ invoices: parsedInvoices, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch invoices', isLoading: false });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      set({ error: message, isLoading: false });
    }
  },

  generateAndSaveInvoice: async (invoiceData, pdfBuffer) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.saveInvoice(invoiceData, pdfBuffer);
      if (response.success && response.data) {
        const newInvoice: Invoice = {
          ...response.data,
          issueDate: new Date(response.data.issueDate),
          dueDate: new Date(response.data.dueDate),
          logs: response.data.logs.map(log => ({
            ...log,
            startTime: new Date(log.startTime),
            endTime: log.endTime ? new Date(log.endTime) : null
          }))
        };
        set(state => ({ invoices: [...state.invoices, newInvoice], isLoading: false }));
      } else {
        set({ error: response.error || 'Failed to generate invoice', isLoading: false });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      set({ error: message, isLoading: false });
    }
  },

  deleteInvoice: async (invoiceId) => {
    set({ isLoading: true, error: null });
    try {
      // Assuming an API call to delete invoices exists, e.g., window.api.deleteInvoice(invoiceId)
      // Replace with actual API call if available
      await Promise.resolve(); // Mock API call

      set(state => ({
        invoices: state.invoices.filter(inv => inv.id !== invoiceId),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete invoice', isLoading: false });
    }
  },

  markInvoiceAsPaid: async (invoiceId) => {
    set({ isLoading: true, error: null });
    try {
      // Assuming an API call to update invoice status exists, e.g., window.api.updateInvoiceStatus(invoiceId, 'paid')
      // Replace with actual API call if available
      await Promise.resolve(); // Mock API call

      set(state => ({
        invoices: state.invoices.map(inv =>
          inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark invoice as paid', isLoading: false });
    }
  },

  setSelectedLogsForInvoice: (logs: Log[]) => {
    set({ selectedLogsForInvoice: logs });
  },

  clearSelectedLogsForInvoice: () => {
    set({ selectedLogsForInvoice: [] });
  },
}));
