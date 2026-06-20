// src/renderer/src/pages/HealthPage.tsx
// M4 — Health & Wellbeing: track sleep, workouts, water, weight, steps, and energy.

import React, { useState, useEffect, useCallback } from 'react'
import type { HealthEntryIPC, HealthStats } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Activity, Droplets, Flame, Scale, Footprints, Moon, Trash2 } from 'lucide-react'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

const HealthPage: React.FC = () => {
  const [entries, setEntries] = useState<HealthEntryIPC[]>([])
  const [stats, setStats] = useState<HealthStats | null>(null)

  // Form states
  const [sleepHours, setSleepHours] = useState<string>('')
  const [waterMl, setWaterMl] = useState<string>('')
  const [workoutDuration, setWorkoutDuration] = useState<string>('')
  const [workoutType, setWorkoutType] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [steps, setSteps] = useState<string>('')
  const [energyLevel, setEnergyLevel] = useState<number>(3)
  const [notes, setNotes] = useState<string>('')

  const refresh = useCallback(async () => {
    const resEntries = await window.api.getHealthEntries()
    const resStats = await window.api.getHealthStats()

    if (resEntries.success && resEntries.data) {
      setEntries(resEntries.data)
      const today = resEntries.data.find((e) => e.date === todayStr())
      if (today) {
        setSleepHours(today.sleepHours?.toString() ?? '')
        setWaterMl(today.waterMl?.toString() ?? '')
        setWorkoutDuration(today.workoutDuration?.toString() ?? '')
        setWorkoutType(today.workoutType ?? '')
        setWeight(today.weight?.toString() ?? '')
        setSteps(today.steps?.toString() ?? '')
        setEnergyLevel(today.energyLevel ?? 3)
        setNotes(today.notes ?? '')
      } else {
        // Reset or leave defaults
        setSleepHours('')
        setWaterMl('')
        setWorkoutDuration('')
        setWorkoutType('')
        setWeight('')
        setSteps('')
        setEnergyLevel(3)
        setNotes('')
      }
    }

    if (resStats.success && resStats.data) {
      setStats(resStats.data)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = async () => {
    await window.api.saveHealthEntry({
      sleepHours: sleepHours ? Number(sleepHours) : null,
      waterMl: waterMl ? Number(waterMl) : null,
      workoutDuration: workoutDuration ? Number(workoutDuration) : null,
      workoutType: workoutType.trim() || null,
      weight: weight ? Number(weight) : null,
      steps: steps ? Number(steps) : null,
      energyLevel: energyLevel,
      notes: notes.trim() || null
    })
    await refresh()
  }

  const remove = async (id: string) => {
    await window.api.deleteHealthEntry(id)
    await refresh()
  }

  const quickAddWater = async (amount: number) => {
    const current = Number(waterMl) || 0
    const next = current + amount
    setWaterMl(next.toString())
    await window.api.saveHealthEntry({
      waterMl: next
    })
    await refresh()
  }

  const loggedToday = entries.some((e) => e.date === todayStr())

  return (
    <div className="p-8 max-w-5xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Activity className="h-7 w-7 text-green-500" />
        <h1 className="text-3xl font-bold">Health & Wellbeing</h1>
      </div>

      {/* Headline Stats Widgets */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-semibold text-muted-foreground">
                Water Today
              </span>
              <Droplets className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{stats.waterLoggedToday}</span>
              <span className="text-xs text-muted-foreground ml-1">ml</span>
            </div>
            <div className="mt-2 flex gap-1">
              <button
                onClick={() => quickAddWater(250)}
                className="text-[10px] bg-muted hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border border-border/50"
              >
                +250ml
              </button>
              <button
                onClick={() => quickAddWater(500)}
                className="text-[10px] bg-muted hover:bg-primary/10 hover:text-primary px-2 py-0.5 rounded border border-border/50"
              >
                +500ml
              </button>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-semibold text-muted-foreground">
                Steps Today
              </span>
              <Footprints className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{stats.stepsLoggedToday.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground ml-1">steps</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              7d avg: <span className="font-medium">{stats.avgSteps7?.toLocaleString() ?? 0}</span>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-semibold text-muted-foreground">
                Sleep Today
              </span>
              <Moon className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{stats.sleepLoggedToday}</span>
              <span className="text-xs text-muted-foreground ml-1">hrs</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              7d avg: <span className="font-medium">{stats.avgSleepHours7 ?? 0} hrs</span>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs uppercase font-semibold text-muted-foreground">
                Workouts (7d)
              </span>
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold">{stats.workoutCount7}</span>
              <span className="text-xs text-muted-foreground ml-1">times</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Total: <span className="font-medium">{stats.workoutMinutes7} mins</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Forms & Check-ins */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Entry Form */}
        <div className="md:col-span-2 bg-card border border-border/50 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h2 className="font-semibold text-lg">
              {loggedToday ? "Update today's metrics" : 'Daily Health Check-in'}
            </h2>
            <span className="text-xs text-muted-foreground">{todayStr()}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Sleep (Hours)
              </label>
              <div className="relative">
                <Moon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Water Intake (ml)
              </label>
              <div className="relative">
                <Droplets className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={waterMl}
                  onChange={(e) => setWaterMl(e.target.value)}
                  placeholder="e.g. 2000"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Daily Steps
              </label>
              <div className="relative">
                <Footprints className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="e.g. 10000"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Weight (kg/lbs)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 75.2"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Workout Duration (mins)
              </label>
              <div className="relative">
                <Flame className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  placeholder="e.g. 45"
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Workout Type
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                  placeholder="e.g. Run, Strength, Yoga"
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Energy Level
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setEnergyLevel(level)}
                  className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                    energyLevel === level
                      ? 'bg-green-500 text-white border-green-500 font-bold'
                      : 'border-border text-muted-foreground hover:border-green-500/50'
                  }`}
                >
                  {level === 1 ? '⚡ Poor' : level === 5 ? '🔋 Peak' : level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Health Notes / Journal
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How do you feel physically? Note symptoms, diet, or gym details..."
              className="min-h-[80px]"
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} className="bg-green-600 hover:bg-green-700 text-white">
              {loggedToday ? 'Update Entry' : 'Save Check-in'}
            </Button>
          </div>
        </div>

        {/* 7-Day Charts / Trends panel */}
        <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg border-b border-border/50 pb-2 mb-4">
              7-Day Trends
            </h2>

            {stats && (
              <div className="space-y-6">
                {/* Sleep bar chart */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <Moon className="h-3.5 w-3.5 text-indigo-500" /> Sleep (Hours)
                    </span>
                    <span className="font-semibold">{stats.avgSleepHours7 ?? 0}h avg</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16 pt-2">
                    {stats.sleepHistory.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                      >
                        <div
                          className="w-full rounded-t bg-indigo-500/70 hover:bg-indigo-500 transition-all"
                          style={{
                            height: s.hours ? `${(s.hours / 12) * 100}%` : '4px'
                          }}
                          title={`${s.date}: ${s.hours ?? 'N/A'}h`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps bar chart */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <Footprints className="h-3.5 w-3.5 text-emerald-500" /> Steps
                    </span>
                    <span className="font-semibold">
                      {stats.avgSteps7?.toLocaleString() ?? 0} avg
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5 h-16 pt-2">
                    {stats.stepsHistory.map((st, idx) => (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                      >
                        <div
                          className="w-full rounded-t bg-emerald-500/70 hover:bg-emerald-500 transition-all"
                          style={{
                            height: st.steps ? `${Math.min(100, (st.steps / 15000) * 100)}%` : '4px'
                          }}
                          title={`${st.date}: ${st.steps?.toLocaleString() ?? 'N/A'}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weight line-equivalent dot indicators */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-green-500" /> Weight Logs
                    </span>
                  </div>
                  <div className="flex justify-between gap-1 text-[10px] text-muted-foreground mt-2 border-t border-border/30 pt-2">
                    {stats.weightHistory.map((w, idx) => (
                      <div key={idx} className="text-center flex-1">
                        <div
                          className={`w-3.5 h-3.5 mx-auto rounded-full border mb-1 flex items-center justify-center ${
                            w.weight
                              ? 'bg-green-500/20 border-green-500 text-green-500'
                              : 'bg-muted border-border text-muted-foreground'
                          }`}
                          title={`${w.date}: ${w.weight ? w.weight + ' kg' : 'No log'}`}
                        >
                          {w.weight ? '✓' : '-'}
                        </div>
                        <span className="text-[8px]">{w.date.slice(-2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
            Keep logging daily to visualize productivity correlations!
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg border-b border-border/50 pb-2">History</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No health logs found. Complete a check-in to get started!
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border/50 rounded-xl p-4 group"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{e.date}</span>
                    <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/25 px-2 py-0.5 rounded-full font-medium">
                      Energy: {e.energyLevel ?? 'N/A'}/5
                    </span>
                    {e.weight && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Scale className="h-3 w-3" /> {e.weight} kg
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {e.sleepHours != null && (
                      <span className="flex items-center gap-1">
                        <Moon className="h-3 w-3 text-indigo-500" /> {e.sleepHours} hrs sleep
                      </span>
                    )}
                    {e.steps != null && (
                      <span className="flex items-center gap-1">
                        <Footprints className="h-3 w-3 text-emerald-500" />{' '}
                        {e.steps.toLocaleString()} steps
                      </span>
                    )}
                    {e.waterMl != null && (
                      <span className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-blue-500" /> {e.waterMl} ml water
                      </span>
                    )}
                    {e.workoutDuration != null && (
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" /> {e.workoutDuration} mins{' '}
                        {e.workoutType ? `(${e.workoutType})` : 'workout'}
                      </span>
                    )}
                  </div>
                  {e.notes && (
                    <p className="text-sm text-muted-foreground mt-2 border-l-2 border-border pl-2 italic">
                      {e.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => remove(e.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HealthPage
