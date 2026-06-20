// src/renderer/src/pages/CalendarPage.tsx
// M11 — Unified calendar: manual events + deadlines from tasks, assignments and
// invoices, with reminders that fire as desktop notifications.

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CalendarItem, EventIPC, EventRecurrence, LifeArea } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { LIFE_AREAS } from '../lib/lifeAreas'
import { toast } from '../store/useToastStore'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Bell,
  MapPin,
  X
} from 'lucide-react'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const REMINDER_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'No reminder', value: null },
  { label: 'At start time', value: 0 },
  { label: '10 minutes before', value: 10 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '1 day before', value: 1440 }
]

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function itemDayKey(iso: string): string {
  return dayKey(new Date(iso))
}

// Build a 6-row month matrix starting on Monday.
function buildMatrix(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7 // Monday = 0
  const start = new Date(year, month, 1 - startOffset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  }
  return days
}

interface EditorState {
  id: string | null
  title: string
  area: LifeArea
  date: string // YYYY-MM-DD
  time: string // HH:MM
  allDay: boolean
  recurrence: EventRecurrence
  reminderMinutes: number | null
  location: string
  description: string
}

function blankEditor(date: string): EditorState {
  return {
    id: null,
    title: '',
    area: 'general',
    date,
    time: '09:00',
    allDay: false,
    recurrence: 'none',
    reminderMinutes: null,
    location: '',
    description: ''
  }
}

const CalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [items, setItems] = useState<CalendarItem[]>([])
  const [selected, setSelected] = useState<string>(dayKey(today))
  const [editor, setEditor] = useState<EditorState | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const matrix = useMemo(() => buildMatrix(year, month), [year, month])

  const refresh = useCallback(async () => {
    // Load the whole visible matrix range (6 weeks).
    const start = matrix[0]
    const end = matrix[matrix.length - 1]
    const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59)
    const res = await window.api.getCalendar(start.toISOString(), endOfDay.toISOString())
    if (res.success && res.data) setItems(res.data)
  }, [matrix])

  useEffect(() => {
    refresh()
  }, [refresh])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const it of items) {
      const key = itemDayKey(it.date)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return map
  }, [items])

  const selectedItems = itemsByDay.get(selected) || []

  const openNew = (dateKey: string): void => setEditor(blankEditor(dateKey))

  const openEdit = async (item: CalendarItem): Promise<void> => {
    if (item.source !== 'event') {
      navigate(item.route)
      return
    }
    const res = await window.api.getEvents()
    const ev = res.success && res.data ? res.data.find((e) => e.id === item.refId) : null
    if (!ev) return
    const d = new Date(ev.startTime)
    setEditor({
      id: ev.id,
      title: ev.title,
      area: ev.area,
      date: dayKey(d),
      time: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      allDay: ev.allDay,
      recurrence: ev.recurrence,
      reminderMinutes: ev.reminderMinutes,
      location: ev.location || '',
      description: ev.description || ''
    })
  }

  const save = async (): Promise<void> => {
    if (!editor) return
    if (!editor.title.trim()) {
      toast.error('Give the event a title')
      return
    }
    const [h, m] = editor.allDay ? [0, 0] : editor.time.split(':').map(Number)
    const [yy, mm, dd] = editor.date.split('-').map(Number)
    const start = new Date(yy, mm - 1, dd, h || 0, m || 0)
    const payload: Partial<EventIPC> & { title: string; startTime: string } = {
      title: editor.title.trim(),
      area: editor.area,
      startTime: start.toISOString(),
      allDay: editor.allDay,
      recurrence: editor.recurrence,
      reminderMinutes: editor.reminderMinutes,
      location: editor.location.trim() || null,
      description: editor.description.trim() || null
    }
    const res = editor.id
      ? await window.api.updateEvent(editor.id, payload)
      : await window.api.createEvent(payload)
    if (res.success) {
      toast.success(editor.id ? 'Event updated' : 'Event added')
      setEditor(null)
      await refresh()
    } else {
      toast.error(res.error || 'Failed to save event')
    }
  }

  const remove = async (): Promise<void> => {
    if (!editor?.id) return
    const res = await window.api.deleteEvent(editor.id)
    if (res.success) {
      toast.success('Event deleted')
      setEditor(null)
      await refresh()
    } else {
      toast.error(res.error || 'Failed to delete')
    }
  }

  const testNotification = async (): Promise<void> => {
    await window.api.testNotification()
    toast.info('Test notification sent')
  }

  const monthItemCount = items.filter((i) =>
    itemDayKey(i.date).startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)
  ).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-sm text-muted-foreground">
              {monthItemCount} item{monthItemCount === 1 ? '' : 's'} this month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={testNotification}>
            <Bell className="h-4 w-4 mr-1.5" /> Test notification
          </Button>
          <Button size="sm" onClick={() => openNew(selected)}>
            <Plus className="h-4 w-4 mr-1.5" /> New event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Month grid */}
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const t = new Date()
                  setCursor(new Date(t.getFullYear(), t.getMonth(), 1))
                  setSelected(dayKey(t))
                }}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCursor(new Date(year, month + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground py-1"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {matrix.map((d) => {
              const key = dayKey(d)
              const inMonth = d.getMonth() === month
              const isToday = key === dayKey(today)
              const isSelected = key === selected
              const dayItems = itemsByDay.get(key) || []
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  onDoubleClick={() => openNew(key)}
                  className={
                    'min-h-[84px] rounded-md border p-1.5 text-left flex flex-col gap-1 transition-colors ' +
                    (isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-border/50 hover:border-primary/50') +
                    (inMonth ? '' : ' opacity-40')
                  }
                >
                  <span
                    className={
                      'text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full ' +
                      (isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')
                    }
                  >
                    {d.getDate()}
                  </span>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayItems.slice(0, 3).map((it) => (
                      <span
                        key={it.id}
                        className={
                          'text-[10px] leading-tight truncate rounded px-1 py-0.5 ' +
                          (it.done ? 'line-through opacity-60' : '')
                        }
                        style={{ backgroundColor: `${it.color}22`, color: it.color }}
                      >
                        {it.title}
                      </span>
                    ))}
                    {dayItems.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayItems.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Agenda for selected day */}
        <div className="bg-card border border-border/50 rounded-lg p-4">
          <h3 className="font-semibold mb-1">
            {new Date(selected).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric'
            })}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {selectedItems.length} item{selectedItems.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-2">
            {selectedItems.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nothing scheduled.
                <br />
                Double-click a day or use “New event”.
              </p>
            )}
            {selectedItems.map((it) => (
              <button
                key={it.id}
                onClick={() => openEdit(it)}
                className="w-full text-left flex items-start gap-2 rounded-md border border-border/50 px-3 py-2 hover:border-primary/50 transition-colors group"
              >
                <span
                  className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: it.color }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={
                      'text-sm font-medium truncate ' +
                      (it.done ? 'line-through text-muted-foreground' : '')
                    }
                  >
                    {it.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {!it.allDay && (
                      <span>
                        {new Date(it.date).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                    <span className="capitalize">{it.source}</span>
                    {it.meta && <span className="truncate">· {it.meta}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {editor && (
        <EventEditor
          editor={editor}
          setEditor={setEditor}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Event editor modal
// ---------------------------------------------------------------------------

const EventEditor: React.FC<{
  editor: EditorState
  setEditor: (e: EditorState) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
}> = ({ editor, setEditor, onSave, onDelete, onClose }) => {
  const set = (patch: Partial<EditorState>): void => setEditor({ ...editor, ...patch })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <h3 className="text-lg font-semibold">{editor.id ? 'Edit event' : 'New event'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              autoFocus
              value={editor.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Event title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <Input
                type="date"
                value={editor.date}
                onChange={(e) => set({ date: e.target.value })}
                className="h-10 text-base border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <Input
                type="time"
                value={editor.time}
                disabled={editor.allDay}
                onChange={(e) => set({ time: e.target.value })}
                className="h-10 text-base border rounded-md disabled:opacity-50"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={editor.allDay}
              onChange={(e) => set({ allDay: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            All day
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Area</label>
              <Select
                value={editor.area}
                onChange={(e) => set({ area: e.target.value as LifeArea })}
              >
                {LIFE_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Repeat</label>
              <Select
                value={editor.recurrence}
                onChange={(e) => set({ recurrence: e.target.value as EventRecurrence })}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reminder</label>
            <Select
              value={editor.reminderMinutes === null ? '' : String(editor.reminderMinutes)}
              onChange={(e) =>
                set({ reminderMinutes: e.target.value === '' ? null : Number(e.target.value) })
              }
            >
              {REMINDER_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value === null ? '' : String(o.value)}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Location
            </label>
            <Input
              value={editor.location}
              onChange={(e) => set({ location: e.target.value })}
              placeholder="Optional"
              className="h-10 text-base border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={editor.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Optional"
              className="min-h-[60px] resize-y"
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-5 border-t border-border/50">
          {editor.id ? (
            <Button variant="ghost" onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSave}>{editor.id ? 'Save' : 'Add event'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage
