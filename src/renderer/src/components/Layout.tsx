// src/renderer/src/components/Layout.tsx

import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TimerWidget from './TimerWidget'
import { CommandMenu } from './CommandMenu'
import { useTimerStore } from '../store/useTimerStore'
import { useProjectStore } from '../store/useProjectStore'
import { useUIStore } from '../store/useUIStore'

const Layout: React.FC = () => {
  const { timerState, pauseTimer, resumeTimer, stopTimer } = useTimerStore()
  const { projects } = useProjectStore()
  const { theme } = useUIStore()

  // Get current project's hourly rate
  const currentProject = projects.find((p) => p.id === timerState.projectId)

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <CommandMenu />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <TimerWidget
        timerState={timerState}
        hourlyRate={currentProject?.hourlyRate}
        currency={currentProject?.currency}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onStop={stopTimer}
      />
    </div>
  )
}

export default Layout
