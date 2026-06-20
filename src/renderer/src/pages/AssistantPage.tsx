// src/renderer/src/pages/AssistantPage.tsx
// M10 — AI Assistant: chat over your own data, natural-language quick-add,
// weekly summary and smart insights. Uses your own Anthropic API key (local).

import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { AIChatMessage, AIStatus } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { toast } from '../store/useToastStore'
import {
  Sparkles,
  Send,
  Plus,
  CalendarRange,
  Lightbulb,
  KeyRound,
  Loader2,
  Settings2
} from 'lucide-react'

const AssistantPage: React.FC = () => {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [messages, setMessages] = useState<AIChatMessage[]>([])
  const [input, setInput] = useState('')
  const [quickText, setQuickText] = useState('')
  const [busy, setBusy] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('claude-opus-4-8')
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadStatus = useCallback(async () => {
    const res = await window.api.aiStatus()
    if (res.success && res.data) {
      setStatus(res.data)
      setModel(res.data.model)
      if (!res.data.configured) setShowConfig(true)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  const saveConfig = async (): Promise<void> => {
    if (apiKey.trim()) {
      await window.api.setSetting('ai.apiKey', JSON.stringify(apiKey.trim()))
    }
    await window.api.setSetting('ai.model', JSON.stringify(model))
    toast.success('AI settings saved')
    setApiKey('')
    setShowConfig(false)
    await loadStatus()
  }

  const send = async (): Promise<void> => {
    const text = input.trim()
    if (!text || busy) return
    const next: AIChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    const res = await window.api.aiChat(next, true)
    setBusy(false)
    if (res.success && res.data != null) {
      setMessages([...next, { role: 'assistant', content: res.data }])
    } else {
      toast.error(res.error || 'AI request failed')
      setMessages([...next, { role: 'assistant', content: `⚠️ ${res.error || 'Request failed'}` }])
    }
  }

  const runQuickAdd = async (): Promise<void> => {
    const text = quickText.trim()
    if (!text || busy) return
    setBusy(true)
    const res = await window.api.aiQuickAdd(text)
    setBusy(false)
    if (res.success && res.data) {
      if (res.data.created) {
        toast.success(res.data.summary)
        setQuickText('')
      } else {
        toast.info(res.data.summary)
      }
    } else {
      toast.error(res.error || 'Quick-add failed')
    }
  }

  const runCanned = async (which: 'summary' | 'insights'): Promise<void> => {
    if (busy) return
    setBusy(true)
    const res =
      which === 'summary' ? await window.api.aiWeeklySummary() : await window.api.aiInsights()
    setBusy(false)
    if (res.success && res.data != null) {
      const label = which === 'summary' ? 'Weekly summary' : 'Smart insights'
      setMessages((m) => [
        ...m,
        { role: 'user', content: label },
        { role: 'assistant', content: res.data as string }
      ])
    } else {
      toast.error(res.error || 'Request failed')
    }
  }

  const configured = status?.configured

  return (
    <div className="p-8 max-w-4xl flex flex-col h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Assistant</h1>
            <p className="text-sm text-muted-foreground">
              {configured
                ? `Ask about your data · ${status?.model}`
                : 'Connect your Anthropic API key to begin'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowConfig((s) => !s)}>
          <Settings2 className="h-4 w-4 mr-1.5" /> AI Settings
        </Button>
      </div>

      {showConfig && (
        <div className="bg-card border border-border/50 rounded-lg p-5 mb-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <KeyRound className="h-4 w-4" /> Anthropic API key
          </div>
          <p className="text-xs text-muted-foreground">
            Stored locally in your settings. Get a key at console.anthropic.com. The assistant only
            sends data when you ask it something.
          </p>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={configured ? '•••••••• (set — type to replace)' : 'sk-ant-...'}
            className="h-10 text-base border rounded-md"
          />
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">Model</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="claude-opus-4-8"
              className="h-10 text-base border rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfig(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={saveConfig}>
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Quick add */}
      <div className="flex gap-2 mb-3">
        <Input
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runQuickAdd()}
          placeholder='Quick add — e.g. "call dentist tomorrow 3pm" or "read 20 pages daily"'
          className="h-10 text-base border rounded-md flex-1"
          disabled={!configured || busy}
        />
        <Button onClick={runQuickAdd} disabled={!configured || busy} variant="secondary">
          <Plus className="h-4 w-4 mr-1.5" /> Add
        </Button>
      </div>

      {/* Canned actions */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => runCanned('summary')}
          disabled={!configured || busy}
        >
          <CalendarRange className="h-4 w-4 mr-1.5" /> Weekly summary
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => runCanned('insights')}
          disabled={!configured || busy}
        >
          <Lightbulb className="h-4 w-4 mr-1.5" /> Smart insights
        </Button>
      </div>

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {configured
                ? 'Ask me anything about your work, money, study, or health.\nTry: “How am I doing this month?”'
                : 'Add your API key above to start.'}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ' +
                (m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border border-border/50 rounded-bl-sm')
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Chat input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about your data…"
          className="h-11 text-base border rounded-md flex-1"
          disabled={!configured || busy}
        />
        <Button onClick={send} disabled={!configured || busy}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default AssistantPage
