// src/renderer/src/components/FocusGuardNudge.tsx
// Focus Guard - Gentle nudge dialog for long timer sessions

import React, { useEffect, useState } from 'react'
import { Clock, Play, Square, RefreshCw } from 'lucide-react'
import { useTimerStore } from '../store/useTimerStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { Button } from './ui/Button'

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} minutes`
}

export const FocusGuardNudge: React.FC = () => {
  const [showNudge, setShowNudge] = useState(false)

  const { isRunning, elapsedSeconds, stopTimer, currentProjectName } = useTimerStore()
  const { settings, shouldShowNudge, dismissNudge, resetNudgeState } = useSettingsStore()

  // Check for nudge condition when timer ticks
  useEffect(() => {
    if (isRunning && shouldShowNudge(elapsedSeconds)) {
      setShowNudge(true)
    }
  }, [isRunning, elapsedSeconds, shouldShowNudge])

  // Reset nudge state when timer stops
  useEffect(() => {
    if (!isRunning) {
      resetNudgeState()
      setShowNudge(false)
    }
  }, [isRunning, resetNudgeState])

  const handleContinue = () => {
    dismissNudge()
    setShowNudge(false)
  }

  const handleStop = async () => {
    await stopTimer()
    setShowNudge(false)
  }

  if (!showNudge || !settings.focus.enabled) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Focus Check-in</h2>
            <p className="text-sm text-muted-foreground">Time for a quick break?</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-foreground">
            You've been working on{' '}
            <span className="font-semibold text-primary">
              "{currentProjectName || 'your task'}"
            </span>{' '}
            for <span className="font-semibold">{formatTime(elapsedSeconds)}</span>.
          </p>

          <p className="text-muted-foreground text-sm">
            Taking regular breaks can help maintain focus and productivity. Are you still focused on
            this task?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 p-6 pt-0">
          <Button
            onClick={handleContinue}
            className="w-full justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            Yes, Continue Working
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleStop}
              className="flex-1 justify-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Timer
            </Button>

            <Button
              variant="ghost"
              onClick={handleContinue}
              className="flex-1 justify-center gap-2 text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Ask Later
            </Button>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            You can adjust or disable Focus Guard in Settings → Focus
          </p>
        </div>
      </div>
    </div>
  )
}

export default FocusGuardNudge
