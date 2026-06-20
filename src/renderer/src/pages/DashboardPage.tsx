// src/renderer/src/pages/DashboardPage.tsx
// Executive Dashboard - Customizable Grid & Widgets (Layout v2)

import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  Clock,
  BarChart3,
  Target,
  Play,
  Pause,
  Square,
  LayoutGrid,
  Lock,
  Unlock,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Search,
  Github,
  Flame,
  Sparkles,
  TrendingUp,
  Trophy,
  Activity,
  Compass,
  Grid,
  Save,
  X,
  CalendarClock,
  GraduationCap,
  StickyNote,
  CheckCircle2,
  Circle,
  FolderOpen,
  Heart,
  Droplets,
  Footprints,
  Moon,
  Dumbbell,
  PenLine,
  Trash2,
  Copy
} from 'lucide-react'
import canvasConfetti from 'canvas-confetti'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useTimerStore } from '../store/useTimerStore'
import { useProjectStore } from '../store/useProjectStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useDashboardStore, WidgetId, WIDGET_META, IMPLEMENTED_WIDGET_IDS } from '../store/useDashboardStore'
import { toast } from '../store/useToastStore'
import { ZoomableCanvas } from '../components/ui/ZoomableCanvas'
import { Movable } from '../components/ui/Movable'
import ProjectTodos from '../components/ProjectTodos'
import LogEntryForm from '../components/LogEntryForm'
import { formatCurrency } from '../lib/utils'
import type {
  DashboardStats,
  ChartDataPoint,
  RecentActivityItem,
  TaskIPC,
  CalendarItem,
  HabitIPC,
  NoteIPC,
  CourseIPC,
  HealthStats
} from '../../../shared/types'

// Category colors for visual delight
const CATEGORY_COLORS: Record<string, string> = {
  Dashboard: 'text-primary border-primary/20 bg-primary/5',
  Projects: 'text-sky-400 border-sky-400/20 bg-sky-400/5',
  Finance: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5',
  Clients: 'text-violet-400 border-violet-400/20 bg-violet-400/5',
  Planner: 'text-amber-400 border-amber-400/20 bg-amber-400/5',
  Journal: 'text-pink-400 border-pink-400/20 bg-pink-400/5',
  Notes: 'text-teal-400 border-teal-400/20 bg-teal-400/5',
  Ideas: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5',
  Hobbies: 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5',
  University: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5',
  Health: 'text-rose-400 border-rose-400/20 bg-rose-400/5'
}

