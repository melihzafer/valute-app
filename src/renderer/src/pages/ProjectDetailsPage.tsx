// src/renderer/src/pages/ProjectDetailsPage.tsx

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore'
import { Log, Project, Expense } from '../../../shared/types'
import { cn, formatCurrency } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import LogList from '../components/LogList'
import ExpenseList from '../components/ExpenseList'
import EditProjectForm from '../components/EditProjectForm'
import { AssetList } from '../components/AssetList'
import { ScreenshotGallery } from '../components/ScreenshotGallery'
import { useSettingsStore } from '../store/useSettingsStore'
import {
  ArrowLeft,
  LayoutDashboard,
  Clock,
  FileText,
  Settings,
  Trash2,
  Archive,
  RotateCcw,
  Receipt,
  FolderOpen,
  Check,
  Loader2,
  Camera
} from 'lucide-react'

type TabId = 'overview' | 'logs' | 'expenses' | 'notes' | 'assets' | 'screenshots' | 'settings'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'logs', label: 'Work Logs', icon: Clock },
  { id: 'expenses', label: 'Expenses', icon: Receipt },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'assets', label: 'Assets', icon: FolderOpen },
  { id: 'screenshots', label: 'Screenshots', icon: Camera },
  { id: 'settings', label: 'Settings', icon: Settings }
]

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, fetchProjects, updateProject, deleteProject } = useProjectStore()

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [logs, setLogs] = useState<Log[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [notes, setNotes] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [isLoading, setIsLoading] = useState(true)
  const notesInitialized = useRef(false)

  const project = projects.find((p) => p.id === id)

  // Fetch project and logs data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return

      // Ensure projects are loaded
      if (projects.length === 0) {
        await fetchProjects()
      }

      // Fetch logs for this project
      try {
        const response = await window.api.getLogsByProject(id)
        if (response.success && response.data) {
          const parsedLogs = response.data.map((log) => ({
            ...log,
            startTime: new Date(log.startTime),
            endTime: log.endTime ? new Date(log.endTime) : null
          }))
          setLogs(parsedLogs)
        }
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      }

      // Fetch expenses for this project
      try {
        const response = await window.api.getExpensesByProject(id)
        if (response.success && response.data) {
          const parsedExpenses = response.data.map((exp) => ({
            ...exp,
            date: new Date(exp.date)
          }))
          setExpenses(parsedExpenses)
        }
      } catch (error) {
        console.error('Failed to fetch expenses:', error)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [id, projects.length, fetchProjects])

  // Initialize notes from project when loaded
  useEffect(() => {
    if (project && !notesInitialized.current) {
      setNotes(project.notes || '')
      notesInitialized.current = true
    }
  }, [project])

  // Auto-save notes with debounce
  useEffect(() => {
    if (!id || !notesInitialized.current) return

    const timer = setTimeout(async () => {
      // Only save if notes have actually changed from what's in the project
      if (notes !== (project?.notes || '')) {
        setSaveStatus('saving')
        try {
          await window.api.updateProjectNotes(id, notes)
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
          console.error('Failed to save notes:', error)
          setSaveStatus('idle')
        }
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [notes, id, project?.notes])

  // Refresh logs function
  const refreshLogs = async () => {
    if (!id) return
    const response = await window.api.getLogsByProject(id)
    if (response.success && response.data) {
      const parsedLogs = response.data.map((log) => ({
        ...log,
        startTime: new Date(log.startTime),
        endTime: log.endTime ? new Date(log.endTime) : null
      }))
      setLogs(parsedLogs)
    }
  }

  // Refresh expenses function
  const refreshExpenses = async () => {
    if (!id) return
    const response = await window.api.getExpensesByProject(id)
    if (response.success && response.data) {
      const parsedExpenses = response.data.map((exp) => ({
        ...exp,
        date: new Date(exp.date)
      }))
      setExpenses(parsedExpenses)
    }
  }

  // Metrics calculations
  const totalTimeSeconds = logs.reduce((acc, log) => acc + log.accumulatedTime, 0)
  const totalExpensesCents = expenses.reduce((acc, exp) => acc + exp.amount, 0)

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const calculateTotalEarnings = (): number => {
    if (!project) return 0

    switch (project.pricingModel) {
      case 'HOURLY': {
        const hours = totalTimeSeconds / 3600
        return (project.hourlyRate / 100) * hours
      }
      case 'UNIT_BASED': {
        const totalUnits = logs.reduce((acc, log) => acc + (log.quantity || 0), 0)
        return (project.hourlyRate / 100) * totalUnits
      }
      case 'FIXED':
        return (project.fixedPrice || 0) / 100
      case 'SUBSCRIPTION':
        return project.hourlyRate / 100
      default:
        return 0
    }
  }

  const calculateEffectiveHourlyRate = (): number => {
    if (!project || totalTimeSeconds === 0)
      return project?.hourlyRate ? project.hourlyRate / 100 : 0

    if (project.pricingModel === 'HOURLY') {
      return project.hourlyRate / 100
    }

    const earnings = calculateTotalEarnings()
    const hours = totalTimeSeconds / 3600
    return hours > 0 ? earnings / hours : 0
  }

  const totalUnits = logs.reduce((acc, log) => acc + (log.quantity || 0), 0)

  // Progress bar calculation
  interface ProgressData {
    percentage: number
    label: string
    current: string
    total: string
    isOverBudget: boolean
  }

  const calculateProgress = (): ProgressData | null => {
    if (!project) return null

    switch (project.pricingModel) {
      case 'FIXED': {
        const hours = totalTimeSeconds / 3600
        const impliedRate = project.hourlyRate / 100 || 50 // Default $50/hr if not set
        const currentSpend = hours * impliedRate
        const budget = (project.fixedPrice || 0) / 100
        const percentage = budget > 0 ? (currentSpend / budget) * 100 : 0

        return {
          percentage: Math.min(percentage, 150),
          label: 'Budget Used',
          current: formatCurrency(currentSpend, project.currency),
          total: formatCurrency(budget, project.currency),
          isOverBudget: percentage > 100
        }
      }
      case 'HOURLY': {
        const hours = totalTimeSeconds / 3600
        const targetHours = 40
        const percentage = (hours / targetHours) * 100

        return {
          percentage: Math.min(percentage, 150),
          label: 'Hours This Period',
          current: `${hours.toFixed(1)}h`,
          total: `${targetHours}h target`,
          isOverBudget: false
        }
      }
      case 'UNIT_BASED': {
        const targetUnits = 10
        const percentage = (totalUnits / targetUnits) * 100

        return {
          percentage: Math.min(percentage, 150),
          label: `${project.unitName || 'Units'} Completed`,
          current: `${totalUnits}`,
          total: `${targetUnits} target`,
          isOverBudget: false
        }
      }
      case 'SUBSCRIPTION': {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const currentDay = now.getDate()
        const percentage = (currentDay / daysInMonth) * 100

        return {
          percentage,
          label: 'Period Progress',
          current: `Day ${currentDay}`,
          total: `of ${daysInMonth}`,
          isOverBudget: false
        }
      }
      default:
        return null
    }
  }

  // Handlers
  const handleEditLog = (log: Log) => {
    // TODO: Open edit modal
    console.log('Edit log:', log)
  }

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Delete this log entry?')) {
      await window.api.deleteLog(logId)
      await refreshLogs()
    }
  }

  // Expense handlers
  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const response = await window.api.createExpense({
      ...expenseData,
      date: expenseData.date.toISOString()
    })
    if (response.success) {
      await refreshExpenses()
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    await window.api.deleteExpense(expenseId)
    await refreshExpenses()
  }

  const handleArchive = async () => {
    if (!project) return
    const newStatus = project.status === 'active' ? 'archived' : 'active'
    await updateProject(project.id, { status: newStatus })
  }

  const handleDelete = async () => {
    if (!project) return
    if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      await deleteProject(project.id)
      navigate('/projects')
    }
  }

  const handleProjectUpdate = async (data: Omit<Project, 'id' | 'createdAt'>) => {
    if (!project) return
    await updateProject(project.id, data)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading project...</div>
      </div>
    )
  }

  // Not found state
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => navigate('/projects')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const progressData = calculateProgress()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Back button and title */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground truncate">{project.name}</h1>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full border',
                  project.status === 'active'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-muted text-muted-foreground border-border'
                )}
              >
                {project.status === 'active' ? 'Active' : 'Archived'}
              </span>
            </div>
            {project.clientName && <p className="text-muted-foreground">{project.clientName}</p>}
          </div>
        </div>

        {/* Progress Bar */}
        {progressData && (
          <div className="bg-card border border-border/50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{progressData.label}</span>
                <span
                  className={cn(
                    'font-medium',
                    progressData.isOverBudget ? 'text-destructive' : 'text-foreground'
                  )}
                >
                  {progressData.current} / {progressData.total}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progressData.isOverBudget
                      ? 'bg-destructive'
                      : progressData.percentage > 80
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                  )}
                  style={{ width: `${Math.min(progressData.percentage, 100)}%` }}
                />
              </div>
              {progressData.isOverBudget && (
                <p className="text-xs text-destructive">
                  Over budget by {(progressData.percentage - 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              'border-b-2 -mb-[1px]',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Time Card */}
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Total Time</p>
              <p className="text-3xl font-bold text-foreground">
                {formatDuration(totalTimeSeconds)}
              </p>
            </div>

            {/* Total Earnings Card - Now shows Gross and Net */}
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">Gross Earnings</p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(calculateTotalEarnings(), project.currency)}
              </p>
              {totalExpensesCents > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Net:{' '}
                  <span className="text-green-400 font-medium">
                    {formatCurrency(
                      calculateTotalEarnings() - totalExpensesCents / 100,
                      project.currency
                    )}
                  </span>
                </p>
              )}
            </div>

            {/* Effective Rate Card */}
            <div className="bg-card border border-border/50 rounded-lg p-6">
              <p className="text-sm text-muted-foreground mb-1">
                {project.pricingModel === 'HOURLY' ? 'Hourly Rate' : 'Effective Rate'}
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatCurrency(calculateEffectiveHourlyRate(), project.currency)}/hr
              </p>
            </div>

            {/* Expenses Card */}
            {totalExpensesCents > 0 && (
              <div className="bg-card border border-border/50 rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-3xl font-bold text-destructive">
                  -{formatCurrency(totalExpensesCents / 100, project.currency)}
                </p>
              </div>
            )}

            {/* Units Card for UNIT_BASED */}
            {project.pricingModel === 'UNIT_BASED' && (
              <div className="bg-card border border-border/50 rounded-lg p-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Total {project.unitName || 'Units'}
                </p>
                <p className="text-3xl font-bold text-foreground">{totalUnits}</p>
              </div>
            )}
          </div>
        )}

        {/* Work Logs Tab */}
        {activeTab === 'logs' && (
          <LogList
            logs={logs}
            projects={[project]}
            onEditLog={handleEditLog}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <ExpenseList
            expenses={expenses}
            currency={project.currency}
            projectId={project.id}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Project notes and canvas - auto-saves as you type
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {saveStatus === 'saving' && (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Saved</span>
                  </>
                )}
              </div>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add project notes, requirements, or any relevant information..."
              className="min-h-[300px] resize-y"
            />
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="max-w-2xl">
            <AssetList projectId={project.id} />
          </div>
        )}

        {/* Screenshots Tab */}
        {activeTab === 'screenshots' && (
          <ScreenshotGallery
            projectId={project.id}
            blurIntensity={useSettingsStore.getState().settings.screenshot?.blurIntensity ?? 'off'}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl">
            {/* Edit Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Project Details</h3>
              <EditProjectForm
                projectToEdit={project}
                onSubmit={handleProjectUpdate}
                onClose={() => {}}
              />
            </div>

            {/* Danger Zone */}
            <div className="border border-destructive/20 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
              <p className="text-sm text-muted-foreground">
                These actions can affect your project data. Proceed with caution.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={handleArchive}>
                  {project.status === 'active' ? (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Project
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reactivate Project
                    </>
                  )}
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetailsPage
