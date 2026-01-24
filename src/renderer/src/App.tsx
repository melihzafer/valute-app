// src/renderer/src/App.tsx

import { HashRouter, Routes, Route } from 'react-router-dom'

import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import FloatingTimerPage from './pages/FloatingTimerPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Floating timer - standalone route without layout */}
        <Route path="/floating-timer" element={<FloatingTimerPage />} />

        {/* Main app routes with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
