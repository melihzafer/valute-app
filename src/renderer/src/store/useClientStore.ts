// src/renderer/src/store/useClientStore.ts

import { create } from 'zustand'
import type {
  Client,
  ClientWithBalance,
  LedgerEntry,
  Payment,
  PaymentMethod
} from '../../../shared/types'

interface ClientState {
  clients: ClientWithBalance[]
  currentClient: Client | null
  currentLedger: LedgerEntry[]
  currentPayments: Payment[]
  isLoading: boolean
  error: string | null

  // Actions
  fetchClientsWithBalances: () => Promise<void>
  selectClient: (clientId: string) => Promise<void>
  clearCurrentClient: () => void
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<void>
  updateClient: (id: string, clientData: Partial<Omit<Client, 'createdAt'>>) => Promise<void>
  deleteClient: (id: string) => Promise<void>

  // Ledger actions
  fetchClientLedger: (clientId: string) => Promise<void>

  // Payment actions
  fetchPaymentsByClient: (clientId: string) => Promise<void>
  addPayment: (paymentData: {
    clientId: string
    amount: number
    date: string
    method: PaymentMethod
    invoiceId?: string
    reference?: string
    notes?: string
  }) => Promise<void>
  deletePayment: (id: string) => Promise<void>
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  currentClient: null,
  currentLedger: [],
  currentPayments: [],
  isLoading: false,
  error: null,

  fetchClientsWithBalances: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.getClientsWithBalances()
      if (response.success && response.data) {
        set({ clients: response.data, isLoading: false })
      } else {
        set({ error: response.error || 'Failed to fetch clients', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  selectClient: async (clientId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.getClientById(clientId)
      if (response.success && response.data) {
        set({
          currentClient: {
            ...response.data,
            createdAt: new Date(response.data.createdAt)
          },
          isLoading: false
        })
        // Also fetch ledger and payments
        get().fetchClientLedger(clientId)
        get().fetchPaymentsByClient(clientId)
      } else {
        set({ error: response.error || 'Failed to fetch client', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  clearCurrentClient: () => {
    set({ currentClient: null, currentLedger: [], currentPayments: [] })
  },

  addClient: async (clientData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.createClient(clientData)
      if (response.success && response.data) {
        // Refresh the client list
        await get().fetchClientsWithBalances()
        set({ isLoading: false })
      } else {
        set({ error: response.error || 'Failed to create client', isLoading: false })
        throw new Error(response.error || 'Failed to create client')
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
      throw error
    }
  },

  updateClient: async (id, clientData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.updateClient(id, clientData)
      if (response.success && response.data) {
        const updatedClient = {
          ...response.data,
          createdAt: new Date(response.data.createdAt)
        }
        set((state) => ({
          currentClient: state.currentClient?.id === id ? updatedClient : state.currentClient,
          isLoading: false
        }))
        // Refresh the client list
        await get().fetchClientsWithBalances()
      } else {
        set({ error: response.error || 'Failed to update client', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.deleteClient(id)
      if (response.success) {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          currentClient: state.currentClient?.id === id ? null : state.currentClient,
          isLoading: false
        }))
      } else {
        set({ error: response.error || 'Failed to delete client', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  fetchClientLedger: async (clientId: string) => {
    try {
      const response = await window.api.getClientLedger(clientId)
      if (response.success && response.data) {
        set({ currentLedger: response.data })
      }
    } catch (error: any) {
      console.error('Failed to fetch client ledger:', error)
    }
  },

  fetchPaymentsByClient: async (clientId: string) => {
    try {
      const response = await window.api.getPaymentsByClient(clientId)
      if (response.success && response.data) {
        const payments = response.data.map((p) => ({
          ...p,
          date: new Date(p.date),
          createdAt: new Date(p.createdAt)
        }))
        set({ currentPayments: payments })
      }
    } catch (error: any) {
      console.error('Failed to fetch payments:', error)
    }
  },

  addPayment: async (paymentData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.createPayment(paymentData)
      if (response.success && response.data) {
        // Refresh the client list to update balances
        await get().fetchClientsWithBalances()
        // Refresh current client's ledger if viewing
        if (get().currentClient?.id === paymentData.clientId) {
          await get().fetchClientLedger(paymentData.clientId)
          await get().fetchPaymentsByClient(paymentData.clientId)
        }
        set({ isLoading: false })
      } else {
        set({ error: response.error || 'Failed to create payment', isLoading: false })
        throw new Error(response.error || 'Failed to create payment')
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
      throw error
    }
  },

  deletePayment: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.deletePayment(id)
      if (response.success) {
        // Refresh data
        await get().fetchClientsWithBalances()
        const currentClientId = get().currentClient?.id
        if (currentClientId) {
          await get().fetchClientLedger(currentClientId)
          await get().fetchPaymentsByClient(currentClientId)
        }
        set({ isLoading: false })
      } else {
        set({ error: response.error || 'Failed to delete payment', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  }
}))
