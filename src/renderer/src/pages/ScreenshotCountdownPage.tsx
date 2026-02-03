// src/renderer/src/pages/ScreenshotCountdownPage.tsx
// Floating screenshot countdown window for Phase 10

import React, { useEffect, useState } from 'react'
import { Camera, X } from 'lucide-react'

const ScreenshotCountdownPage: React.FC = () => {
  const [countdown, setCountdown] = useState<number>(10)
  const [status, setStatus] = useState<'countdown' | 'capturing'>('countdown')

  useEffect(() => {
    // Listen for countdown updates from main process
    const cleanup = window.api.onScreenshotCountdown?.((data: { seconds: number }) => {
      setCountdown(data.seconds)
    })

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setStatus('capturing') // Switch to capturing state
          // Close the window when countdown reaches zero
          setTimeout(() => {
            window.close()
          }, 1500) // Close after 1.5s to allow visual feedback
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(interval)
      cleanup?.()
    }
  }, [])

  const handleSkip = () => {
    window.api.screenshotSkip()
  }

  return (
    <div className="h-screen w-screen overflow-hidden select-none">
      <div
        className="h-full w-full bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/10 flex flex-col p-8"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary/20 rounded-xl border border-primary/30 shadow-lg shadow-primary/10">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Screenshot Incoming</h2>
            <p className="text-sm text-muted-foreground">Preparing to capture your screen...</p>
          </div>
        </div>

        {/* Countdown Display */}
        <div className="flex-1 flex items-center justify-center">
          {status === 'countdown' ? (
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 blur-3xl bg-primary/30 animate-pulse" />
              {/* Countdown number */}
              <div className="relative text-8xl font-black text-primary tabular-nums tracking-tighter drop-shadow-2xl">
                {countdown}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 blur-2xl bg-primary/40 animate-pulse" />
                <Camera className="relative h-16 w-16 text-primary animate-pulse" />
              </div>
              <p className="text-xl font-semibold text-primary tracking-wide">Capturing...</p>
            </div>
          )}
        </div>

        {/* Skip Button */}
        <div style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={handleSkip}
            className="w-full flex items-center text-red-950 justify-center gap-3 px-5 py-3 bg-destructive/20 hover:bg-destructive/30 border-2 border-destructive/40 hover:border-destructive/60 rounded-xl text-sm font-semibold text-destructive-foreground transition-all duration-200 shadow-lg shadow-destructive/10 hover:shadow-destructive/20"
          >
            <X className="h-4 w-4" />
            Skip This Screenshot
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScreenshotCountdownPage
