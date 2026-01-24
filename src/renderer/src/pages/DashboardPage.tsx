// src/renderer/src/pages/DashboardPage.tsx
// Executive Dashboard - High-Performance Business Cockpit

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  Clock,
  Plus,
  FileText,
  BarChart3,
  Target,
  Loader2,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Dialog } from '../components/ui/Dialog'
import LogEntryForm from '../components/LogEntryForm'
import { formatCurrency } from '../lib/utils'
import { useTimerStore } from '../store/useTimerStore'
import { useProjectStore } from '../store/useProjectStore'
import type { DashboardStats, ChartDataPoint, RecentActivityItem } from '../../../shared/types'

// Format duration in seconds to human readable
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

// Format date for chart display
const formatChartDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// KPI Card Component
interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  iconColor?: string
  progress?: number
  onEditGoal?: () => void
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  progress,
  onEditGoal
}) => (
  <Card className="relative overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${iconColor}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Monthly Goal</span>
            <button onClick={onEditGoal} className="text-primary hover:underline text-xs">
              Edit
            </button>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{progress}% of goal</p>
        </div>
      )}
    </CardContent>
  </Card>
)

// Recent Activity Item Component
interface ActivityItemProps {
  item: RecentActivityItem
  currency: string
  onClick: () => void
}

const ActivityItem: React.FC<ActivityItemProps> = ({ item, currency, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-3 px-2 hover:bg-accent/50 rounded-lg transition-colors text-left"
  >
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Clock className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{item.projectName}</p>
        <p className="text-xs text-muted-foreground">
          {formatDuration(item.duration)} • {new Date(item.date).toLocaleDateString()}
        </p>
      </div>
    </div>
    <span className="text-sm font-medium text-primary">
      {formatCurrency(item.earnings / 100, currency)}
    </span>
  </button>
)

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingGoal, setIsEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [currency] = useState('USD') // Could be fetched from settings

  // Timer and log entry state
  const [showLogForm, setShowLogForm] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const { projects, fetchProjects } = useProjectStore()
  const timerStore = useTimerStore()

  // Fetch dashboard data and projects
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Load timer state on mount and set up tick interval for real-time updates
  useEffect(() => {
    timerStore.loadTimerState()
  }, [])

  useEffect(() => {
    if (!timerStore.isRunning) return

    // Update elapsed time every second when timer is running
    const interval = setInterval(() => {
      timerStore.tick()
    }, 1000)

    return () => clearInterval(interval)
  }, [timerStore.isRunning])

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData(): Promise<void> {
      setIsLoading(true)
      try {
        const [statsRes, chartRes, activityRes] = await Promise.all([
          window.api.getDashboardStats(),
          window.api.getRevenueChart(30),
          window.api.getRecentActivity(5)
        ])

        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data)
          setGoalInput(String((statsRes.data.monthlyGoal / 100).toFixed(0)))
        }
        if (chartRes.success && chartRes.data) {
          setChartData(chartRes.data)
        }
        if (activityRes.success && activityRes.data) {
          setRecentActivity(activityRes.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Handle saving monthly goal
  const handleSaveGoal = async (): Promise<void> => {
    const amountCents = Math.round(parseFloat(goalInput) * 100)
    if (isNaN(amountCents) || amountCents < 0) return

    try {
      await window.api.setMonthlyGoal(amountCents)
      // Refresh stats
      const statsRes = await window.api.getDashboardStats()
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }
      setIsEditingGoal(false)
    } catch (error) {
      console.error('Failed to save monthly goal:', error)
    }
  }

  // Navigate to project details
  const handleActivityClick = (projectId: string): void => {
    navigate(`/projects/${projectId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const currentEarningsCents = stats?.currentMonthEarnings ?? 0
  const currentUnbilledCents = stats?.unbilledAmount ?? 0
  const currentExpensesCents = stats?.totalExpensesThisMonth ?? 0
  const netProfitCents = currentEarningsCents - currentExpensesCents

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent w-fit">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Your business at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Monthly Revenue"
          value={formatCurrency(currentEarningsCents / 100, currency)}
          icon={DollarSign}
          iconColor="text-emerald-500"
          progress={stats?.goalProgress}
          onEditGoal={() => setIsEditingGoal(true)}
        />
        <KPICard
          title="Unbilled Work"
          value={formatCurrency(currentUnbilledCents / 100, currency)}
          subtitle="Money on the table"
          icon={TrendingUp}
          iconColor="text-amber-500"
        />
        <KPICard
          title="Active Projects"
          value={String(stats?.activeProjectCount ?? 0)}
          subtitle="Currently in progress"
          icon={Briefcase}
          iconColor="text-blue-500"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(netProfitCents / 100, currency)}
          subtitle="Revenue - Expenses"
          icon={Target}
          iconColor={netProfitCents >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
      </div>

      {/* Timer & Quick Log Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timerStore.isRunning || timerStore.accumulatedTime > 0 ? (
            // Show active timer
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tracking time for</p>
                  <p className="text-lg font-semibold">
                    {timerStore.currentProjectName || 'Unknown Project'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-mono">
                    {formatDuration(timerStore.elapsedSeconds + timerStore.accumulatedTime)}
                  </p>
                  {(() => {
                    const project = projects.find((p) => p.id === timerStore.projectId)
                    if (project?.hourlyRate) {
                      const totalSeconds = timerStore.elapsedSeconds + timerStore.accumulatedTime
                      const earnings = Math.round((totalSeconds / 3600) * project.hourlyRate)
                      return (
                        <p className="text-sm text-emerald-500">
                          {formatCurrency(earnings / 100, currency)}
                        </p>
                      )
                    }
                    return null
                  })()}
                </div>
              </div>
              <div className="flex gap-2">
                {timerStore.isRunning ? (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => timerStore.pauseTimer()}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => timerStore.resumeTimer()}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    await window.api.openFloatingTimer()
                  }}
                  title="Pop out timer window"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => timerStore.stopTimer()}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Save
                </Button>
              </div>
            </div>
          ) : (
            // Show start timer controls
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select a project...</option>
                  {projects
                    .filter((p) => p.status === 'active')
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </Select>
                <Button
                  onClick={() => selectedProjectId && timerStore.startTimer(selectedProjectId)}
                  disabled={!selectedProjectId}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Timer
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setShowLogForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Entry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Log Entry Dialog */}
      <Dialog
        trigger={<></>}
        title="Add Time Entry"
        open={showLogForm}
        onOpenChange={setShowLogForm}
      >
        <LogEntryForm
          onSubmitLog={async (logData): Promise<void> => {
            await window.api.saveLog(logData)
            setShowLogForm(false)
            // Refresh dashboard data
            const [statsRes, activityRes] = await Promise.all([
              window.api.getDashboardStats(),
              window.api.getRecentActivity(5)
            ])
            if (statsRes.success && statsRes.data) setStats(statsRes.data)
            if (activityRes.success && activityRes.data) setRecentActivity(activityRes.data)
          }}
          onClose={() => setShowLogForm(false)}
        />
      </Dialog>

      {/* Goal Edit Modal */}
      {isEditingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsEditingGoal(false)}
          />
          <Card className="relative z-10 w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Set Monthly Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  placeholder="5000"
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditingGoal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveGoal}>Save Goal</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Revenue Trend (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatChartDate}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                    formatter={(value) => [
                      formatCurrency((value as number) / 100, currency),
                      'Revenue'
                    ]}
                    labelFormatter={(label) => formatChartDate(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available. Start tracking time to see your revenue trend.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Recent Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((item) => (
                  <ActivityItem
                    key={item.id}
                    item={item}
                    currency={currency}
                    onClick={() => handleActivityClick(item.projectId)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity. Start tracking time to see your work here.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/projects')}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
