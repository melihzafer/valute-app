// src/renderer/src/store/useToastStore.ts
// Lightweight toast/notification store (bottom-right toasts)

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType, duration?: number) => string
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  addToast: (message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }))
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    }
    return id
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  }
}))

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast(message, 'success', duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast(message, 'error', duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast(message, 'info', duration)
}
