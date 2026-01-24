// src/renderer/src/components/LogEntryForm.tsx

import React, { useState, useEffect } from 'react'
import { useTimerStore } from '../store/useTimerStore'
import { useProjectStore } from '../store/useProjectStore'
import type { LogIPC } from '../../../shared/types'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Textarea } from './ui/Textarea'
import { DatePicker } from './ui/DatePicker'
import { TimePicker } from './ui/TimePicker'
import { calculateEarnings } from '../lib/utils'

interface LogEntryFormProps {
  onSubmitLog: (logData: Omit<LogIPC, 'id'>) => Promise<void>
  initialData?: Partial<LogIPC>
  projectId?: string
  onClose?: () => void
}

const LogEntryForm: React.FC<LogEntryFormProps> = ({
  onSubmitLog,
  initialData,
  projectId,
  onClose
}) => {
  const { timerState } = useTimerStore()
  const { projects } = useProjectStore()

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '')
  const [startTime, setStartTime] = useState<Date>(() => {
    if (initialData?.startTime) {
      return typeof initialData.startTime === 'string'
        ? new Date(initialData.startTime)
        : initialData.startTime
    }
    return new Date()
  })
  const [endTime, setEndTime] = useState<Date | null>(() => {
    if (initialData?.endTime) {
      return typeof initialData.endTime === 'string'
        ? new Date(initialData.endTime)
        : initialData.endTime
    }
    return null
  })
  const [accumulatedTime, setAccumulatedTime] = useState<number>(initialData?.accumulatedTime || 0)
  const [description, setDescription] = useState<string>(initialData?.description || '')
  const [error, setError] = useState<string | null>(null)

  const projectForForm = projects.find((p) => p.id === selectedProjectId)

  // If a project is selected, set the initial state from timer if available
  useEffect(() => {
    if (selectedProjectId && timerState.isRunning && timerState.projectId === selectedProjectId) {
      setStartTime(new Date(timerState.startTime!))
      setAccumulatedTime(timerState.accumulatedTime)
      setDescription(timerState.description || '')
    } else if (initialData) {
      const start =
        typeof initialData.startTime === 'string'
          ? new Date(initialData.startTime)
          : initialData.startTime
      const end = initialData.endTime
        ? typeof initialData.endTime === 'string'
          ? new Date(initialData.endTime)
          : initialData.endTime
        : null
      if (start) setStartTime(start)
      setEndTime(end)
      setAccumulatedTime(initialData.accumulatedTime || 0)
      setDescription(initialData.description || '')
    }
  }, [selectedProjectId, timerState, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedProjectId) {
      setError('Please select a project.')
      return
    }

    if (endTime && endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    // Calculate accumulatedTime if endTime is set, otherwise use current timer's accumulatedTime
    let finalAccumulatedTime = accumulatedTime
    if (endTime) {
      const startTimestamp = startTime.getTime()
      const endTimestamp = endTime.getTime()
      finalAccumulatedTime = Math.floor((endTimestamp - startTimestamp) / 1000) // in seconds
    } else if (timerState.isRunning && timerState.projectId === selectedProjectId) {
      // If timer is running for this project, use its current elapsed time
      finalAccumulatedTime = timerState.elapsedSeconds // From timer hook
    }

    const logData: Omit<LogIPC, 'id'> = {
      projectId: selectedProjectId,
      startTime: startTime.toISOString(),
      endTime: endTime ? endTime.toISOString() : null,
      accumulatedTime: finalAccumulatedTime,
      description
    }

    try {
      await onSubmitLog(logData)
      onClose?.() // Close form after successful submission
    } catch (err: any) {
      if (err.errors) {
        setError(`Validation failed: ${err.errors.map((e: any) => e.message).join(', ')}`)
      } else {
        setError(err.message || 'Failed to save log. Please check the details.')
      }
    }
  }

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value
    setSelectedProjectId(newProjectId)
    // If timer is running for a different project, maybe prompt to stop/save it first?
    // For now, we just switch the selected project for the form.
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 p-6 bg-card border border-border/50 rounded-xl shadow-lg"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {initialData ? 'Edit Log Entry' : 'Log Time Entry'}
        </h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="projectSelect" className="block text-sm font-medium text-foreground mb-2">
            Project
          </label>
          <Select
            id="projectSelect"
            value={selectedProjectId}
            onChange={handleProjectChange}
            required
            disabled={!!initialData}
            className="w-full bg-background border-border text-foreground"
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
              <DatePicker
                value={startTime}
                onChange={(date) => {
                  if (date) {
                    const newStart = new Date(date)
                    // Preserve existing time
                    newStart.setHours(startTime.getHours())
                    newStart.setMinutes(startTime.getMinutes())
                    setStartTime(newStart)
                    // Recalculate duration if endTime is set
                    if (endTime && endTime > newStart) {
                      const newAccumulatedTime = Math.floor(
                        (endTime.getTime() - newStart.getTime()) / 1000
                      )
                      setAccumulatedTime(newAccumulatedTime)
                    }
                  }
                }}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Time</label>
              <TimePicker
                value={startTime}
                onChange={(newTime) => {
                  setStartTime(newTime)
                  // Recalculate duration if endTime is set
                  if (endTime && newTime < endTime) {
                    const duration = Math.floor((endTime.getTime() - newTime.getTime()) / 1000)
                    setAccumulatedTime(duration)
                  } else if (endTime) {
                    setAccumulatedTime(0)
                  }
                }}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
              <DatePicker
                value={endTime || undefined}
                onChange={(date) => {
                  if (date) {
                    const newEnd = new Date(date)
                    // Preserve existing time if endTime was already set
                    if (endTime) {
                      newEnd.setHours(endTime.getHours())
                      newEnd.setMinutes(endTime.getMinutes())
                    } else {
                      // Default to current time if setting end date for first time
                      const now = new Date()
                      newEnd.setHours(now.getHours())
                      newEnd.setMinutes(now.getMinutes())
                    }
                    setEndTime(newEnd)
                    // Recalculate duration
                    if (newEnd > startTime) {
                      const duration = Math.floor((newEnd.getTime() - startTime.getTime()) / 1000)
                      setAccumulatedTime(duration)
                    }
                  } else {
                    setEndTime(null)
                    setAccumulatedTime(0)
                  }
                }}
                placeholder="Optional"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">End Time</label>
              <TimePicker
                value={endTime || undefined}
                onChange={(newTime) => {
                  setEndTime(newTime)
                  if (newTime && startTime && newTime > startTime) {
                    const duration = Math.floor((newTime.getTime() - startTime.getTime()) / 1000)
                    setAccumulatedTime(duration)
                  } else {
                    setAccumulatedTime(0)
                  }
                }}
                disabled={!endTime}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: Task details..."
            rows={3}
            className="w-full bg-background border-border text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            Duration:{' '}
            <span className="font-medium text-foreground">
              {Math.floor(accumulatedTime / 60)}m {accumulatedTime % 60}s
            </span>
          </div>
          {projectForForm && (
            <div className="text-sm">
              Earnings:{' '}
              <span className="font-medium text-primary">
                {calculateEarnings(accumulatedTime, projectForForm.hourlyRate).toFixed(2)}{' '}
                {projectForForm.currency}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button type="submit">{initialData ? 'Update Log' : 'Save Log Entry'}</Button>
      </div>
    </form>
  )
}

export default LogEntryForm
