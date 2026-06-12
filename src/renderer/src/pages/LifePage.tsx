// src/renderer/src/pages/LifePage.tsx
// M1 — Unified Life Dashboard + M2 — Cross-domain statistics.
// One glanceable view across work, money, uni, mind, habits and goals.

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LifeOverview, LifeStats } from '../../../shared/types'
import { formatCurrency } from '../lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  GraduationCap,
  Target,
  HeartPulse,
  DollarSign,
  Clock,
  Briefcase,
  Flame,
  TrendingUp
} from 'lucide-react'

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']

const LifePage: React.FC = () => {
  const navigate = useNavigate()
  const [ov, setOv] = useState<LifeOverview | null>(null)
  const [stats, setStats] = useState<LifeStats | null>(null)

  const refresh = useCallback(async () => {
    const [o, s] = await Promise.all([window.api.getLifeOverview(), window.api.getLifeStats(30)])
    if (o.success && o.data) setOv(o.data)
    if (s.success && s.data) setStats(s.data)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  })()

  const hoursThisWeek = ov ? Math.round((ov.hoursThisWeek / 3600) * 10) / 10 : 0

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-1">
        <LayoutDashboard className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">{greeting}</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Here's everything across your life, at a glance.
      </p>

      {/* Widget grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Widget
          icon={CheckSquare}
          label="Tasks due today"
          value={ov ? `${ov.tasksDueToday}` : '—'}
          sub={ov && ov.tasksOverdue > 0 ? `${ov.tasksOverdue} overdue` : 'on track'}
          subTone={ov && ov.tasksOverdue > 0 ? 'bad' : 'good'}
          onClick={() => navigate('/planner')}
        />
        <Widget
          icon={Repeat}
          label="Habits today"
          value={ov ? `${ov.habitsDoneToday}/${ov.habitsTotal}` : '—'}
          sub="keep the streak"
          onClick={() => navigate('/planner')}
        />
        <Widget
          icon={GraduationCap}
          label="Due this week"
          value={ov ? `${ov.assignmentsDueSoon}` : '—'}
          sub="assignments"
          onClick={() => navigate('/university')}
        />
        <Widget
          icon={Target}
          label="Active goals"
          value={ov ? `${ov.activeGoals}` : '—'}
          sub="in progress"
          onClick={() => navigate('/planner')}
        />
        <Widget
          icon={HeartPulse}
          label="Mood (7d avg)"
          value={
            ov && ov.avgMood7 != null
              ? `${MOOD_EMOJI[Math.round(ov.avgMood7) - 1]} ${ov.avgMood7}`
              : '—'
          }
          sub={ov?.moodLoggedToday ? 'logged today' : 'not logged yet'}
          subTone={ov?.moodLoggedToday ? 'good' : 'bad'}
          onClick={() => navigate('/journal')}
        />
        <Widget
          icon={DollarSign}
          label="Earnings (month)"
          value={ov ? formatCurrency(ov.earningsThisMonth) : '—'}
          sub="this month"
          onClick={() => navigate('/reports')}
        />
        <Widget
          icon={Clock}
          label="Hours this week"
          value={`${hoursThisWeek}h`}
          sub="tracked"
          onClick={() => navigate('/reports')}
        />
        <Widget
          icon={Briefcase}
          label="Active projects"
          value={ov ? `${ov.activeProjects}` : '—'}
          sub="ongoing"
          onClick={() => navigate('/projects')}
        />
      </div>

      {/* Stats (M2) */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Last 30 days</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MiniStat label="Tasks completed" value={stats ? `${stats.tasksCompleted}` : '—'} />
        <MiniStat
          label="Habit consistency"
          value={stats ? `${Math.round(stats.habitCompletionRate * 100)}%` : '—'}
        />
        <MiniStat
          label="Best streak"
          value={stats ? `${stats.bestHabitStreak}d` : '—'}
          icon={Flame}
        />
        <MiniStat
          label="Avg mood"
          value={stats && stats.avgMood != null ? `${stats.avgMood}/5` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mood trend */}
        <ChartCard title="Mood trend">
          <BarChart
            data={(stats?.moodSeries ?? []).map((d) => ({
              label: d.date,
              value: d.mood ?? 0,
              max: 5
            }))}
            color="#a855f7"
          />
        </ChartCard>

        {/* Task completion */}
        <ChartCard title="Tasks completed per day">
          <BarChart
            data={(stats?.taskCompletion ?? []).map((d) => ({ label: d.date, value: d.completed }))}
            color="#6366f1"
          />
        </ChartCard>

        {/* Habit consistency */}
        <ChartCard title="Habit consistency">
          <BarChart
            data={(stats?.habitConsistency ?? []).map((d) => ({
              label: d.date,
              value: Math.round(d.ratio * 100),
              max: 100
            }))}
            color="#22c55e"
          />
        </ChartCard>

        {/* Hours by area */}
        <ChartCard title="Tracked hours by area">
          {stats && stats.hoursByArea.length > 0 ? (
            <div className="space-y-3 pt-2">
              {stats.hoursByArea.map((h) => {
                const totalSec = stats.hoursByArea.reduce((s, x) => s + x.seconds, 0) || 1
                const pct = Math.round((h.seconds / totalSec) * 100)
                return (
                  <div key={h.area}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize">{h.area}</span>
                      <span className="text-muted-foreground">
                        {Math.round((h.seconds / 3600) * 10) / 10}h
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No tracked time yet.</p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

const Widget: React.FC<{
  icon: typeof CheckSquare
  label: string
  value: string
  sub?: string
  subTone?: 'good' | 'bad'
  onClick?: () => void
}> = ({ icon: Icon, label, value, sub, subTone, onClick }) => (
  <button
    onClick={onClick}
    className="text-left bg-card border border-border/50 rounded-lg p-4 hover:border-primary/40 transition-colors"
  >
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </div>
    <div className="text-2xl font-bold">{value}</div>
    {sub && (
      <div
        className={
          'text-xs mt-1 ' +
          (subTone === 'bad'
            ? 'text-red-500'
            : subTone === 'good'
              ? 'text-green-600'
              : 'text-muted-foreground')
        }
      >
        {sub}
      </div>
    )}
  </button>
)

const MiniStat: React.FC<{ label: string; value: string; icon?: typeof Flame }> = ({
  label,
  value,
  icon: Icon
}) => (
  <div className="bg-card border border-border/50 rounded-lg p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1 flex items-center gap-1.5">
      {Icon && <Icon className="h-5 w-5 text-amber-500" />}
      {value}
    </p>
  </div>
)

const ChartCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card border border-border/50 rounded-lg p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">{title}</p>
    {children}
  </div>
)

const BarChart: React.FC<{
  data: { label: string; value: number; max?: number }[]
  color: string
}> = ({ data, color }) => {
  const max = Math.max(1, ...data.map((d) => d.max ?? d.value))
  return (
    <div className="flex items-end gap-0.5 h-24">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 rounded-t transition-all"
          style={{
            height: `${Math.max(2, (d.value / max) * 100)}%`,
            backgroundColor: color,
            opacity: d.value === 0 ? 0.15 : 0.85
          }}
          title={`${d.label}: ${d.value}`}
        />
      ))}
    </div>
  )
}

export default LifePage
