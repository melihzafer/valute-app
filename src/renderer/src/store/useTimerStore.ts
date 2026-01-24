// src/renderer/src/store/useTimerStore.ts

import { create } from 'zustand'
import type { TimerState } from '../../../shared/types'

interface TimerStore {
  // Timer state
  isRunning: boolean
  elapsedSeconds: number
  accumulatedTime: number
  startTime: number | null
  projectId: string | null
  description: string | null
  currentProjectName: string | null

  // UI state
  isLoading: boolean
  error: string | null

  // Legacy compatibility
  timerState: TimerState

  // Actions
  loadTimerState: () => Promise<void>
  startTimer: (projectId: string, description?: string) => Promise<void>
  pauseTimer: () => Promise<void>
  resumeTimer: () => Promise<void>
  stopTimer: () => Promise<void>
  tick: () => void
  setTimerState: (state: Partial<TimerState>) => void
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  // Initial state
  isRunning: false,
  elapsedSeconds: 0,
  accumulatedTime: 0,
  startTime: null,
  projectId: null,
  description: null,
  currentProjectName: null,
  isLoading: false,
  error: null,

  // Legacy timerState getter for compatibility
  get timerState() {
    const state = get()
    return {
      isRunning: state.isRunning,
      elapsedSeconds: state.elapsedSeconds,
      accumulatedTime: state.accumulatedTime,
      startTime: state.startTime,
      projectId: state.projectId,
      description: state.description,
      currentProjectName: state.currentProjectName
    }
  },

  loadTimerState: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.getTimerState()
      if (response.success && response.data) {
        const data = response.data
        set({
          isRunning: data.isRunning,
          elapsedSeconds: data.elapsedSeconds,
          accumulatedTime: data.accumulatedTime,
          startTime: data.startTime,
          projectId: data.projectId,
          description: data.description,
          currentProjectName: data.currentProjectName,
          isLoading: false
        })
      } else {
        set({ error: response.error || 'Failed to load timer state', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  startTimer: async (projectId, description) => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.startTimer(projectId, description)
      if (response.success && response.data) {
        const data = response.data
        set({
          isRunning: data.isRunning,
          elapsedSeconds: 0,
          accumulatedTime: data.accumulatedTime,
          startTime: data.startTime,
          projectId: data.projectId,
          description: data.description,
          currentProjectName: data.currentProjectName,
          isLoading: false
        })
      } else {
        set({ error: response.error || 'Failed to start timer', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  pauseTimer: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.pauseTimer()
      if (response.success && response.data) {
        const data = response.data
        set({
          isRunning: false,
          accumulatedTime: data.accumulatedTime,
          startTime: null,
          isLoading: false
        })
      } else {
        set({ error: response.error || 'Failed to pause timer', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  resumeTimer: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.resumeTimer()
      if (response.success && response.data) {
        const data = response.data
        set({
          isRunning: true,
          startTime: data.startTime,
          isLoading: false
        })
      } else {
        set({ error: response.error || 'Failed to resume timer', isLoading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
    }
  },

  stopTimer: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await window.api.stopTimer()
      if (response.success) {
        // Reset all timer state
        set({
          isRunning: false,
          elapsedSeconds: 0,
          accumulatedTime: 0,
          startTime: null,
          projectId: null,
          description: null,
          currentProjectName: null,
          isLoading: false
        })
      } else {
        set({ error: response.error || 'Failed to stop timer', isLoading: false })
        // Reset anyway on failure
        set({
          isRunning: false,
          elapsedSeconds: 0,
          accumulatedTime: 0,
          startTime: null,
          projectId: null,
          description: null,
          currentProjectName: null
        })
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false })
      // Reset on error
      set({
        isRunning: false,
        elapsedSeconds: 0,
        accumulatedTime: 0,
        startTime: null,
        projectId: null,
        description: null,
        currentProjectName: null
      })
    }
  },

  // Called by interval to update elapsed time
  tick: () => {
    const state = get()
    if (state.isRunning && state.startTime) {
      const now = Date.now()
      const elapsed = Math.floor((now - state.startTime) / 1000)
      set({ elapsedSeconds: state.accumulatedTime + elapsed })
    }
  },

  setTimerState: (newState: Partial<TimerState>) => {
    set((prev) => ({
      ...prev,
      ...newState
    }))
  }
}))