const formatHours = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { settings } = useSettingsStore()
  const timerStore = useTimerStore()
  const { projects, fetchProjects } = useProjectStore()

  // Dashboard Layout state
  const {
    order,
    hidden,
    editMode,
    isCanvasLocked,
    widgetConfig,
    setEditMode,
    setCanvasLocked,
    toggleWidget,
    setWidgetConfig,
    resetLayout,
    customPresets,
    saveCustomPreset,
    applyCustomPreset,
    deleteCustomPreset
  } = useDashboardStore()

  // Local state for dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isPresetSaveOpen, setIsPresetSaveOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [isManualLogOpen, setIsManualLogOpen] = useState(false)
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false)

  // Extra state for modular widgets
  const [tasks, setTasks] = useState<TaskIPC[]>([])
  const [githubIssues, setGithubIssues] = useState<any[]>([])
  const [streakCount, setStreakCount] = useState(0)
  const [todaySeconds, setTodaySeconds] = useState(0)
  const [weekSeconds, setWeekSeconds] = useState(0)

  // Life-OS widget data (calendar, habits, notes, university)
  const [upcoming, setUpcoming] = useState<CalendarItem[]>([])
  const [habits, setHabits] = useState<HabitIPC[]>([])
  const [notes, setNotes] = useState<NoteIPC[]>([])
  const [courses, setCourses] = useState<CourseIPC[]>([])
  const [gpa, setGpa] = useState<{ gradeAvg: number | null; totalCredits: number } | null>(null)
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)

  // Ticker state for real-time earnings growing
  const [tickerEarnings, setTickerEarnings] = useState(0)
  const [clockNow, setClockNow] = useState(() => new Date())

  useEffect(() => {
    const i = setInterval(() => setClockNow(new Date()), 1000)
    return () => clearInterval(i)
  }, [])

  const currency = settings.general.currency || 'USD'

  // Load Life-OS widget data (calendar / habits / notes / university)
  const loadLifeWidgets = async (): Promise<void> => {
    try {
      const [up, hb, nt, cs, g, hs] = await Promise.all([
        window.api.getUpcoming(14),
        window.api.getHabits(),
        window.api.getNotes(),
        window.api.getCourses(),
        window.api.getGpa(),
        window.api.getHealthStats()
      ])
      if (up.success && up.data) setUpcoming(up.data)
      if (hb.success && hb.data) setHabits(hb.data)
      if (nt.success && nt.data) setNotes(nt.data)
      if (cs.success && cs.data) setCourses(cs.data)
      if (g.success && g.data) setGpa(g.data)
      if (hs.success && hs.data) setHealthStats(hs.data)
    } catch (err) {
      console.error('Failed to load life widgets:', err)
    }
  }

  useEffect(() => {
    loadLifeWidgets()
  }, [])

  const toggleHabitWidget = async (id: string): Promise<void> => {
    await window.api.toggleHabit(id)
    const hb = await window.api.getHabits()
    if (hb.success && hb.data) setHabits(hb.data)
  }

  // Fetch all background stats/data
  const loadDashboardData = async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const weekStart = new Date()
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // start of week (Monday)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      const [statsRes, activityRes, chartRes, tasksRes, lifeStatsRes, todayReport, weekReport] =
        await Promise.all([
          window.api.getDashboardStats(),
          window.api.getRecentActivity(10),
          window.api.getRevenueChart(30),
          window.api.getTasks(),
          window.api.getLifeStats ? window.api.getLifeStats(30) : { success: true, data: null },
          window.api.getTimeReport(todayStart.toISOString(), new Date().toISOString()),
          window.api.getTimeReport(weekStart.toISOString(), new Date().toISOString())
        ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
        setGoalInput((statsRes.data.monthlyGoal / 100).toString())
      }
      if (activityRes.success && activityRes.data) setRecentActivity(activityRes.data)
      if (chartRes.success && chartRes.data) setChartData(chartRes.data)
      if (tasksRes.success && tasksRes.data) setTasks(tasksRes.data)
      if (lifeStatsRes.success && lifeStatsRes.data) {
        setStreakCount(lifeStatsRes.data.bestHabitStreak || 0)
      }
      if (todayReport.success && todayReport.data) setTodaySeconds(todayReport.data.totalSeconds)
      if (weekReport.success && weekReport.data) setWeekSeconds(weekReport.data.totalSeconds)

      // GitHub status: check timer's project first, then any project with githubUrl
      const timerProject = projects.find((p) => p.id === timerStore.projectId)
      const githubProject = timerProject?.githubUrl
        ? timerProject
        : projects.find((p) => p.githubUrl)
      if (githubProject?.githubUrl) {
        const summary = await window.api.githubGetRepoSummary(githubProject.githubUrl)
        if (summary.success && summary.data) {
          setGithubIssues([
            { title: 'Open Issues', value: summary.data.openIssuesCount },
            { title: 'Open PRs', value: summary.data.openPrsCount },
            { title: 'Repo', value: githubProject.name }
          ])
        }
      } else {
        setGithubIssues([])
      }
    } catch (err) {
      console.error('Failed to load dashboard widgets data:', err)
    }
  }

  useEffect(() => {
    fetchProjects()
    timerStore.loadTimerState()
    loadDashboardData()
  }, [timerStore.projectId, timerStore.isRunning, projects.length])

  // Real-time ticker effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (timerStore.isRunning && timerStore.projectId) {
      const activeProject = projects.find((p) => p.id === timerStore.projectId)
      const hourlyRateCents = activeProject?.hourlyRate || 0

      if (hourlyRateCents > 0) {
        interval = setInterval(() => {
          const elapsed = timerStore.elapsedSeconds
          const currentCents = Math.round((elapsed / 3600) * hourlyRateCents)
          setTickerEarnings(currentCents)
        }, 200)
      }
    } else {
      setTickerEarnings(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerStore.isRunning, timerStore.elapsedSeconds, timerStore.projectId, projects])

  // Save financial goal
  const handleSaveGoal = async () => {
    const parsed = parseFloat(goalInput)
    if (isNaN(parsed) || parsed < 0) return
    const cents = Math.round(parsed * 100)
    const res = await window.api.setMonthlyGoal(cents)
    if (res.success) {
      setIsEditingGoal(false)
      loadDashboardData()
    }
  }

  // Trigger manual layout reset event
  const handleResetLayout = () => {
    resetLayout()
    window.dispatchEvent(
      new CustomEvent('valute-reset-layout', { detail: { pageKey: 'dashboard' } })
    )
  }

  // Apply layout presets
  const applyPreset = (preset: 'work' | 'finance' | 'planner') => {
    let toShow: WidgetId[] = []

    if (preset === 'work') {
      toShow = [
        'clock',
        'timeStats',
        'timer',
        'quickStart',
        'earningsTicker',
        'recentActivity',
        'focusToday',
        'githubStatus',
        'repoOpener'
      ]
    } else if (preset === 'finance') {
      toShow = [
        'clock',
        'kpis',
        'revenueChart',
        'whoOwesYou',
        'topEarners',
        'financeInvoices',
        'goalThermometer'
      ]
    } else {
      toShow = [
        'clock',
        'focusToday',
        'plannerTasks',
        'plannerGoals',
        'plannerHabits',
        'journalMood',
        'healthQuickLog',
        'universityCourses'
      ]
    }

    // Toggle widgets in store
    order.forEach((id) => {
      const hideIt = !toShow.includes(id)
      const currentlyHidden = hidden.includes(id)
      if (hideIt && !currentlyHidden) {
        toggleWidget(id)
      } else if (!hideIt && currentlyHidden) {
        toggleWidget(id)
      }
    })
  }

  // Focus tasks today helpers
  const selectedFocusTaskIds = useMemo(() => {
    const config = widgetConfig['focusToday']?.taskIds || ''
    return config.split(',').filter(Boolean)
  }, [widgetConfig])

  const focusTasksTodayList = useMemo(() => {
    return selectedFocusTaskIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter((t): t is TaskIPC => !!t)
  }, [selectedFocusTaskIds, tasks])

  const toggleFocusTaskSelection = (id: string) => {
    let nextIds = [...selectedFocusTaskIds]
    if (nextIds.includes(id)) {
      nextIds = nextIds.filter((x) => x !== id)
    } else {
      if (nextIds.length >= 3) {
        return
      }
      nextIds.push(id)
    }
    setWidgetConfig('focusToday', { taskIds: nextIds.join(',') })
  }

  const toggleTaskStatus = async (task: TaskIPC) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done'
    const res = await window.api.updateTask(task.id, { status: nextStatus })
    if (res.success) {
      const updatedTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, status: nextStatus as any } : t
      )
      setTasks(updatedTasks)

      const focusTasks = selectedFocusTaskIds
        .map((id) => updatedTasks.find((t) => t.id === id))
        .filter((t): t is TaskIPC => !!t)
      if (focusTasks.length > 0 && focusTasks.every((t) => t.status === 'done')) {
        canvasConfetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        })
      }
    }
  }

  // --- Widget Render Map ---
  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'clock': {
        const timeString = clockNow.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        const dateString = clockNow.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        })
        return (
          <Card className="h-full border-primary/20 bg-gradient-to-br from-card to-primary/5 flex flex-col justify-center p-6 text-center select-none">
            <h2 className="text-4xl font-black font-mono tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              {timeString}
            </h2>
            <p className="text-sm text-muted-foreground font-medium mt-1">{dateString}</p>
            <p className="text-xs text-primary font-bold mt-2 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Welcome back, Chief!
            </p>
          </Card>
        )
      }
      case 'timeStats': {
        const todayHours = formatHours(todaySeconds)
        const weekHours = formatHours(weekSeconds)
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/reports')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Tracked Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-xs text-muted-foreground">Today</span>
                <span className="text-sm font-bold">{todayHours}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-xs text-muted-foreground">This Week</span>
                <span className="text-sm font-bold">{weekHours}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Earnings (Month)</span>
                <span className="text-sm font-bold text-emerald-500">
                  {formatCurrency(stats?.currentMonthEarnings || 0, currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      }
      case 'kpis': {
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/finance')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Business KPIs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-xs text-muted-foreground">Revenue (Month)</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(stats?.currentMonthEarnings || 0, currency)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-2">
                <span className="text-xs text-muted-foreground">Unbilled Amount</span>
                <span className="text-sm font-bold text-amber-500">
                  {formatCurrency(stats?.unbilledAmount || 0, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Active Projects</span>
                <span className="text-sm font-bold">
                  {projects.filter((p) => p.status === 'active').length}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      }
      case 'timer': {
        return (
          <Card className="h-full border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span
                  className="flex items-center gap-2 cursor-pointer hover:underline"
                  onClick={() => navigate('/projects')}
                >
                  <Play className="h-4 w-4 text-emerald-500" /> Quick Stopwatch
                </span>
                {timerStore.isRunning && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              {timerStore.isRunning ? (
                <div className="space-y-3">
                  <div className="text-center font-mono text-3xl font-black tracking-tight tabular-nums">
                    {formatHours(timerStore.elapsedSeconds)}
                  </div>
                  <p className="text-xs text-muted-foreground text-center truncate">
                    Tracking:{' '}
                    <span className="text-foreground font-bold">
                      {timerStore.currentProjectName}
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => timerStore.pauseTimer()}
                    >
                      <Pause className="h-3 w-3 mr-1" /> Pause
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 h-8 text-xs"
                      onClick={() => timerStore.stopTimer()}
                    >
                      <Square className="h-3 w-3 mr-1" /> Stop & Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={timerStore.projectId || ''}
                    onChange={(e) => timerStore.startTimer(e.target.value)}
                    className="w-full text-xs h-9"
                  >
                    <option value="">Choose project...</option>
                    {projects
                      .filter((p) => p.status === 'active')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </Select>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Select a project to trigger immediate work time logging.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'quickStart': {
        const activeProj = projects.filter((p) => p.status === 'active').slice(0, 3)
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-400" /> One-Click Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeProj.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No active projects found.
                </p>
              ) : (
                activeProj.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => timerStore.startTimer(p.id)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2 border border-border/40 hover:bg-accent/40 text-left text-xs font-semibold"
                  >
                    <span className="truncate">{p.name}</span>
                    <Play className="h-3 w-3 text-emerald-500 shrink-0 ml-2" />
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'revenueChart': {
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/finance')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[120px] pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData.slice(-10)}
                    margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="#71717a" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                      formatter={(v) => [`$${((v as number) / 100).toFixed(0)}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      fill="url(#colorRev)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No revenue logs.</p>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'earningsTicker': {
        return (
          <Card
            className="h-full border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5 flex flex-col justify-center p-6 text-center select-none cursor-pointer hover:border-emerald-500/40 transition-colors"
            onClick={() => navigate('/finance')}
          >
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Session Earnings
            </span>
            <h2 className="text-3xl font-black font-mono tracking-tight text-emerald-500 mt-1 tabular-nums">
              {formatCurrency(tickerEarnings, currency)}
            </h2>
            <p className="text-[10px] text-muted-foreground mt-2">
              Increments in real-time as timer ticks.
            </p>
          </Card>
        )
      }
      case 'streak': {
        return (
          <Card
            className="h-full border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 flex flex-col justify-center p-6 text-center select-none cursor-pointer hover:border-amber-500/40 transition-colors"
            onClick={() => navigate('/planner')}
          >
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
              Consistency Streak
            </span>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Flame className="h-7 w-7 text-amber-500 animate-bounce" />
              <h2 className="text-3xl font-black tracking-tight">{streakCount} Days</h2>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Days in a row tracking habits or work.
            </p>
          </Card>
        )
      }
      case 'goalThermometer': {
        const goalCents = stats?.monthlyGoal || 500000
        const revenueCents = stats?.currentMonthEarnings || 0
        const pct = Math.min(100, Math.round((revenueCents / goalCents) * 100))
        return (
          <Card className="h-full">
            <CardHeader className="pb-2 cursor-pointer" onClick={() => navigate('/finance')}>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" /> Monthly Goal
                </span>
                <span className="text-xs text-muted-foreground font-bold">{pct}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-accent/40 rounded-full h-3 overflow-hidden border border-border/30">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Current: {formatCurrency(revenueCents, currency)}</span>
                <span
                  onClick={() => setIsEditingGoal(true)}
                  className="cursor-pointer underline hover:text-foreground transition-colors font-semibold"
                >
                  Goal: {formatCurrency(goalCents, currency)}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      }
      case 'focusToday': {
        const activeTasks = tasks.filter((t) => t.status !== 'done')
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span
                  className="flex items-center gap-2 cursor-pointer hover:underline"
                  onClick={() => navigate('/planner')}
                >
                  <Target className="h-4 w-4 text-amber-500" /> Focus Today (Top 3)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {focusTasksTodayList.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Select focus tasks from planner:
                  </p>
                  <Select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) toggleFocusTaskSelection(e.target.value)
                    }}
                    className="w-full text-xs h-8"
                  >
                    <option value="">Add focus task...</option>
                    {activeTasks.slice(0, 10).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  {focusTasksTodayList.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg p-2 bg-accent/30 border border-border/50 text-xs animate-in slide-in-from-top-1 duration-200"
                    >
                      <span
                        className={`truncate mr-2 ${t.status === 'done' ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {t.title}
                      </span>
                      <input
                        type="checkbox"
                        checked={t.status === 'done'}
                        onChange={() => toggleTaskStatus(t)}
                        className="rounded border-border h-4.5 w-4.5 accent-primary cursor-pointer"
                      />
                    </div>
                  ))}
                  {focusTasksTodayList.length < 3 && (
                    <Select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) toggleFocusTaskSelection(e.target.value)
                      }}
                      className="w-full text-xs h-8 mt-2"
                    >
                      <option value="">Add another focus task...</option>
                      {activeTasks
                        .filter((t) => !selectedFocusTaskIds.includes(t.id))
                        .slice(0, 10)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </Select>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'recentActivity': {
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No recent tracked sessions.
                </p>
              ) : (
                recentActivity.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.type === 'payment') {
                        navigate(`/clients/${item.projectId}`)
                      } else {
                        navigate(`/projects/${item.projectId}`)
                      }
                    }}
                    className="flex items-center justify-between text-xs border-b border-border/30 pb-2 last:border-b-0 cursor-pointer hover:bg-accent/40 rounded px-2 -mx-1 py-1.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'payment' ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <p className="font-medium truncate text-foreground">{item.projectName}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-3">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      {item.type === 'payment' ? (
                        <span className="font-mono text-emerald-500 font-bold">
                          +{formatCurrency(item.earnings, currency)}
                        </span>
                      ) : (
                        <>
                          <span className="font-mono text-foreground font-semibold">
                            {formatHours(item.duration)}
                          </span>
                          {item.earnings > 0 && (
                            <p className="text-[10px] text-emerald-500 font-medium">
                              {formatCurrency(item.earnings, currency)}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'githubStatus': {
        const repoName = githubIssues.find((i) => i.title === 'Repo')?.value
        const numericItems = githubIssues.filter((i) => i.title !== 'Repo')
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Github className="h-4 w-4 text-sky-400" /> GitHub
                {repoName && (
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {repoName}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 pt-2">
              {numericItems.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center col-span-2 py-4">
                  No repo linked. Add a GitHub URL in project settings.
                </p>
              ) : (
                numericItems.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-accent/40 rounded-lg p-3 text-center border border-border/30"
                  >
                    <span className="text-2xl font-black font-mono text-sky-400">
                      {issue.value}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                      {issue.title}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'upcomingCalendar': {
        const items = upcoming.slice(0, 6)
        const fmtDay = (iso: string): string => {
          const d = new Date(iso)
          const today = new Date()
          const tomorrow = new Date()
          tomorrow.setDate(today.getDate() + 1)
          const same = (a: Date, b: Date): boolean => a.toDateString() === b.toDateString()
          if (same(d, today)) return 'Today'
          if (same(d, tomorrow)) return 'Tomorrow'
          return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        }
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/calendar')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-amber-400" /> Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">Nothing coming up.</p>
              ) : (
                items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: it.color }}
                    />
                    <span className="flex-1 truncate">{it.title}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {fmtDay(it.date)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'plannerHabits': {
        const active = habits.filter((h) => !h.archived).slice(0, 6)
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" /> Today&apos;s Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {active.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground py-3 text-center cursor-pointer hover:text-primary"
                  onClick={() => navigate('/planner')}
                >
                  No habits yet — add some.
                </p>
              ) : (
                active.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => toggleHabitWidget(h.id)}
                    className="w-full flex items-center gap-2 text-sm py-1 group/h"
                  >
                    {h.doneToday ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: h.color }} />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground group-hover/h:text-foreground" />
                    )}
                    <span
                      className={`flex-1 truncate text-left ${h.doneToday ? 'line-through text-muted-foreground' : ''}`}
                    >
                      {h.name}
                    </span>
                    {!!h.streak && (
                      <span className="text-[11px] text-orange-400 font-semibold shrink-0">
                        🔥 {h.streak}
                      </span>
                    )}
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'notesList': {
        const list = [...notes]
          .sort((a, b) => Number(b.pinned) - Number(a.pinned))
          .slice(0, 5)
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/notes')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-teal-400" /> Recent Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">No notes yet.</p>
              ) : (
                list.map((n) => (
                  <div key={n.id} className="flex items-center gap-2 text-sm">
                    {n.pinned && <span className="text-[10px]">📌</span>}
                    <span className="flex-1 truncate">{n.title}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'universityCourses': {
        const active = courses.filter((c) => !c.archived).slice(0, 5)
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/university')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-cyan-400" /> University
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between border-b border-border/50 pb-2">
                <span className="text-xs text-muted-foreground">Grade avg</span>
                <span className="text-lg font-black text-cyan-400">
                  {gpa?.gradeAvg != null ? gpa.gradeAvg.toFixed(1) : '—'}
                </span>
              </div>
              {active.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 text-center">No courses yet.</p>
              ) : (
                active.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.currentGrade != null && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {Math.round(c.currentGrade)}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'repoOpener': {
        const projectsWithPaths = projects.filter(
          (p) => p.localPath || p.githubUrl
        )
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-violet-400" /> Projects & Repos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
              {projectsWithPaths.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground py-3 text-center cursor-pointer hover:text-primary"
                  onClick={() => navigate('/projects')}
                >
                  No projects with paths or repos. Add in project settings.
                </p>
              ) : (
                projectsWithPaths.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg hover:bg-accent/40 transition-colors group"
                  >
                    <span className="flex-1 truncate font-medium text-foreground">{p.name}</span>
                    {p.localPath && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.api.projectOpenFolder(p.localPath!)
                        }}
                        className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title={`Open folder: ${p.localPath}`}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {p.githubUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.api.openExternal(p.githubUrl!)
                        }}
                        className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground hover:text-sky-400 transition-colors"
                        title={`Open repo: ${p.githubUrl}`}
                      >
                        <Github className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'healthQuickLog': {
        const hs = healthStats
        const statItems = [
          {
            icon: Droplets,
            label: 'Water',
            value: hs ? `${(hs.waterLoggedToday / 1000).toFixed(1)}L` : '—',
            color: 'text-blue-400'
          },
          {
            icon: Footprints,
            label: 'Steps',
            value: hs ? (hs.stepsLoggedToday > 0 ? hs.stepsLoggedToday.toLocaleString() : '—') : '—',
            color: 'text-green-400'
          },
          {
            icon: Moon,
            label: 'Sleep',
            value: hs?.avgSleepHours7 != null ? `${hs.avgSleepHours7.toFixed(1)}h` : '—',
            color: 'text-indigo-400'
          },
          {
            icon: Dumbbell,
            label: 'Workouts',
            value: hs ? `${hs.workoutCount7}x` : '—',
            color: 'text-rose-400'
          }
        ]
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/health')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" /> Health
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 bg-accent/30 rounded-lg p-2 border border-border/20"
                >
                  <s.icon className={`h-4 w-4 shrink-0 ${s.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold tabular-nums truncate">{s.value}</p>
                    <p className="text-[9px] text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )
      }
      case 'projectsList': {
        const list = projects
          .filter((p) => p.status !== 'archived')
          .slice(0, 8)
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-sky-400" /> Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {list.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground py-3 text-center cursor-pointer hover:text-primary"
                  onClick={() => navigate('/projects')}
                >
                  No projects yet — create one.
                </p>
              ) : (
                list.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="w-full flex items-center gap-2 text-sm py-1 hover:text-primary"
                  >
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        p.workflowStatus === 'done'
                          ? 'bg-emerald-400'
                          : p.workflowStatus === 'on_hold'
                            ? 'bg-amber-400'
                            : 'bg-sky-400'
                      }`}
                    />
                    <span className="flex-1 truncate text-left">{p.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 capitalize">
                      {(p.workflowStatus || 'active').replace('_', ' ')}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'projectStatusBoard': {
        const live = projects.filter((p) => p.status !== 'archived')
        const counts = {
          active: live.filter((p) => (p.workflowStatus || 'active') === 'active').length,
          onHold: live.filter((p) => p.workflowStatus === 'on_hold').length,
          done: live.filter((p) => p.workflowStatus === 'done').length,
          archived: projects.filter((p) => p.status === 'archived').length
        }
        const cell = (label: string, value: number, color: string): React.ReactNode => (
          <div className="bg-accent/40 rounded-lg p-3 text-center border border-border/30">
            <span className={`text-2xl font-black font-mono ${color}`}>{value}</span>
            <p className="text-[10px] text-muted-foreground font-semibold mt-1">{label}</p>
          </div>
        )
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/projects')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Grid className="h-4 w-4 text-sky-400" /> Project Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {cell('Active', counts.active, 'text-sky-400')}
              {cell('On Hold', counts.onHold, 'text-amber-400')}
              {cell('Done', counts.done, 'text-emerald-400')}
              {cell('Archived', counts.archived, 'text-muted-foreground')}
            </CardContent>
          </Card>
        )
      }
      case 'projectTodos': {
        const selectedId = widgetConfig['projectTodos']?.projectId || ''
        const selectable = projects.filter((p) => p.status !== 'archived')
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-400" /> Project Todos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={selectedId}
                onChange={(e) => setWidgetConfig('projectTodos', { projectId: e.target.value })}
                className="text-xs h-8"
              >
                <option value="">Choose a project…</option>
                {selectable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              {selectedId ? (
                <ProjectTodos projectId={selectedId} embedded />
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Pick a project to see its todos.
                </p>
              )}
            </CardContent>
          </Card>
        )
      }
      case 'repoOpener': {
        const repoProjects = projects.filter(
          (p) => p.status !== 'archived' && (p.githubUrl || p.localPath || p.runCommand)
        )
        return (
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-sky-400" /> Repo & Folder Opener
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {repoProjects.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  Add a GitHub URL or local path to a project to open it here.
                </p>
              ) : (
                repoProjects.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm">{p.name}</span>
                    {p.githubUrl && (
                      <button
                        title="Open repository"
                        onClick={() => window.api.openExternal(p.githubUrl as string)}
                        className="text-muted-foreground hover:text-primary p-1"
                      >
                        <Github className="h-4 w-4" />
                      </button>
                    )}
                    {p.localPath && (
                      <button
                        title="Open folder"
                        onClick={() => window.api.projectOpenFolder(p.localPath as string)}
                        className="text-muted-foreground hover:text-primary p-1"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </button>
                    )}
                    {p.runCommand && (
                      <button
                        title="Run command"
                        onClick={async () => {
                          await window.api.projectRunCommand(
                            p.runCommand as string,
                            p.localPath || undefined
                          )
                          toast.success(`Running: ${p.name}`)
                        }}
                        className="text-muted-foreground hover:text-emerald-400 p-1"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      }
      case 'healthQuickLog': {
        const stat = (
          icon: React.ReactNode,
          label: string,
          value: string
        ): React.ReactNode => (
          <div className="flex items-center gap-2 text-sm">
            {icon}
            <span className="flex-1 text-muted-foreground text-xs">{label}</span>
            <span className="font-semibold">{value}</span>
          </div>
        )
        return (
          <Card
            className="h-full cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => navigate('/health')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-400" /> Health Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stat(
                <Droplets className="h-4 w-4 text-sky-400" />,
                'Water',
                healthStats?.waterLoggedToday ? `${healthStats.waterLoggedToday} ml` : '—'
              )}
              {stat(
                <Footprints className="h-4 w-4 text-emerald-400" />,
                'Steps',
                healthStats?.stepsLoggedToday ? healthStats.stepsLoggedToday.toLocaleString() : '—'
              )}
              {stat(
                <Moon className="h-4 w-4 text-indigo-400" />,
                'Sleep (avg 7d)',
                healthStats?.avgSleepHours7 != null ? `${healthStats.avgSleepHours7}h` : '—'
              )}
              {stat(
                <Dumbbell className="h-4 w-4 text-amber-400" />,
                'Workouts (7d)',
                String(healthStats?.workoutCount7 ?? 0)
              )}
            </CardContent>
          </Card>
        )
      }
      default:
        // Render fallback basic widget details
        return (
          <Card className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground">
                {WIDGET_META[id]?.name || id}
              </p>
              <p className="text-[10px] text-muted-foreground/75 mt-1">
                Visit pages for full configurations
              </p>
            </div>
          </Card>
        )
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Your executive business cockpit & life hub
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsGalleryOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-9"
          >
            <LayoutGrid className="h-4 w-4 text-primary" /> Widget Library
          </Button>

          <Button
            onClick={() => setIsManualLogOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 h-9"
          >
            <PenLine className="h-4 w-4 text-emerald-500" /> Manual Log
          </Button>

          {/* Preset trigger dropdown */}
          <Select
            value=""
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              if (v === '__save') {
                setIsPresetSaveOpen(true)
              } else if (v === '__manage') {
                setIsPresetManagerOpen(true)
              } else if (v.startsWith('custom:')) {
                applyCustomPreset(v.slice('custom:'.length))
                toast.success('Layout applied')
              } else {
                applyPreset(v as 'work' | 'finance' | 'planner')
              }
            }}
            className="text-xs h-9 w-36 border-border/70"
          >
            <option value="">Apply Preset...</option>
            <optgroup label="Built-in">
              <option value="work">💻 Deep Work</option>
              <option value="finance">💰 Financials</option>
              <option value="planner">🎯 Life Planner</option>
            </optgroup>
            {customPresets.length > 0 && (
              <optgroup label="My Layouts">
                {customPresets.map((p) => (
                  <option key={p.id} value={`custom:${p.id}`}>
                    ⭐ {p.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="—">
              <option value="__save">💾 Save current layout…</option>
              {customPresets.length > 0 && (
                <option value="__manage">📂 Manage layouts…</option>
              )}
            </optgroup>
          </Select>

          <Button
            onClick={() => setCanvasLocked(!isCanvasLocked)}
            variant="outline"
            size="sm"
            className="h-9 px-3"
            title={isCanvasLocked ? 'Unlock dragging' : 'Lock dragging'}
          >
            {isCanvasLocked ? (
              <Lock className="h-4 w-4 text-amber-500" />
            ) : (
              <Unlock className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          <Button
            onClick={() => setEditMode(!editMode)}
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            className="text-xs h-9 gap-1"
          >
            <SettingsIcon className={`h-4 w-4 ${editMode ? 'animate-spin' : ''}`} />{' '}
            {editMode ? 'Exit Setup' : 'Customize'}
          </Button>

          {editMode && (
            <Button
              onClick={handleResetLayout}
              variant="destructive"
              size="sm"
              className="text-xs h-9"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Saved layout presets manager (edit mode) */}
      {editMode && (
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">My layout presets</h3>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1"
              onClick={() => {
                setIsPresetSaveOpen(true)
              }}
            >
              <Save className="h-3.5 w-3.5" /> Save current layout
            </Button>
          </div>
          {customPresets.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No saved layouts yet. Arrange your widgets, then “Save current layout” to reuse it
              anytime from the Apply Preset menu.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {customPresets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background pl-3 pr-1.5 py-1 text-xs"
                >
                  <button
                    className="font-medium hover:text-primary"
                    onClick={() => {
                      applyCustomPreset(p.id)
                      toast.success(`Applied “${p.name}”`)
                    }}
                    title="Apply this layout"
                  >
                    ⭐ {p.name}
                  </button>
                  <button
                    className="text-muted-foreground hover:text-destructive p-0.5"
                    onClick={() => {
                      if (window.confirm(`Delete layout preset “${p.name}”?`)) {
                        deleteCustomPreset(p.id)
                        toast.success('Preset deleted')
                      }
                    }}
                    title="Delete preset"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Widget Canvas */}
      <ZoomableCanvas pageKey="dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
          {order
            .filter((id) => !hidden.includes(id))
            .map((id) => (
              <Movable
                key={id}
                pageKey="dashboard"
                id={id}
                disabled={!editMode}
                minWidth={280}
                minHeight={150}
                className="transition-transform duration-100"
              >
                {renderWidget(id)}
              </Movable>
            ))}
        </div>
      </ZoomableCanvas>

      {/* Monthly Goal Dialog */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="relative z-10 w-full max-w-sm mx-4 border-primary/20">
            <CardHeader>
              <CardTitle>Adjust Financial Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono">$</span>
                <Input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="5000"
                  className="flex-1 font-mono text-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" className="h-9" onClick={() => setIsEditingGoal(false)}>
                  Cancel
                </Button>
                <Button className="h-9" onClick={handleSaveGoal}>
                  Save Goal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Widget Gallery Modal */}
      {isGalleryOpen && (
        <WidgetGalleryModal
          open={isGalleryOpen}
          onOpenChange={setIsGalleryOpen}
          hiddenWidgets={hidden}
          onToggleWidget={toggleWidget}
        />
      )}

      {/* Preset Save Dialog */}
      {isPresetSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="relative z-10 w-full max-w-sm mx-4 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" /> Save Layout Preset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div>
                <label className="block text-sm font-medium mb-2">Preset Name</label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="e.g. Morning Focus, Client Work..."
                  className="w-full"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && presetName.trim()) {
                      saveCustomPreset(presetName.trim())
                      toast.success(`Saved layout "${presetName.trim()}"`)
                      setPresetName('')
                      setIsPresetSaveOpen(false)
                    }
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  className="h-9"
                  onClick={() => {
                    setPresetName('')
                    setIsPresetSaveOpen(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="h-9"
                  disabled={!presetName.trim()}
                  onClick={() => {
                    saveCustomPreset(presetName.trim())
                    toast.success(`Saved layout "${presetName.trim()}"`)
                    setPresetName('')
                    setIsPresetSaveOpen(false)
                  }}
                >
                  <Save className="h-4 w-4 mr-1.5" /> Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preset Manager Dialog */}
      {isPresetManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="relative z-10 w-full max-w-md mx-4 border-primary/20 max-h-[70vh] flex flex-col">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5 text-primary" /> My Layout Presets
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPresetManagerOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-2">
              {customPresets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No saved layouts yet. Use "Save current layout" to create one.
                </p>
              ) : (
                customPresets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {p.order.filter((w) => !p.hidden.includes(w)).length} visible widgets
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          applyCustomPreset(p.id)
                          toast.success(`Applied "${p.name}"`)
                          setIsPresetManagerOpen(false)
                        }}
                      >
                        <Copy className="h-3 w-3" /> Apply
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          deleteCustomPreset(p.id)
                          toast.success('Preset deleted')
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manual Log Entry Dialog */}
      {isManualLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="relative z-10 w-full max-w-2xl mx-4 border-primary/20 max-h-[85vh] flex flex-col overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PenLine className="h-5 w-5 text-primary" /> Manual Time Entry
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualLogOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              <LogEntryForm
                onSubmitLog={async (logData) => {
                  const res = await window.api.saveLog(logData)
                  if (res.success) {
                    toast.success('Time log saved')
                    loadDashboardData()
                  } else {
                    throw new Error(res.error || 'Failed to save log')
                  }
                }}
                onClose={() => setIsManualLogOpen(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Custom Gallery Modal for customizable widgets
interface WidgetGalleryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  hiddenWidgets: WidgetId[]
  onToggleWidget: (id: WidgetId) => void
}

const WidgetGalleryModal: React.FC<WidgetGalleryProps> = ({
  open,
  onOpenChange,
  hiddenWidgets,
  onToggleWidget
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = useMemo(() => {
    const cats = new Set<string>()
    cats.add('All')
    Object.values(WIDGET_META).forEach((meta) => cats.add(meta.category))
    return Array.from(cats)
  }, [])

  const filteredWidgets = useMemo(() => {
    return Object.entries(WIDGET_META).filter(([id, meta]) => {
      if (!IMPLEMENTED_WIDGET_IDS.includes(id as WidgetId)) return false
      const matchesSearch =
        meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meta.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || meta.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [searchQuery, selectedCategory])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <Card className="relative z-10 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col overflow-hidden border-border/70 shadow-2xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <Grid className="h-5 w-5 text-primary animate-pulse" /> Widget Library
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              ✕
            </Button>
          </div>

          {/* Search and Category picker */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search widgets by name or details..."
                className="pl-9 text-xs h-9"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-colors border ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-accent/40 text-muted-foreground border-border/40 hover:bg-accent/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredWidgets.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center col-span-2 py-12">
                No matching widgets found.
              </p>
            ) : (
              filteredWidgets.map(([id, meta]) => {
                const widgetId = id as WidgetId
                const isHidden = hiddenWidgets.includes(widgetId)
                return (
                  <div
                    key={id}
                    className={`flex flex-col justify-between border rounded-xl p-4 transition-all duration-300 ${
                      !isHidden
                        ? 'border-primary/50 bg-primary/[0.02] shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]'
                        : 'border-border/50 bg-card hover:border-border-foreground/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${CATEGORY_COLORS[meta.category] || 'text-muted-foreground border-border'}`}
                        >
                          {meta.category}
                        </span>
                        {!isHidden && (
                          <span className="text-[10px] text-primary font-bold flex items-center gap-1">
                            <Sparkles className="h-3 w-3 animate-pulse" /> Active
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{meta.name}</h4>
                      <p className="text-[11px] text-muted-foreground leading-normal mb-4">
                        {meta.description}
                      </p>
                    </div>

                    <Button
                      variant={isHidden ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => onToggleWidget(widgetId)}
                      className={`w-full text-xs h-8.5 font-semibold gap-1.5 ${
                        !isHidden
                          ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20'
                          : ''
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <Eye className="h-3.5 w-3.5" /> Display Widget
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> Remove Widget
                        </>
                      )}
                    </Button>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
