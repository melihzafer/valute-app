// src/renderer/src/pages/FloatingTimerPage.tsx
// Floating timer window - always on top, minimal

import { useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import type { TimerState } from '../../../shared/types'

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
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
  const [todaySeconds, setTodaySeconds] = useState(0)

  // Make body/html transparent so the pill is the only visible element
  useEffect(() => {
    document.body.style.background = 'transparent'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.background = 'transparent'
    const root = document.getElementById('root')
    if (root) {
      root.style.background = 'transparent'
      root.style.width = '100vw'
      root.style.height = '100vh'
      root.style.overflow = 'hidden'
    }
  }, [])

  // Listen for timer state updates from main window
  useEffect(() => {
    const cleanup = window.api.onTimerStateUpdate((state) => {
      setTimerState(state as TimerState)
    })
    window.api.getTimerState().then((response) => {
      if (response.success && response.data) setTimerState(response.data)
    })
    return cleanup
  }, [])

  // Update elapsed time locally for smooth display
  useEffect(() => {
    if (!timerState.isRunning || !timerState.startTime) return
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = Math.floor((now - timerState.startTime!) / 1000)
      setTimerState((prev) => ({ ...prev, elapsedSeconds: prev.accumulatedTime + elapsed }))
    }, 100)
    return () => clearInterval(interval)
  }, [timerState.isRunning, timerState.startTime, timerState.accumulatedTime])

  // Sync with main window every 5 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      window.api.getTimerState().then((response) => {
        if (response.success && response.data) setTimerState(response.data)
      })
    }, 5000)
    return () => clearInterval(syncInterval)
  }, [])

  // Fetch today's total tracking time for the active project
  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const res = await window.api.getTimeReport(start.toISOString(), now.toISOString())
        if (cancelled || !res.success || !res.data) return
        const projectId = timerState.projectId
        const row = projectId
          ? res.data.rows.find(
              (r: { projectId: string; totalSeconds: number }) => r.projectId === projectId
            )
          : null
        setTodaySeconds(row ? row.totalSeconds : 0)
      } catch {
        /* ignore */
      }
    }
    load()
    const i = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(i)
    }
  }, [timerState.isRunning, timerState.projectId])

  const handlePause = () => window.api.sendFloatingTimerAction('pause')
  const handleResume = () => window.api.sendFloatingTimerAction('resume')

  // Only show when there is an active project to pause/resume
  if (!timerState.projectId && !timerState.isRunning) {
    return <div className="h-full w-full" style={{ background: 'transparent' }} />
  }

  return (
    <div
      className="h-full w-full bg-zinc-900 rounded-full flex items-center justify-between px-2.5 gap-1.5 select-none relative"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div
        className={`absolute top-1 left-1 w-1.5 h-1.5 rounded-full ${timerState.isRunning ? 'bg-red-500' : 'bg-green-500'}`}
      />
      <div
        className="flex flex-col leading-none ml-2.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <span className="text-[11px] font-mono font-bold text-white tabular-nums">
          {formatTime(timerState.elapsedSeconds)}
        </span>
        <span className="text-[9px] text-zinc-400 tabular-nums">{formatTime(todaySeconds)}</span>
      </div>
      <button
        onClick={timerState.isRunning ? handlePause : handleResume}
        className="p-0.5 hover:bg-zinc-700 rounded-full transition-colors"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        title={timerState.isRunning ? 'Pause' : 'Resume'}
      >
        {timerState.isRunning ? (
          <Pause className="h-2.5 w-2.5 text-white" />
        ) : (
          <Play className="h-2.5 w-2.5 text-white" />
        )}
      </button>
    </div>
  )
}

export default FloatingTimerPage
