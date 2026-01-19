// src/renderer/src/store/useTimerStore.ts

import { create } from 'zustand';
import type { TimerState } from '../../../shared/types';

interface TimerStore {
  timerState: TimerState;
  isLoading: boolean;
  error: string | null;
  loadTimerState: () => Promise<void>;
  startTimer: (projectId: string, description?: string) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => Promise<void>;
  setTimerState: (state: Partial<TimerState>) => void; // For direct updates if needed
}

export const useTimerStore = create<TimerStore>((set) => ({
  timerState: {
    isRunning: false,
    elapsedSeconds: 0,
    accumulatedTime: 0,
    startTime: null,
    projectId: null,
    description: null,
    currentProjectName: null, // Added for convenience
  },
  isLoading: false,
  error: null,

  loadTimerState: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.getTimerState();
      if (response.success && response.data) {
        // Ensure dates/times are parsed correctly if they come as strings
        set({ timerState: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to load timer state', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  startTimer: async (projectId, description) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.startTimer(projectId, description);
      if (response.success && response.data) {
        set({ timerState: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to start timer', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  pauseTimer: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.pauseTimer();
      if (response.success && response.data) {
        set({ timerState: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to pause timer', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  resumeTimer: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.resumeTimer();
      if (response.success && response.data) {
        set({ timerState: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to resume timer', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  stopTimer: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.stopTimer();
      if (response.success && response.data) {
        // Reset timer state to default when stopped, but keep other data if necessary
        set({ timerState: response.data, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to stop timer', isLoading: false });
        // If stopTimer fails, we might still want to reset the local state to reflect a stopped timer
        set(state => ({
          timerState: {
            ...state.timerState,
            isRunning: false,
            elapsedSeconds: 0,
            accumulatedTime: 0,
            startTime: null,
            projectId: null,
            description: null,
            currentProjectName: null,
          },
          isLoading: false,
        }));
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
      // Reset local state on IPC error as well
      set(state => ({
        timerState: {
          ...state.timerState,
          isRunning: false,
          elapsedSeconds: 0,
          accumulatedTime: 0,
          startTime: null,
          projectId: null,
          description: null,
          currentProjectName: null,
        },
        isLoading: false,
      }));
    }
  },

  setTimerState: (state: Partial<TimerState>) => {
    set(prevState => ({
      timerState: {
        ...prevState.timerState,
        ...state,
      }
    }));
  },
}));
