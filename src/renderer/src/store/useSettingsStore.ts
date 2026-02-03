// src/renderer/src/store/useSettingsStore.ts
// Settings store with Focus Guard logic

import { create } from 'zustand'
import type { AppSettings } from '../../../shared/types'
import { DEFAULT_SETTINGS } from '../../../shared/types'

interface SettingsStore {
  // Settings state
  settings: AppSettings
  isLoading: boolean
  error: string | null

  // Focus Guard state
  lastNudgeTime: number | null
  nudgeDismissedForSession: boolean

  // Actions
  loadSettings: () => Promise<void>
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>

  // Focus Guard actions
  shouldShowNudge: (elapsedSeconds: number) => boolean
  dismissNudge: () => void
  resetNudgeState: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // Initial state
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  error: null,
  lastNudgeTime: null,
  nudgeDismissedForSession: false,

  loadSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.getAllSettings()
      if (response.success && response.data) {
        set({ settings: response.data, isLoading: false })
      } else {
        set({ error: response.error || 'Failed to load settings', isLoading: false })
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error)
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.setSettings(newSettings)
      if (response.success) {
        // Merge with existing settings
        const current = get().settings
        const merged: AppSettings = {
          general: { ...current.general, ...newSettings.general },
          focus: { ...current.focus, ...newSettings.focus },
          screenshot: { ...current.screenshot, ...newSettings.screenshot }
        }
        set({ settings: merged, isLoading: false })
      } else {
        set({ error: response.error || 'Failed to save settings', isLoading: false })
      }
    } catch (error: any) {
      console.error('Failed to update settings:', error)
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  shouldShowNudge: (elapsedSeconds: number) => {
    const { settings, lastNudgeTime, nudgeDismissedForSession } = get()

    // Don't show if Focus Guard is disabled
    if (!settings.focus.enabled) {
      return false
    }

    // Don't show if already dismissed for this session
    if (nudgeDismissedForSession) {
      return false
    }

    const nudgeIntervalSeconds = settings.focus.nudgeInterval * 60
    const now = Date.now()

    // Check if enough time has passed since last nudge
    if (lastNudgeTime) {
      const timeSinceLastNudge = (now - lastNudgeTime) / 1000
      if (timeSinceLastNudge < nudgeIntervalSeconds) {
        return false
      }
    }

    // Check if timer has been running long enough
    return elapsedSeconds >= nudgeIntervalSeconds
  },

  dismissNudge: () => {
    set({
      lastNudgeTime: Date.now(),
      nudgeDismissedForSession: false // Allow future nudges
    })
  },

  resetNudgeState: () => {
    set({
      lastNudgeTime: null,
      nudgeDismissedForSession: false
    })
  }
}))
