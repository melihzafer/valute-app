// src/renderer/src/pages/FocusNudgePage.tsx
// Floating focus nudge window for Phase 9.5

import React, { useEffect, useState } from 'react'
import { Clock, Play, Square, ArrowRightLeft } from 'lucide-react'

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes} minutes`
}

const FocusNudgePage: React.FC = () => {
  const [projectName, setProjectName] = useState<string>('your task')
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  useEffect(() => {
    window.api.getFocusContext().then((response) => {
      if (response.success && response.data) {
        setProjectName(response.data.projectName || 'your task')
        setElapsedSeconds(response.data.elapsedSeconds || 0)
      }
    })
  }, [])

  const handleContinue = () => window.api.focusConfirm()
  const handleStop = () => window.api.focusStop()
  const handleSwitch = () => window.api.focusSwitch()

  return (
    <div className="h-screen w-screen overflow-hidden select-none">
      <div 
        className="h-full w-full right-0 top-0 bg-zinc-900/95 backdrop-blur-xl rounded-2xl border border-zinc-700/50 shadow-2xl flex flex-col"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-zinc-700/50">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Focus Check-in</h2>
            <p className="text-xs text-zinc-400">Time for a quick break?</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          <p className="text-sm text-zinc-200">
            You've been working on{' '}
            <span className="font-semibold text-blue-400">"{projectName}"</span>{' '}
            for <span className="font-semibold">{formatTime(elapsedSeconds)}</span>.
          </p>
          <p className="text-xs text-zinc-400">Are you still focused on this task?</p>
        </div>

        {/* Actions */}
        <div
          className="p-4 pt-0 space-y-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleContinue}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <Play className="h-4 w-4" />
            Yes, Continue Working
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleStop}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/30 rounded-lg text-sm text-red-400 transition-colors"
            >
              <Square className="h-3.5 w-3.5" />
              Stop Timer
            </button>

            <button
              onClick={handleSwitch}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-600/30 rounded-lg text-sm text-zinc-300 transition-colors"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Switch Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FocusNudgePage
