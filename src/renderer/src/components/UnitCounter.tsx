// src/renderer/src/components/UnitCounter.tsx
// Unit-Based Counter Component for Linear-style tracking

import React, { useState } from 'react'
import { Plus, Minus, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface UnitCounterProps {
  projectId: string
  rate: number // Price per unit in cents
  unitName: string // e.g., "Page", "Article", "Video"
  currency: string
  onClose?: () => void
}

export const UnitCounter: React.FC<UnitCounterProps> = ({
  projectId,
  rate,
  unitName,
  currency,
  onClose
}) => {
  const [count, setCount] = useState(1)
  const [isLogging, setIsLogging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total earnings
  const totalEarnings = (count * rate) / 100 // Convert cents to currency units

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount)
  }

  const handleIncrement = () => {
    setCount((prev) => prev + 1)
  }

  const handleDecrement = () => {
    if (count > 0) {
      setCount((prev) => prev - 1)
    }
  }

  const handleLogWork = async () => {
    if (count <= 0) {
      setError('Count must be greater than zero.')
      return
    }

    setIsLogging(true)
    setError(null)

    try {
      const now = new Date()
      const response = await window.api.saveLog({
        projectId,
        startTime: now.toISOString(),
        endTime: now.toISOString(),
        accumulatedTime: 0, // Not applicable for unit-based
        quantity: count,
        description: `Completed ${count} ${unitName}${count > 1 ? 's' : ''}`
      })

      if (response.success) {
        // Success! Reset counter
        setCount(1)
        if (onClose) {
          onClose()
        }
      } else {
        setError(response.error || 'Failed to log work.')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div
      className={twMerge(
        'fixed bottom-6 right-6 w-80',
        'bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl',
        'p-6 space-y-6'
      )}
    >
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-foreground">Unit Tracker</h3>
        <p className="text-sm text-muted-foreground">
          {unitName} • {formatCurrency(rate / 100)} each
        </p>
      </div>

      {/* Counter Display */}
      <div className="flex items-center justify-center gap-4">
        {/* Decrement Button */}
        <button
          onClick={handleDecrement}
          disabled={count <= 0}
          className={clsx(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            count <= 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-accent hover:bg-accent/80 text-foreground active:scale-95'
          )}
        >
          <Minus className="w-5 h-5" />
        </button>

        {/* Count Display */}
        <div className="flex flex-col items-center">
          <div className="text-6xl font-bold text-foreground tabular-nums">{count}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {unitName}
            {count !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Increment Button */}
        <button
          onClick={handleIncrement}
          className={clsx(
            'w-12 h-12 rounded-full flex items-center justify-center',
            'bg-accent hover:bg-accent/80 text-foreground',
            'transition-all duration-200 active:scale-95'
          )}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Earnings Preview */}
      <div className="bg-primary/10 border border-primary/20 rounded-md p-4">
        <div className="text-xs text-primary uppercase tracking-wide mb-1">Total Earnings</div>
        <div className="text-2xl font-bold text-primary">{formatCurrency(totalEarnings)}</div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Log Work Button */}
      <button
        onClick={handleLogWork}
        disabled={isLogging || count <= 0}
        className={clsx(
          'w-full py-3 px-4 rounded-md font-medium',
          'flex items-center justify-center gap-2',
          'transition-all duration-200',
          isLogging || count <= 0
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground active:scale-98'
        )}
      >
        <Check className="w-4 h-4" />
        {isLogging ? 'Logging...' : 'Log Work'}
      </button>
    </div>
  )
}
