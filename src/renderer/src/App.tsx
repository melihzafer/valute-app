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
import IdeasPage from './pages/IdeasPage'
import LifePage from './pages/LifePage'
import HealthPage from './pages/HealthPage'
import PlannerPage from './pages/PlannerPage'
import CalendarPage from './pages/CalendarPage'
import AssistantPage from './pages/AssistantPage'
import UniversityPage from './pages/UniversityPage'
import JournalPage from './pages/JournalPage'
import NotesPage from './pages/NotesPage'
import HobbiesPage from './pages/HobbiesPage'
import FinancePage from './pages/FinancePage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
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
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="life" element={<LifePage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="university" element={<UniversityPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="hobbies" element={<HobbiesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ideas" element={<IdeasPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
