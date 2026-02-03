// src/renderer/src/pages/FloatingTimerPage.tsx
// Floating timer window - always on top, minimal UI

import { useState, useEffect } from 'react'
import { Play, Pause, Square, X, GripVertical } from 'lucide-react'
import type { TimerState } from '../../../shared/types'
import { formatCurrency } from '../lib/utils'

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const paddedHours = String(hours).padStart(2, '0')
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(remainingSeconds).padStart(2, '0')

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
}

const calculateEarnings = (seconds: number, hourlyRateCents: number): number => {
  const hours = seconds / 3600
  return (hourlyRateCents / 100) * hours
}

const FloatingTimerPage: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    elapsedSeconds: 0,
    accumulatedTime: 0,
    startTime: null,
    projectId: null,
    description: null,
    currentProjectName: null
  })
  const [hourlyRate, setHourlyRate] = useState(0)
  const [currency, setCurrency] = useState('USD')

  // Listen for timer state updates from main window
  useEffect(() => {
    const cleanup = window.api.onTimerStateUpdate((state) => {
      const newState = state as TimerState & { hourlyRate?: number; currency?: string }
      setTimerState(newState)
      if (newState.hourlyRate) setHourlyRate(newState.hourlyRate)
      if (newState.currency) setCurrency(newState.currency)
    })

    // Request initial state
    window.api.getTimerState().then((response) => {
      if (response.success && response.data) {
        setTimerState(response.data)
      }
    })

    return cleanup
  }, [])

  // Update elapsed time locally when running for smooth display
  // Calculate from authoritative startTime and accumulatedTime
  useEffect(() => {
    if (!timerState.isRunning || !timerState.startTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - timerState.startTime!) / 1000)
      setTimerState((prev) => ({
        ...prev,
        elapsedSeconds: prev.accumulatedTime + elapsed
      }))
    }, 100) // Update more frequently for smoother display

    return () => clearInterval(interval)
  }, [timerState.isRunning, timerState.startTime, timerState.accumulatedTime])

  // Periodically request fresh state to prevent drift
  useEffect(() => {
    const syncInterval = setInterval(() => {
      window.api.getTimerState().then((response) => {
        if (response.success && response.data) {
          setTimerState(response.data)
        }
      })
    }, 5000) // Sync with server every 5 seconds

    return () => clearInterval(syncInterval)
  }, [])

  const handlePause = () => {
    window.api.sendFloatingTimerAction('pause')
  }

  const handleResume = () => {
    window.api.sendFloatingTimerAction('resume')
  }

  const handleStop = () => {
    window.api.sendFloatingTimerAction('stop')
  }

  const handleClose = () => {
    window.api.closeFloatingTimer()
  }

  const currentEarnings = calculateEarnings(timerState.elapsedSeconds, hourlyRate)

  return (
    <div className="h-screen w-screen overflow-hidden select-none">
      {/* Draggable window with rounded corners */}
      <div
        className="h-full w-full bg-zinc-900/95 backdrop-blur-xl shadow-2xl flex flex-col"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Header - Draggable */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/50">
          <div className="flex items-center gap-2">
            <GripVertical className="h-3 w-3 text-zinc-500" />
            <span className="text-xs text-zinc-400 truncate max-w-[150px]">
              {timerState.currentProjectName || 'No Project'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <X className="h-3 w-3 text-zinc-400 hover:text-white" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-2">
          <div className="text-3xl font-mono font-bold text-white tabular-nums tracking-tight">
            {formatTime(timerState.elapsedSeconds)}
          </div>
          {hourlyRate > 0 && (
            <div className="text-sm font-medium text-emerald-400 mt-1">
              {formatCurrency(currentEarnings, currency)}
            </div>
          )}
        </div>

        {/* Controls - Not draggable */}
        <div
          className="flex items-center justify-center gap-2 px-3 py-2 border-t border-zinc-700/50"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {timerState.isRunning ? (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700/50 hover:bg-zinc-600/50 rounded-lg text-xs text-white transition-colors"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <Pause className="h-3 w-3" />
              Pause
            </button>
          ) : (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500/80 rounded-lg text-xs text-white transition-colors"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <Play className="h-3 w-3" />
              Resume
            </button>
          )}
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 rounded-lg text-xs text-red-400 transition-colors"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <Square className="h-3 w-3" />
            Stop
          </button>
        </div>
      </div>
    </div>
  )
}

export default FloatingTimerPage
