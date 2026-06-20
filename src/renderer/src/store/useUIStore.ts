// src/renderer/src/store/useUIStore.ts
// Zustand store for UI state management

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeId, CustomTheme } from '../lib/themes'
import { isDarkTheme } from '../lib/themes'

interface UIState {
  isCmdkOpen: boolean
  theme: ThemeId
  customTheme: CustomTheme
  /** Root font size in px — Tailwind rem tabanli oldugu icin tum UI olceklenir */
  fontScale: number
  sidebarCollapsed: boolean
  pendingNewProject: boolean
  setFontScale: (px: number) => void
  toggleSidebar: () => void
  toggleCmdk: () => void
  setCmdkOpen: (open: boolean) => void
  requestNewProject: () => void
  clearNewProject: () => void
  toggleTheme: () => void
  setTheme: (theme: ThemeId) => void
  setCustomTheme: (custom: CustomTheme) => void
  pageZooms: Record<string, number>
  setPageZoom: (pageKey: string, zoom: number) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isCmdkOpen: false,
      theme: 'void',
      customTheme: { base: 'dark', accent: '#7c6cf0' },
      fontScale: 14,
      sidebarCollapsed: false,
      pendingNewProject: false,
      pageZooms: {},
      setFontScale: (px: number) => set({ fontScale: Math.min(20, Math.max(11, px)) }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      toggleCmdk: () => set((state) => ({ isCmdkOpen: !state.isCmdkOpen })),
      setCmdkOpen: (open: boolean) => set({ isCmdkOpen: open }),
      requestNewProject: () => set({ pendingNewProject: true }),
      clearNewProject: () => set({ pendingNewProject: false }),
      // Hizli gece/gunduz gecisi: koyu temadaysak Light'a, aciktaysak Void'e (varsayilan koyu) don
      toggleTheme: () =>
        set((state) => ({
          theme: isDarkTheme(state.theme, state.customTheme) ? 'light' : 'void'
        })),
      setTheme: (theme: ThemeId) => set({ theme }),
      setCustomTheme: (custom: CustomTheme) => set({ customTheme: custom, theme: 'custom' }),
      setPageZoom: (pageKey: string, zoom: number) =>
        set((state) => ({
          pageZooms: { ...state.pageZooms, [pageKey]: zoom }
        }))
    }),
    {
      name: 'valute-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        customTheme: state.customTheme,
        fontScale: state.fontScale,
        sidebarCollapsed: state.sidebarCollapsed,
        pageZooms: state.pageZooms
      })
    }
  )
)
