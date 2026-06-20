// src/renderer/src/components/OnboardingModal.tsx
// M13 — guided first-run onboarding: pick a persona (optionally seed a starter
// template), set currency, optionally connect the AI assistant. Gated by the
// 'onboarding.completed' setting so it only appears once.

import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { useSettingsStore } from '../store/useSettingsStore'
import { toast } from '../store/useToastStore'
import { Sparkles, Briefcase, GraduationCap, Palette, Check } from 'lucide-react'
import type { Currency } from '../../../shared/types'

type Persona = 'freelancer' | 'student' | 'creator'

const PERSONAS: { id: Persona; label: string; desc: string; icon: typeof Briefcase }[] = [
  {
    id: 'freelancer',
    label: 'Freelancer',
    desc: 'Clients, projects, invoices & income goals',
    icon: Briefcase
  },
  {
    id: 'student',
    label: 'Student',
    desc: 'Courses, assignments, study habits & GPA',
    icon: GraduationCap
  },
  {
    id: 'creator',
    label: 'Creator / Hobbyist',
    desc: 'Personal projects, habits & creative goals',
    icon: Palette
  }
]

const CURRENCIES: Currency[] = ['USD', 'EUR', 'TRY', 'GBP', 'CAD', 'AUD', 'JPY']

const OnboardingModal: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [persona, setPersona] = useState<Persona | null>(null)
  const [seed, setSeed] = useState(true)
  const [currency, setCurrency] = useState<Currency>('USD')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const res = await window.api.getSetting('onboarding.completed')
      const done = res.success && res.data ? JSON.parse(res.data) === true : false
      if (!cancelled && !done) setOpen(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const finish = async (): Promise<void> => {
    setBusy(true)
    try {
      await window.api.setSettings({ general: { currency } as any })
      if (apiKey.trim()) await window.api.setSetting('ai.apiKey', JSON.stringify(apiKey.trim()))
      if (persona && seed) {
        const res = await window.api.applyTemplate(persona)
        if (res.success && res.data) {
          const total = Object.values(res.data.created).reduce((a, b) => a + b, 0)
          toast.success(`Added ${total} starter items for ${persona}`)
        }
      }
      await window.api.setSetting('onboarding.completed', JSON.stringify(true))
      await loadSettings()
      window.location.hash =
        persona === 'student' ? '#/university' : persona === 'creator' ? '#/hobbies' : '#/'
    } catch {
      toast.error('Setup failed — you can finish later from Settings')
    } finally {
      setBusy(false)
      setOpen(false)
    }
  }

  const skip = async (): Promise<void> => {
    await window.api.setSetting('onboarding.completed', JSON.stringify(true))
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Welcome to Valute
            </span>
          </div>
          <div className="flex gap-1.5 mt-3">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-7 pb-2 min-h-[280px]">
          {step === 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Make it yours</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Pick what best describes you. We&apos;ll set up a starter you can edit or delete.
              </p>
              <div className="space-y-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={
                      'w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ' +
                      (persona === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/50')
                    }
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <p.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    {persona === p.id && <Check className="h-5 w-5 text-primary" />}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seed}
                  onChange={(e) => setSeed(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Add sample data to get started
              </label>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">Your currency</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Used across invoices, earnings and goals. You can change it later in Settings.
              </p>
              <Select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-1">AI assistant (optional)</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Paste your Anthropic API key to enable the in-app assistant for natural-language
                quick-add, weekly summaries and Q&amp;A over your own data. Stored locally; skip and
                add it anytime.
              </p>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-... (optional)"
                className="h-10 text-base border rounded-md"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-border/50">
          <button onClick={skip} className="text-sm text-muted-foreground hover:text-foreground">
            Skip setup
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={busy}>
                Back
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !persona}>
                Continue
              </Button>
            ) : (
              <Button onClick={finish} disabled={busy}>
                {busy ? 'Setting up…' : 'Finish'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingModal
