// src/renderer/src/components/ui/Toast.tsx
// Bottom-right toast container

import React from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore, type Toast as ToastItem } from '../../store/useToastStore'

const iconFor: Record<ToastItem['type'], React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  error: <XCircle className="h-5 w-5 text-destructive" />,
  info: <Info className="h-5 w-5 text-primary" />
}

const ToastItemView: React.FC<{ toast: ToastItem }> = ({ toast: t }) => {
  const removeToast = useToastStore((s) => s.removeToast)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm bg-card border border-border rounded-lg shadow-lg px-4 py-3 animate-in slide-in-from-right-full fade-in"
    >
      <div className="flex-shrink-0 mt-0.5">{iconFor[t.type]}</div>
      <p className="flex-1 text-sm text-foreground leading-snug">{t.message}</p>
      <button
        type="button"
        onClick={() => removeToast(t.id)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export const Toaster: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItemView key={t.id} toast={t} />
      ))}
    </div>
  )
}

export default Toaster
