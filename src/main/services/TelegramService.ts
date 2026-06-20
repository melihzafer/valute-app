// src/main/services/TelegramService.ts
// Telegram bot notification service for Project Hub

import { getSetting } from './SettingsService'

const TELEGRAM_API = 'https://api.telegram.org'

async function getBotToken(): Promise<string | null> {
  try {
    const raw = await getSetting('telegram.botToken')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' && parsed.trim() ? parsed.trim() : null
  } catch {
    return null
  }
}

async function getChatId(): Promise<string | null> {
  try {
    const raw = await getSetting('telegram.chatId')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' && parsed.trim() ? parsed.trim() : null
  } catch {
    return null
  }
}

async function isEnabled(): Promise<boolean> {
  try {
    const raw = await getSetting('telegram.enabled')
    if (!raw) return false
    const parsed = JSON.parse(raw)
    return parsed === true
  } catch {
    return false
  }
}

export async function sendMessage(text: string): Promise<void> {
  const enabled = await isEnabled()
  if (!enabled) return

  const botToken = await getBotToken()
  const chatId = await getChatId()
  if (!botToken || !chatId) return

  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    })
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Telegram API error:', res.status, body)
    throw new Error(`Telegram API returned ${res.status}: ${body}`)
  }
}

export async function sendStatusUpdate(
  projectName: string,
  goal: string,
  status: 'running' | 'completed' | 'failed' | 'stopped',
  progress: number
): Promise<void> {
  const emoji = status === 'running' ? '⏳' : status === 'completed' ? '✅' : status === 'failed' ? '❌' : '🛑'
  const progressBar = generateProgressBar(progress)

  const message = [
    `${emoji} *${projectName}* — Claude Code ${status}`,
    '',
    `Goal: \`${goal}\``,
    `Progress: ${progressBar} ${progress}%`,
    ''
  ].join('\n')

  await sendMessage(message)
}

function generateProgressBar(percent: number, length = 12): string {
  const filled = Math.round((percent / 100) * length)
  const empty = length - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

export async function testConnection(): Promise<boolean> {
  const botToken = await getBotToken()
  const chatId = await getChatId()
  if (!botToken || !chatId) return false

  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: '🔌 *Valute Project Hub* — Telegram bağlantısı başarılı!',
      parse_mode: 'Markdown'
    })
  })

  return res.ok
}
