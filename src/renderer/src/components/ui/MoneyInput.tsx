// src/renderer/src/components/ui/MoneyInput.tsx
// Currency input that preserves user-typed formatting (e.g. "15.50" stays "15.50").
// Stores the displayed value as a string internally, exposes a number to the parent.

import React, { useEffect, useState } from 'react'
import { Input } from './Input'

interface MoneyInputProps {
  id?: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  min?: number
  className?: string
}

const ALLOWED = /^\d*\.?\d{0,2}$/

const formatForExternal = (n: number): string => {
  if (!n || Number.isNaN(n)) return ''
  return n.toString()
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  min = 0,
  className
}) => {
  const [display, setDisplay] = useState<string>(formatForExternal(value))

  useEffect(() => {
    setDisplay(formatForExternal(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '' || ALLOWED.test(raw)) {
      setDisplay(raw)
      const parsed = raw === '' ? 0 : parseFloat(raw)
      onChange(Number.isFinite(parsed) ? parsed : 0)
    }
  }

  const cents = Math.round((parseFloat(display) || 0) * 100)
  const showPreview = display !== '' && (parseFloat(display) || 0) > 0

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={className}
      />
      {showPreview && (
        <p className="text-xs text-muted-foreground">
          = {cents.toLocaleString()} cents {min >= 0 ? '' : '(can be negative)'}
        </p>
      )}
    </div>
  )
}

export default MoneyInput
