// src/main/services/AIService.ts
// M10 — In-app AI assistant powered by the Anthropic API (user-supplied key).
// Capabilities: Q&A over the user's own data, natural-language quick-add,
// weekly summaries, and smart insights. Privacy-aware: data only leaves the
// machine when the user actively asks the assistant something.

import Anthropic from '@anthropic-ai/sdk'
import { getSetting } from './SettingsService'
import * as LifeService from './LifeService'
import * as TaskService from './TaskService'
import * as CalendarService from './CalendarService'
import * as HealthService from './HealthService'
import * as MoodService from './MoodService'
import { createNote } from './NotesService'
import { getProjects } from './ProjectService'
import * as DashboardService from './DashboardService'

const DEFAULT_MODEL = 'claude-opus-4-8'

export interface AIStatus {
  configured: boolean
  model: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

async function getModel(): Promise<string> {
  try {
    const raw = await getSetting('ai.model')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string' && parsed.trim()) return parsed
    }
  } catch {
    /* fall through to default */
  }
  return DEFAULT_MODEL
}

async function getApiKey(): Promise<string | null> {
  try {
    const raw = await getSetting('ai.apiKey')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' && parsed.trim() ? parsed.trim() : null
  } catch {
    return null
  }
}

async function getClient(): Promise<{ client: Anthropic; model: string }> {
  const apiKey = await getApiKey()
  if (!apiKey) {
    throw new Error(
      'No AI API key set. Add your Anthropic API key in Settings → AI Assistant to enable the assistant.'
    )
  }
  const model = await getModel()
  return { client: new Anthropic({ apiKey }), model }
}

export async function getStatus(): Promise<AIStatus> {
  return { configured: !!(await getApiKey()), model: await getModel() }
}

function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()
}

// ---------------------------------------------------------------------------
// Data snapshot — compact, bounded context about the user's own data.
// ---------------------------------------------------------------------------

async function buildContext(): Promise<string> {
  const parts: string[] = []
  try {
    const o = await LifeService.getLifeOverview()
    parts.push(
      `LIFE OVERVIEW: tasks due today ${o.tasksDueToday}, overdue ${o.tasksOverdue}; ` +
        `habits ${o.habitsDoneToday}/${o.habitsTotal} done today; assignments due in 7d ${o.assignmentsDueSoon}; ` +
        `active goals ${o.activeGoals}; mood logged today ${o.moodLoggedToday}; avg mood (7d) ${o.avgMood7 ?? 'n/a'}; ` +
        `earnings this month $${(o.earningsThisMonth / 100).toFixed(2)}; hours this week ${(o.hoursThisWeek / 3600).toFixed(1)}; active projects ${o.activeProjects}.`
    )
  } catch {
    /* ignore */
  }
  try {
    const tasks = (await TaskService.getTasks()).filter((t) => t.status !== 'done')
    const top = tasks
      .slice(0, 15)
      .map(
        (t) =>
          `- ${t.title} [${t.area}/${t.priority}${t.dueDate ? `, due ${t.dueDate.slice(0, 10)}` : ''}]`
      )
    if (top.length) parts.push(`OPEN TASKS (${tasks.length}):\n${top.join('\n')}`)
  } catch {
    /* ignore */
  }
  try {
    const upcoming = (await CalendarService.getUpcoming(7)).slice(0, 12)
    if (upcoming.length) {
      parts.push(
        `UPCOMING (next 7 days):\n${upcoming.map((i) => `- ${i.date.slice(0, 10)} ${i.title} (${i.source})`).join('\n')}`
      )
    }
  } catch {
    /* ignore */
  }
  try {
    const projects = (await getProjects()).filter((p: any) => p.status === 'active').slice(0, 12)
    if (projects.length)
      parts.push(
        `ACTIVE PROJECTS:\n${projects.map((p: any) => `- ${p.name} (${p.category || 'work'})`).join('\n')}`
      )
  } catch {
    /* ignore */
  }
  try {
    const h = await HealthService.getHealthStats()
    parts.push(
      `HEALTH: avg sleep 7d ${h.avgSleepHours7 ?? 'n/a'}h, avg steps 7d ${h.avgSteps7 ?? 'n/a'}, workouts 7d ${h.workoutCount7}.`
    )
  } catch {
    /* ignore */
  }
  try {
    const moods = (await MoodService.getMoodEntries()).slice(0, 7)
    if (moods.length)
      parts.push(
        `RECENT MOOD (1-5): ${moods.map((m) => `${m.date.slice(5)}:${m.mood}`).join(', ')}.`
      )
  } catch {
    /* ignore */
  }
  try {
    const d = DashboardService.getStats()
    parts.push(
      `FINANCE: this month earnings $${(d.currentMonthEarnings / 100).toFixed(2)}, unbilled $${(d.unbilledAmount / 100).toFixed(2)}, goal progress ${d.goalProgress}%.`
    )
  } catch {
    /* ignore */
  }
  return parts.join('\n\n')
}

const ASSISTANT_SYSTEM = `You are Valute's built-in assistant. Valute is a local-first desktop app that tracks the user's work, freelance finances, university, health, mood, habits, goals, notes, and calendar — their whole life in one place.

You are given a snapshot of the user's own data below. Answer questions about it directly and concisely, in plain language. When the user asks "how am I doing", give specific numbers from the data, note trends, and offer one or two gentle, actionable suggestions. Never invent data that isn't in the snapshot — if something isn't there, say you don't have it. Keep answers short unless asked for detail. Use the user's currency figures as given.`

// ---------------------------------------------------------------------------
// Chat / Q&A over the user's data
// ---------------------------------------------------------------------------

export async function chat(messages: ChatMessage[], includeData = true): Promise<string> {
  const { client, model } = await getClient()
  const context = includeData ? await buildContext() : ''
  const system = context
    ? `${ASSISTANT_SYSTEM}\n\n=== USER DATA SNAPSHOT ===\n${context}`
    : ASSISTANT_SYSTEM

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content }))
  })
  if (response.stop_reason === 'refusal') {
    return "I can't help with that request."
  }
  return textOf(response) || '(no response)'
}

// ---------------------------------------------------------------------------
// Weekly summary & smart insights
// ---------------------------------------------------------------------------

export async function weeklySummary(): Promise<string> {
  const { client, model } = await getClient()
  const context = await buildContext()
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system: ASSISTANT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here is my data snapshot:\n\n${context}\n\nWrite a short, friendly weekly review in markdown. Cover: what went well, what slipped, money, and 2-3 concrete suggestions for next week. Be specific with the numbers. Keep it under 250 words.`
      }
    ]
  })
  if (response.stop_reason === 'refusal') return "I can't generate that right now."
  return textOf(response)
}

export async function insights(): Promise<string> {
  const { client, model } = await getClient()
  const context = await buildContext()
  const response = await client.messages.create({
    model,
    max_tokens: 1536,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system: ASSISTANT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Here is my data snapshot:\n\n${context}\n\nGive me 3-5 sharp, specific insights as a markdown bullet list — patterns, correlations, or things I should pay attention to across work, money, health, and study. One sentence each. Only use what's in the data.`
      }
    ]
  })
  if (response.stop_reason === 'refusal') return "I can't generate insights right now."
  return textOf(response)
}

// ---------------------------------------------------------------------------
// Natural-language quick-add — parse free text into a structured action,
// then create it through the existing services.
// ---------------------------------------------------------------------------

const QUICK_ADD_SCHEMA = {
  type: 'object' as const,
  properties: {
    kind: { type: 'string', enum: ['task', 'event', 'note', 'habit', 'goal', 'none'] },
    title: { type: 'string' },
    notes: { type: 'string' },
    area: {
      type: 'string',
      enum: ['work', 'uni', 'health', 'psychology', 'hobby', 'money', 'general']
    },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] },
    dueDate: { type: 'string', description: 'ISO 8601 datetime, or empty string if none' },
    startTime: { type: 'string', description: 'ISO 8601 datetime for events, or empty string' }
  },
  required: ['kind', 'title', 'area'],
  additionalProperties: false
}

export interface QuickAddResult {
  created: boolean
  kind: string
  summary: string
}

export async function quickAdd(text: string): Promise<QuickAddResult> {
  const { client, model } = await getClient()
  const now = new Date()
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: QUICK_ADD_SCHEMA }
    },
    system: `You convert a single natural-language line into one structured item for a life-tracking app. The current date/time is ${now.toISOString()} (local: ${now.toLocaleString()}).
- Choose "task" for to-dos, "event" for things with a specific date/time, "note" for information to remember, "habit" for recurring routines, "goal" for measurable objectives. Use "none" only if the text is not actionable.
- Resolve relative dates ("tomorrow", "next Friday 3pm") to absolute ISO 8601 using the current time above. Leave date fields as empty strings when no date is implied.
- Pick the best life area. Keep the title short and clean.`,
    messages: [{ role: 'user', content: text }]
  })

  if (response.stop_reason === 'refusal') {
    return { created: false, kind: 'none', summary: "I can't process that." }
  }

  let parsed: any
  try {
    parsed = JSON.parse(textOf(response))
  } catch {
    return { created: false, kind: 'none', summary: 'Could not understand that — try rephrasing.' }
  }

  const area = parsed.area || 'general'
  const title = (parsed.title || '').trim()
  if (!title || parsed.kind === 'none') {
    return { created: false, kind: 'none', summary: "That didn't look like something to add." }
  }

  switch (parsed.kind) {
    case 'task': {
      await TaskService.createTask({
        title,
        notes: parsed.notes || null,
        area,
        priority: parsed.priority || 'medium',
        dueDate: parsed.dueDate || null
      })
      return {
        created: true,
        kind: 'task',
        summary: `Added task “${title}”${parsed.dueDate ? ` due ${parsed.dueDate.slice(0, 10)}` : ''}.`
      }
    }
    case 'event': {
      const start = parsed.startTime || parsed.dueDate || now.toISOString()
      await CalendarService.createEvent({
        title,
        description: parsed.notes || null,
        area,
        startTime: start
      })
      return {
        created: true,
        kind: 'event',
        summary: `Added event “${title}” on ${start.slice(0, 16).replace('T', ' ')}.`
      }
    }
    case 'note': {
      await createNote({ title, content: parsed.notes || null, area })
      return { created: true, kind: 'note', summary: `Saved note “${title}”.` }
    }
    case 'habit': {
      await TaskService.createHabit({ name: title, area })
      return { created: true, kind: 'habit', summary: `Created habit “${title}”.` }
    }
    case 'goal': {
      await TaskService.createGoal({ title, description: parsed.notes || null, area })
      return { created: true, kind: 'goal', summary: `Created goal “${title}”.` }
    }
    default:
      return { created: false, kind: 'none', summary: "That didn't look like something to add." }
    }
  }
}

// ============================================================
// Ollama — Local model inference
// ============================================================

import { getSetting } from './SettingsService'

async function getOllamaUrl(): Promise<string> {
  try {
    const raw = await getSetting('ai.ollamaUrl')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string' && parsed.trim()) return parsed.trim()
    }
  } catch { /* fall through */ }
  return 'http://localhost:11434'
}

async function getOpenRouterKey(): Promise<string | null> {
  try {
    const raw = await getSetting('ai.openRouterKey')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' && parsed.trim() ? parsed.trim() : null
  } catch { return null }
}

export async function ollamaChat(model: string, messages: ChatMessage[]): Promise<string> {
  const baseUrl = await getOllamaUrl()
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false
    })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Ollama API error (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.message?.content || '(empty response)'
}

export async function listOllamaModels(): Promise<string[]> {
  const baseUrl = await getOllamaUrl()
  const res = await fetch(`${baseUrl}/api/tags`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.models || []).map((m: any) => m.name)
}

// ============================================================
// OpenRouter — Multi-provider API (OpenAI-compatible)
// ============================================================

export async function openRouterChat(model: string, messages: ChatMessage[]): Promise<string> {
  const apiKey = await getOpenRouterKey()
  if (!apiKey) throw new Error('OpenRouter API key not configured. Add it in Settings → Project Hub.')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/valute-app',
      'X-Title': 'Valute Project Hub'
    },
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 4096
    })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter API error (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || '(empty response)'
}

export async function listOpenRouterModels(): Promise<string[]> {
  const apiKey = await getOpenRouterKey()
  if (!apiKey) return []

  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []).map((m: any) => m.id)
}

// ============================================================
// OpenAI-Compatible — Custom base URL (for any OpenAI-API server)
// ============================================================

export async function openaiChat(baseUrl: string, model: string, messages: ChatMessage[]): Promise<string> {
  // Get API key from settings
  let apiKey = ''
  try {
    const raw = await getSetting('ai.openaiKey')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed === 'string') apiKey = parsed
    }
  } catch { /* ignore */ }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 4096
    })
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenAI-compatible API error (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.choices?.[0]?.message?.content || '(empty response)'
}
