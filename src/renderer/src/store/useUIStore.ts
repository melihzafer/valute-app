// src/renderer/src/store/useUIStore.ts
// Zustand store for UI state management

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  isCmdkOpen: boolean
  theme: 'light' | 'dark'
  pendingNewProject: boolean
  toggleCmdk: () => void
  setCmdkOpen: (open: boolean) => void
  requestNewProject: () => void
  clearNewProject: () => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isCmdkOpen: false,
      theme: 'dark',
      pendingNewProject: false,
      toggleCmdk: () => set((state) => ({ isCmdkOpen: !state.isCmdkOpen })),
      setCmdkOpen: (open: boolean) => set({ isCmdkOpen: open }),
      requestNewProject: () => set({ pendingNewProject: true }),
      clearNewProject: () => set({ pendingNewProject: false }),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        })),
      setTheme: (theme: 'light' | 'dark') => set({ theme })
    }),
    {
      name: 'valute-ui-store',
      partialize: (state) => ({ theme: state.theme })
    }
  )
)
