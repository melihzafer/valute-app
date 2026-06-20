// src/renderer/src/components/TimerWidget.tsx

import React, { useState, useEffect } from 'react'
import { Play, Pause, Square } from 'lucide-react'
import type { TimerState } from '../../../shared/types'
import { calculateLiveEarnings } from '../../../shared/earnings'
import { useProjectStore } from '../store/useProjectStore'
import { UnitCounter } from './UnitCounter'
import { Button } from './ui/Button'
import { formatCurrency } from '../lib/utils'

interface TimerWidgetProps {
  timerState: TimerState
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  const paddedHours = String(hours).padStart(2, '0')
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(remainingSeconds).padStart(2, '0')

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ timerState, onPause, onResume, onStop }) => {
  const { projects } = useProjectStore()
  const [todaySeconds, setTodaySeconds] = useState(0)

  // Listen for actions from floating window
  useEffect(() => {
    const cleanup = window.api.onFloatingTimerAction((action) => {
      switch (action) {
        case 'pause':
          onPause?.()
          break
        case 'resume':
          onResume?.()
          break
        case 'stop':
          onStop?.()
          break
      }
    })
    return cleanup
  }, [onPause, onResume, onStop])

  // Bugunun toplam takip suresi (kayitli loglardan); dakikada bir tazelenir
  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const res = await window.api.getTimeReport(start.toISOString(), now.toISOString())
        if (!cancelled && res.success && res.data) setTodaySeconds(res.data.totalSeconds)
      } catch {
        /* sessiz: widget kritik degil */
      }
    }
    load()
    const i = setInterval(load, 60_000)
    return () => {
      cancelled = true
      clearInterval(i)
    }
  }, [timerState.isRunning])

  if (!timerState.projectId && !timerState.isRunning) {
    return null
  }

  const activeProject = projects.find((p) => p.id === timerState.projectId)

  if (activeProject?.pricingModel === 'UNIT_BASED') {
    return (
      <UnitCounter
        projectId={activeProject.id}
        rate={activeProject.hourlyRate}
        unitName={activeProject.unitName || 'Unit'}
        currency={activeProject.currency}
        onClose={onStop}
      />
    )
  }

  // Q5 — canlı kazanç göstergesi. Sadece HOURLY projeler için (FIXED/SUBSCRIPTION
  // saniye başına birikmez). hourlyRate cent cinsinden. calculateLiveEarnings pure.
  const showLiveEarnings =
    timerState.isRunning &&
    activeProject?.pricingModel === 'HOURLY' &&
    activeProject.hourlyRate > 0
  const liveEarningsCents = showLiveEarnings
    ? calculateLiveEarnings(timerState.elapsedSeconds, activeProject.hourlyRate)
    : 0

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-full shadow-2xl pl-3 pr-2 py-1.5 flex items-center gap-2">
        <div className="flex flex-col leading-none">
          <span className="text-xs font-mono font-bold tabular-nums">
            {formatTime(timerState.elapsedSeconds)}
          </span>
          <span className="text-[9px] text-muted-foreground tabular-nums">
            {formatTime(todaySeconds)}
          </span>
        </div>
        {showLiveEarnings && (
          <div className="flex flex-col leading-none border-l border-border/50 pl-2">
            <span className="text-[9px] text-muted-foreground">earned</span>
            <span className="text-xs font-mono font-bold tabular-nums text-emerald-500 dark:text-emerald-400">
              {formatCurrency(liveEarningsCents, activeProject.currency)}
            </span>
          </div>
        )}
        {timerState.isRunning ? (
          <Button variant="ghost" size="sm" onClick={onPause} className="h-6 w-6 p-0" title="Pause">
            <Pause className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResume}
            className="h-6 w-6 p-0"
            title="Resume"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onStop} className="h-6 w-6 p-0 text-destructive hover:text-destructive" title="Stop">
          <Square className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export default TimerWidget
