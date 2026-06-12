// src/renderer/src/pages/PlannerPage.tsx
// M8 — Unified tasks, goals and habits across every life area.

import React, { useState, useEffect, useCallback } from 'react'
import type { TaskIPC, GoalIPC, HabitIPC, LifeArea, TaskPriority } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Dialog } from '../components/ui/Dialog'
import { LIFE_AREAS, areaColor, areaLabel } from '../lib/lifeAreas'
import { CheckSquare, Target, Repeat, Plus, Trash2, Flame } from 'lucide-react'

type Tab = 'tasks' | 'goals' | 'habits'

const priorityStyle: Record<TaskPriority, string> = {
  high: 'text-red-500 border-red-500/30 bg-red-500/10',
  medium: 'text-amber-500 border-amber-500/30 bg-amber-500/10',
  low: 'text-slate-400 border-border bg-muted'
}

const PlannerPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('tasks')
  const [tasks, setTasks] = useState<TaskIPC[]>([])
  const [goals, setGoals] = useState<GoalIPC[]>([])
  const [habits, setHabits] = useState<HabitIPC[]>([])

  const refresh = useCallback(async () => {
    const [t, g, h] = await Promise.all([
      window.api.getTasks(),
      window.api.getGoals(),
      window.api.getHabits()
    ])
    if (t.success && t.data) setTasks(t.data)
    if (g.success && g.data) setGoals(g.data)
    if (h.success && h.data) setHabits(h.data)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const tabs: { id: Tab; label: string; icon: typeof CheckSquare }[] = [
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'habits', label: 'Habits', icon: Repeat }
  ]

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <CheckSquare className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Planner</h1>
      </div>

      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ' +
              (tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground')
            }
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && <TasksTab tasks={tasks} refresh={refresh} />}
      {tab === 'goals' && <GoalsTab goals={goals} refresh={refresh} />}
      {tab === 'habits' && <HabitsTab habits={habits} refresh={refresh} />}
    </div>
  )
}

// ---------------- Tasks ----------------

