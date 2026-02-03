// src/renderer/src/components/ScreenshotCountdown.tsx
// Screenshot countdown toast component (Phase 10)

import React, { useEffect, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { Button } from './ui/Button'

export const ScreenshotCountdown: React.FC = () => {
  const [countdown, setCountdown] = useState<number | null>(null)

  useEffect(() => {
    // Listen for countdown start from main process
    const unsubscribe = window.api.onScreenshotCountdownStart((data) => {
      setCountdown(data.seconds)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    // Listen for countdown cancellation
    const unsubscribe = window.api.onScreenshotCountdownCancelled(() => {
      setCountdown(null)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    // Listen for capture complete
    const unsubscribe = window.api.onScreenshotCaptured(() => {
      setCountdown(null)
    })

    return unsubscribe
  }, [])

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return
    if (countdown <= 0) {
      setCountdown(null)
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  const handleSkip = async () => {
    await window.api.skipPendingCapture()
    setCountdown(null)
  }

  if (countdown === null) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
      <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-lg shadow-lg">
        <div className="p-2 bg-primary/10 rounded-full">
          <Camera className="h-5 w-5 text-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">
            Screenshot in {countdown}s...
          </span>
          <span className="text-xs text-muted-foreground">
            Click Skip to cancel
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="ml-2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default ScreenshotCountdown
