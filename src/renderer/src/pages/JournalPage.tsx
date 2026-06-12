// src/renderer/src/pages/JournalPage.tsx
// M5 — Psychology & mood journal: log today's mood/energy/stress + gratitude,
// see your trend over time.

import React, { useState, useEffect, useCallback } from 'react'
import type { MoodEntryIPC } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { HeartPulse, Trash2 } from 'lucide-react'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']
const MOOD_LABELS = ['Awful', 'Low', 'Okay', 'Good', 'Great']

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntryIPC[]>([])
  const [mood, setMood] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(3)
  const [note, setNote] = useState('')
  const [gratitude, setGratitude] = useState('')

  const refresh = useCallback(async () => {
    const res = await window.api.getMoodEntries()
    if (res.success && res.data) {
      setEntries(res.data)
      const today = res.data.find((e) => e.date === todayStr())
      if (today) {
        setMood(today.mood)
        setEnergy(today.energy ?? 3)
        setStress(today.stress ?? 3)
        setNote(today.note ?? '')
        setGratitude(today.gratitude ?? '')
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const save = async () => {
    await window.api.saveMoodEntry({
      mood,
      energy,
      stress,
      note: note.trim() || null,
      gratitude: gratitude.trim() || null
    })
    await refresh()
  }

  const remove = async (id: string) => {
    await window.api.deleteMoodEntry(id)
    await refresh()
  }

  // last 14 days mini trend
  const last14: { date: string; mood: number | null }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`
    const entry = entries.find((e) => e.date === key)
    last14.push({ date: key, mood: entry?.mood ?? null })
  }
  const avg =
    entries.length > 0
      ? Math.round((entries.reduce((s, e) => s + e.mood, 0) / entries.length) * 10) / 10
      : null

  const loggedToday = entries.some((e) => e.date === todayStr())

  const Scale: React.FC<{
    label: string
    value: number
    onChange: (v: number) => void
    invert?: boolean
  }> = ({ label, value, onChange, invert }) => (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={
              'h-9 w-9 rounded-full text-sm font-medium border transition-all ' +
              (value === n
                ? invert
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary')
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <HeartPulse className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Journal</h1>
      </div>

      {/* Today check-in */}
      <div className="bg-card border border-border/50 rounded-lg p-6 mb-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {loggedToday ? "Today's check-in" : 'How are you today?'}
          </h2>
          <span className="text-xs text-muted-foreground">{todayStr()}</span>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Mood</label>
          <div className="flex gap-2">
            {MOODS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMood(i + 1)}
                title={MOOD_LABELS[i]}
                className={
                  'h-12 w-12 rounded-lg text-2xl transition-all ' +
                  (mood === i + 1
                    ? 'bg-primary/15 ring-2 ring-primary scale-105'
                    : 'hover:bg-muted')
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Scale label="Energy" value={energy} onChange={setEnergy} />
          <Scale label="Stress" value={stress} onChange={setStress} invert />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reflection</label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[80px] resize-y"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Grateful for</label>
          <Textarea
            value={gratitude}
            onChange={(e) => setGratitude(e.target.value)}
            placeholder="One thing you're grateful for today"
            className="min-h-[60px] resize-y"
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={save}>{loggedToday ? 'Update entry' : 'Save entry'}</Button>
        </div>
      </div>

      {/* Trend */}
      <div className="bg-card border border-border/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Last 14 days</p>
          {avg != null && (
            <p className="text-sm text-muted-foreground">
              Avg mood <span className="font-semibold text-foreground">{avg}</span> / 5
            </p>
          )}
        </div>
        <div className="flex items-end gap-1.5 h-24">
          {last14.map((d) => (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end h-full"
              title={d.date}
            >
              <div
                className="w-full rounded-t bg-primary/70"
                style={{
                  height: d.mood ? `${(d.mood / 5) * 100}%` : '4px',
                  opacity: d.mood ? 1 : 0.2
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="space-y-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-3 bg-card border border-border/50 rounded-lg px-4 py-3 group"
          >
            <span className="text-2xl">{MOODS[e.mood - 1]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{e.date}</span>
                {e.energy != null && (
                  <span className="text-xs text-muted-foreground">⚡ {e.energy}</span>
                )}
                {e.stress != null && (
                  <span className="text-xs text-muted-foreground">😰 {e.stress}</span>
                )}
              </div>
              {e.note && <p className="text-sm text-muted-foreground mt-1">{e.note}</p>}
              {e.gratitude && <p className="text-sm text-green-600 mt-1">🙏 {e.gratitude}</p>}
            </div>
            <button
              onClick={() => remove(e.id)}
              className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default JournalPage
