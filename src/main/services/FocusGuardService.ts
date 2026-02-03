// src/main/services/FocusGuardService.ts
// Focus Guard service - runs in main process to track elapsed time and trigger nudges

import * as SettingsService from './SettingsService'

let focusCheckInterval: NodeJS.Timeout | null = null
let lastNudgeTime: number | null = null
let timerStartTime: number | null = null
let accumulatedBeforePause: number = 0
let currentProjectName: string = ''

// Callback to show the focus window (set from index.ts)
let showFocusWindowCallback: (() => void) | null = null

export function setShowFocusWindowCallback(callback: () => void): void {
  showFocusWindowCallback = callback
}

export function startFocusTracking(projectName: string): void {
  currentProjectName = projectName
  timerStartTime = Date.now()
  accumulatedBeforePause = 0
  lastNudgeTime = null
  startInterval()
}

export function pauseFocusTracking(): void {
  if (timerStartTime) {
    accumulatedBeforePause += Date.now() - timerStartTime
    timerStartTime = null
  }
  stopInterval()
}

export function resumeFocusTracking(projectName: string): void {
  currentProjectName = projectName
  timerStartTime = Date.now()
  startInterval()
}

export function stopFocusTracking(): void {
  timerStartTime = null
  accumulatedBeforePause = 0
  lastNudgeTime = null
  currentProjectName = ''
  stopInterval()
}

export function confirmFocus(): void {
  lastNudgeTime = Date.now()
}

export function getContext(): { projectName: string; elapsedSeconds: number } {
  return {
    projectName: currentProjectName,
    elapsedSeconds: getElapsedSeconds()
  }
}

function getElapsedSeconds(): number {
  let elapsed = accumulatedBeforePause
  if (timerStartTime) {
    elapsed += Date.now() - timerStartTime
  }
  return Math.floor(elapsed / 1000)
}

function startInterval(): void {
  stopInterval()

  focusCheckInterval = setInterval(async () => {
    const settings = await SettingsService.getAllSettings()
    if (!settings.focus.enabled) return

    const nudgeIntervalSeconds = settings.focus.nudgeInterval * 60
    const elapsedSeconds = getElapsedSeconds()
    const now = Date.now()

    // Check if enough time since last nudge
    if (lastNudgeTime) {
      const timeSinceLastNudge = (now - lastNudgeTime) / 1000
      if (timeSinceLastNudge < nudgeIntervalSeconds) return
    }

    // Check if elapsed time exceeds nudge interval
    if (elapsedSeconds >= nudgeIntervalSeconds) {
      if (showFocusWindowCallback) {
        showFocusWindowCallback()
      }
    }
  }, 10000) // Check every 10 seconds
}

function stopInterval(): void {
  if (focusCheckInterval) {
    clearInterval(focusCheckInterval)
    focusCheckInterval = null
  }
}
