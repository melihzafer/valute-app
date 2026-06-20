// src/main/services/NotificationService.ts
// M11 — desktop notifications: event reminders + an optional daily briefing.
// Runs entirely in the main process on a 30s tick.

import { Notification } from 'electron'
import * as CalendarService from './CalendarService'
import { getSetting } from './SettingsService'

let tickInterval: NodeJS.Timeout | null = null
let lastBriefingDay: string | null = null

interface NotifSettings {
  enabled: boolean
  dailyBriefing: boolean
  briefingHour: number
}

async function readSettings(): Promise<NotifSettings> {
  const parse = async (key: string, fallback: unknown): Promise<unknown> => {
    try {
      const raw = await getSetting(key)
      return raw == null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  }
  return {
    enabled: (await parse('notifications.enabled', true)) as boolean,
    dailyBriefing: (await parse('notifications.dailyBriefing', true)) as boolean,
    briefingHour: (await parse('notifications.briefingHour', 8)) as number
  }
}

function notify(title: string, body: string): void {
  if (!Notification.isSupported()) return
  try {
    new Notification({ title, body, silent: false }).show()
  } catch (err) {
    console.error('[Notifications] failed to show:', err)
  }
}

function localDay(d = new Date()): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

async function tick(): Promise<void> {
  let settings: NotifSettings
  try {
    settings = await readSettings()
  } catch {
    return
  }
  if (!settings.enabled) return

  // 1) Event reminders
  try {
    const due = await CalendarService.getDueReminders()
    for (const r of due) {
      notify(`⏰ ${r.title}`, r.body)
      await CalendarService.markReminderNotified(r.eventId, r.occurrenceISO)
    }
  } catch (err) {
    console.error('[Notifications] reminder check failed:', err)
  }

  // 2) Daily briefing — once per day at/after the configured hour
  if (settings.dailyBriefing) {
    const now = new Date()
    const today = localDay(now)
    if (lastBriefingDay !== today && now.getHours() >= settings.briefingHour) {
      lastBriefingDay = today
      try {
        const todayEnd = new Date(now)
        todayEnd.setHours(23, 59, 59, 999)
        const items = await CalendarService.getCalendar(now.toISOString(), todayEnd.toISOString())
        const open = items.filter((i) => !i.done)
        if (open.length > 0) {
          const lead = open
            .slice(0, 3)
            .map((i) => i.title)
            .join(', ')
          const extra = open.length > 3 ? ` +${open.length - 3} more` : ''
          notify(
            `Good day — ${open.length} thing${open.length === 1 ? '' : 's'} today`,
            `${lead}${extra}`
          )
        }
      } catch (err) {
        console.error('[Notifications] briefing failed:', err)
      }
    }
  }
}

/** Start the notification scheduler. Safe to call once at app startup. */
export function startNotificationService(): void {
  if (tickInterval) clearInterval(tickInterval)
  // First tick shortly after startup, then every 30s.
  setTimeout(() => void tick(), 8000)
  tickInterval = setInterval(() => void tick(), 30000)
}

export function stopNotificationService(): void {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

/** Fire a one-off test notification (used by the settings "Test" button). */
export function sendTestNotification(): void {
  notify('Valute notifications are on ✅', 'You will be reminded about events and deadlines here.')
}
