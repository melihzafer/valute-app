// src/renderer/src/hooks/useTimer.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TimerState } from '../../../shared/types';

const TICK_INTERVAL_MS = 100; // Update UI every 100ms for smoother display

export const useTimer = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    elapsedSeconds: 0,
    accumulatedTime: 0,
    startTime: null,
    projectId: null,
    description: null,
    currentProjectName: null,
  });

  const intervalRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());

  // Load initial timer state from main process on component mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const response = await window.api.getTimerState();
        if (response.success && response.data) {
          setTimerState(response.data);
          lastTickTimeRef.current = Date.now();
        } else {
          console.error("Failed to load timer state:", response.error);
        }
      } catch (error) {
        console.error("Error loading timer state:", error);
      }
    };
    loadState();
  }, []);

  // Drift-free timer logic
  useEffect(() => {
    const tick = () => {
      setTimerState((prevState: TimerState) => {
        if (!prevState.isRunning || !prevState.startTime) {
          return prevState;
        }

        const now = Date.now();
        lastTickTimeRef.current = now;

        // Calculate total elapsed time based on start time and accumulated time
        // This is the core of the drift-free algorithm
        const elapsedSinceStart = Math.floor((now - prevState.startTime) / 1000);
        const totalElapsedSeconds = prevState.accumulatedTime + elapsedSinceStart;

        // Persist state changes back to the main process
        const newState = {
          ...prevState,
          elapsedSeconds: totalElapsedSeconds,
          // We don't update accumulatedTime here, it's only updated on pause/stop
        };

        // Persist the updated state periodically or on specific events (e.g., pause/stop)
        // For simplicity, we'll rely on pause/stop to save, but a real app might debounce saveTimerState here.

        return newState;
      });
    };

    if (timerState.isRunning) {
      intervalRef.current = window.setInterval(tick, TICK_INTERVAL_MS);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cleanup interval on component unmount or when isRunning changes to false
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.startTime, timerState.accumulatedTime]); // Rerun effect when these change

  // IPC Handlers for Timer Actions
  const startTimer = useCallback(async (projectId: string, description?: string) => {
    try {
      const response = await window.api.startTimer(projectId, description);
      if (response.success && response.data) {
        setTimerState(response.data);
        lastTickTimeRef.current = Date.now(); // Reset tick timer on start
      } else {
        console.error("Failed to start timer:", response.error);
        // Optionally, show an error to the user
      }
    } catch (error) {
      console.error("Error calling startTimer IPC:", error);
    }
  }, []);

  const pauseTimer = useCallback(async () => {
    if (!timerState.isRunning) return;

    // Calculate final accumulated time before pausing
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - timerState.startTime!) / 1000);
    const newAccumulatedTime = timerState.accumulatedTime + elapsedSinceStart;

    try {
      const response = await window.api.pauseTimer();
      if (response.success && response.data) {
        setTimerState((prevState: TimerState) => ({ ...prevState, ...response.data, accumulatedTime: newAccumulatedTime, isRunning: false }));
      } else {
        console.error("Failed to pause timer:", response.error);
      }
    } catch (error) {
      console.error("Error calling pauseTimer IPC:", error);
    }
  }, [timerState.isRunning, timerState.startTime, timerState.accumulatedTime]);

  const resumeTimer = useCallback(async () => {
    if (timerState.isRunning) return;
    try {
      const response = await window.api.resumeTimer();
      if (response.success && response.data) {
        setTimerState((prevState: TimerState) => ({ ...prevState, ...response.data, isRunning: true }));
        lastTickTimeRef.current = Date.now();
      } else {
        console.error("Failed to resume timer:", response.error);
      }
    } catch (error) {
      console.error("Error calling resumeTimer IPC:", error);
    }
  }, [timerState.isRunning]);

  const stopTimer = useCallback(async () => {
    if (!timerState.isRunning && !timerState.accumulatedTime) return; // Nothing to stop if not running and no accumulated time

    try {
      const response = await window.api.stopTimer(); // Main process will handle saving the log entry
      if (response.success && response.data) {
        setTimerState(response.data);
      } else {
        console.error("Failed to stop timer:", response.error);
        // Even if IPC fails, reset local state to reflect stopped timer
        setTimerState({
          isRunning: false,
          elapsedSeconds: 0,
          accumulatedTime: 0,
          startTime: null,
          projectId: null,
          description: null,
          currentProjectName: null,
        });
      }
    } catch (error) {
      console.error("Error calling stopTimer IPC:", error);
      // Reset local state on IPC error as well
      setTimerState({
        isRunning: false,
        elapsedSeconds: 0,
        accumulatedTime: 0,
        startTime: null,
        projectId: null,
        description: null,
        currentProjectName: null,
      });
    }
  }, [timerState.isRunning, timerState.startTime, timerState.accumulatedTime]);

  return {
    timerState,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setTimerState, // Expose for direct state manipulation if needed (e.g., loading state)
  };
};
