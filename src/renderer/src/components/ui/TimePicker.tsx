// src/renderer/src/components/ui/TimePicker.tsx

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Input } from './Input'

interface TimePickerProps {
  value?: Date
  onChange: (date: Date) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({ value, onChange, disabled = false, className }: TimePickerProps) {
  const hours = value ? value.getHours() : 0
  const minutes = value ? value.getMinutes() : 0

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = parseInt(e.target.value, 10)
    if (isNaN(newHours) || newHours < 0 || newHours > 23) return

    const newDate = value ? new Date(value) : new Date()
    newDate.setHours(newHours)
    onChange(newDate)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = parseInt(e.target.value, 10)
    if (isNaN(newMinutes) || newMinutes < 0 || newMinutes > 59) return

    const newDate = value ? new Date(value) : new Date()
    newDate.setMinutes(newMinutes)
    onChange(newDate)
  }

  const handleHoursBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newHours = parseInt(e.target.value, 10)
    if (isNaN(newHours)) {
      e.target.value = hours.toString().padStart(2, '0')
    }
  }

  const handleMinutesBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newMinutes = parseInt(e.target.value, 10)
    if (isNaN(newMinutes)) {
      e.target.value = minutes.toString().padStart(2, '0')
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex items-center flex-1">
        <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <div className="flex items-center w-full pl-9 h-12 border-b-2 border-border bg-background">
          <Input
            type="number"
            min="0"
            max="23"
            value={hours.toString().padStart(2, '0')}
            onChange={handleHoursChange}
            onBlur={handleHoursBlur}
            disabled={disabled}
            className="w-12 h-8 text-center p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Hours"
          />
          <span className="text-foreground font-medium mx-1">:</span>
          <Input
            type="number"
            min="0"
            max="59"
            value={minutes.toString().padStart(2, '0')}
            onChange={handleMinutesChange}
            onBlur={handleMinutesBlur}
            disabled={disabled}
            className="w-12 h-8 text-center p-0 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Minutes"
          />
        </div>
      </div>
    </div>
  )
}
