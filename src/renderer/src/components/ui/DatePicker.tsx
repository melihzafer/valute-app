// src/renderer/src/components/ui/DatePicker.tsx

import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'
import { Calendar } from './Calendar'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  disabledDates?: (date: Date) => boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  disabledDates,
  className
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal h-12 border-b-2 border-t-0 border-x-0 rounded-none bg-background hover:bg-accent/50 transition-colors',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