const TasksTab: React.FC<{ tasks: TaskIPC[]; refresh: () => Promise<void> }> = ({
  tasks,
  refresh
}) => {
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<LifeArea>('work')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [due, setDue] = useState('')
  const [areaFilter, setAreaFilter] = useState<'all' | LifeArea>('all')

  const add = async () => {
    if (!title.trim()) return
    await window.api.createTask({
      title: title.trim(),
      area,
      priority,
      dueDate: due ? new Date(due).toISOString() : null
    })
    setTitle('')
    setDue('')
    await refresh()
  }

  const toggle = async (t: TaskIPC) => {
    await window.api.updateTask(t.id, { status: t.status === 'done' ? 'todo' : 'done' })
    await refresh()
  }

  const remove = async (id: string) => {
    await window.api.deleteTask(id)
    await refresh()
  }

  const visible = tasks.filter((t) => areaFilter === 'all' || t.area === areaFilter)
  const open = visible.filter((t) => t.status !== 'done')
  const done = visible.filter((t) => t.status === 'done')

  const fmtDue = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const isOverdue = d < new Date()
    return (
      <span className={isOverdue ? 'text-red-500' : 'text-muted-foreground'}>
        {d.toLocaleDateString()}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick add */}
      <div className="flex flex-wrap gap-2 items-end bg-card border border-border/50 rounded-lg p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-muted-foreground mb-1">New task</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="What needs doing?"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Area</label>
          <Select
            value={area}
            onChange={(e) => setArea(e.target.value as LifeArea)}
            className="w-32"
          >
            {LIFE_AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Priority</label>
          <Select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-28"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Due</label>
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-40"
          />
        </div>
        <Button onClick={add} disabled={!title.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Area filter */}
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', label: 'All' }, ...LIFE_AREAS].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setAreaFilter(chip.id as 'all' | LifeArea)}
            className={
              'px-3 py-1 text-xs rounded-full border transition-colors ' +
              (areaFilter === chip.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:text-foreground')
            }
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Open tasks */}
      <div className="space-y-2">
        {open.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">Nothing open here. Nice.</p>
        )}
        {open.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-card border border-border/50 rounded-lg px-4 py-2.5 group"
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() => toggle(t)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: areaColor(t.area) }}
              title={areaLabel(t.area)}
            />
            <span className="flex-1 text-sm">{t.title}</span>
            {t.dueDate && <span className="text-xs">{fmtDue(t.dueDate)}</span>}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-sm border capitalize ${priorityStyle[t.priority]}`}
            >
              {t.priority}
            </span>
            <button
              onClick={() => remove(t.id)}
              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Done ({done.length})
          </p>
          <div className="space-y-1">
            {done.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-2 rounded-lg group hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  checked
                  onChange={() => toggle(t)}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <span className="flex-1 text-sm line-through text-muted-foreground">{t.title}</span>
                <button
                  onClick={() => remove(t.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------- Goals ----------------

const GoalsTab: React.FC<{ goals: GoalIPC[]; refresh: () => Promise<void> }> = ({
  goals,
  refresh
}) => {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [area, setArea] = useState<LifeArea>('work')
  const [target, setTarget] = useState('100')
  const [unit, setUnit] = useState('%')

  const add = async () => {
    if (!title.trim()) return
    await window.api.createGoal({
      title: title.trim(),
      area,
      targetValue: Number(target) || 100,
      unit: unit || null
    })
    setTitle('')
    setTarget('100')
    setUnit('%')
    setOpen(false)
    await refresh()
  }

  const bump = async (g: GoalIPC, delta: number) => {
    const next = Math.max(0, Math.min(g.targetValue, g.currentValue + delta))
    await window.api.updateGoal(g.id, {
      currentValue: next,
      status: next >= g.targetValue ? 'done' : 'active'
    })
    await refresh()
  }

  const remove = async (id: string) => {
    await window.api.deleteGoal(id)
    await refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No goals yet. What are you aiming for?
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct = g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0
            return (
              <div key={g.id} className="bg-card border border-border/50 rounded-lg p-4 group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: areaColor(g.area) }}
                    />
                    <h3 className="font-semibold">{g.title}</h3>
                  </div>
                  <button
                    onClick={() => remove(g.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {g.currentValue} / {g.targetValue} {g.unit}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => bump(g, -1)}>
                      −
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => bump(g, 1)}>
                      +
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        trigger={<span style={{ display: 'none' }} />}
        title="New Goal"
        open={open}
        onOpenChange={setOpen}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Area</label>
              <Select value={area} onChange={(e) => setArea(e.target.value as LifeArea)}>
                {LIFE_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Target</label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="%, hrs" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add} disabled={!title.trim()}>
              Add Goal
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

// ---------------- Habits ----------------

const HabitsTab: React.FC<{ habits: HabitIPC[]; refresh: () => Promise<void> }> = ({
  habits,
  refresh
}) => {
  const [name, setName] = useState('')
  const [area, setArea] = useState<LifeArea>('health')

  const add = async () => {
    if (!name.trim()) return
    await window.api.createHabit({ name: name.trim(), area, color: areaColor(area) })
    setName('')
    await refresh()
  }

  const toggle = async (id: string) => {
    await window.api.toggleHabit(id)
    await refresh()
  }

  const remove = async (id: string) => {
    await window.api.deleteHabit(id)
    await refresh()
  }

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  // build last-7 weekday letters ending today
  const last7Labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last7Labels.push(dayLabels[(d.getDay() + 6) % 7])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-end bg-card border border-border/50 rounded-lg p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs text-muted-foreground mb-1">New habit</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="e.g., Read 20 minutes"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Area</label>
          <Select
            value={area}
            onChange={(e) => setArea(e.target.value as LifeArea)}
            className="w-32"
          >
            {LIFE_AREAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={add} disabled={!name.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No habits yet. Small daily wins compound.
        </p>
      ) : (
        <div className="space-y-2">
          {habits.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-4 bg-card border border-border/50 rounded-lg px-4 py-3 group"
            >
              <button
                onClick={() => toggle(h.id)}
                className={
                  'h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ' +
                  (h.doneToday ? 'text-white' : 'text-transparent hover:border-primary')
                }
                style={{
                  backgroundColor: h.doneToday ? h.color : 'transparent',
                  borderColor: h.color
                }}
                title={h.doneToday ? 'Done today' : 'Mark done'}
              >
                ✓
              </button>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{h.name}</div>
                <div className="text-xs text-muted-foreground">{areaLabel(h.area)}</div>
              </div>
              {/* last 7 days */}
              <div className="flex items-center gap-1">
                {(h.last7 || []).map((done, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <span className="text-[9px] text-muted-foreground">{last7Labels[i]}</span>
                    <span
                      className="h-4 w-4 rounded-sm"
                      style={{ backgroundColor: done ? h.color : 'var(--muted, #e5e7eb)' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-semibold text-sm w-12 justify-end">
                <Flame className="h-4 w-4" /> {h.streak ?? 0}
              </div>
              <button
                onClick={() => remove(h.id)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlannerPage
