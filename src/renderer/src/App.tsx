// src/renderer/src/App.tsx

import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'

import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailsPage from './pages/ClientDetailsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import FloatingTimerPage from './pages/FloatingTimerPage'
import FocusNudgePage from './pages/FocusNudgePage'
import ScreenshotCountdownPage from './pages/ScreenshotCountdownPage'
import FocusGuardNudge from './components/FocusGuardNudge'
import { useTimerStore } from './store/useTimerStore'

function App() {
  // Listen for timer state query from main process (for auto-reopening floating timer after screenshot)
  useEffect(() => {
    const cleanup = window.api.onQueryTimerStateForReopen?.(() => {
      const isRunning = useTimerStore.getState().isRunning
      window.api.sendTimerStateForReopen(isRunning)
    })

    return cleanup
  }, [])
  return (
    <HashRouter>
      {/* Focus Guard - globally available */}
      <FocusGuardNudge />

      <Routes>
        {/* Floating timer - standalone route without layout */}
        <Route path="/floating-timer" element={<FloatingTimerPage />} />

        {/* Focus nudge - standalone route without layout */}
        <Route path="/focus-nudge" element={<FocusNudgePage />} />

        {/* Screenshot countdown - standalone route without layout */}
        <Route path="/screenshot-countdown" element={<ScreenshotCountdownPage />} />

        {/* Main app routes with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
