// src/renderer/src/store/useUIStore.ts
// Zustand store for UI state management

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isCmdkOpen: boolean;
  theme: 'light' | 'dark';
  toggleCmdk: () => void;
  setCmdkOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isCmdkOpen: false,
      theme: 'dark',
      toggleCmdk: () => set((state) => ({ isCmdkOpen: !state.isCmdkOpen })),
      setCmdkOpen: (open: boolean) => set({ isCmdkOpen: open }),
      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
    }),
    {
      name: 'valute-ui-store',
    }
  )
);
