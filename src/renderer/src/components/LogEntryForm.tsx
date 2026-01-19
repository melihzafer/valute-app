// src/renderer/src/components/LogEntryForm.tsx

import React, { useState, useEffect } from 'react';
import { useTimerStore } from '../store/useTimerStore';
import { useProjectStore } from '../store/useProjectStore';
import type { LogIPC } from '../../../shared/types';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { calculateEarnings } from '../lib/utils';

interface LogEntryFormProps {
  onSubmitLog: (logData: Omit<LogIPC, 'id'>) => Promise<void>;
  initialData?: Partial<LogIPC>;
  projectId?: string;
  onClose?: () => void;
}

const LogEntryForm: React.FC<LogEntryFormProps> = ({
  onSubmitLog,
  initialData,
  projectId,
  onClose,
}) => {
  const { timerState } = useTimerStore();
  const { projects } = useProjectStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || '');
  const [startTime, setStartTime] = useState<Date>(() => {
    if (initialData?.startTime) {
      return typeof initialData.startTime === 'string' ? new Date(initialData.startTime) : initialData.startTime;
    }
    return new Date();
  });
  const [endTime, setEndTime] = useState<Date | null>(() => {
    if (initialData?.endTime) {
      return typeof initialData.endTime === 'string' ? new Date(initialData.endTime) : initialData.endTime;
    }
    return null;
  });
  const [accumulatedTime, setAccumulatedTime] = useState<number>(initialData?.accumulatedTime || 0);
  const [description, setDescription] = useState<string>(initialData?.description || '');
  const [error, setError] = useState<string | null>(null);

  const projectForForm = projects.find(p => p.id === selectedProjectId);

  // If a project is selected, set the initial state from timer if available
  useEffect(() => {
    if (selectedProjectId && timerState.isRunning && timerState.projectId === selectedProjectId) {
      setStartTime(new Date(timerState.startTime!));
      setAccumulatedTime(timerState.accumulatedTime);
      setDescription(timerState.description || '');
    } else if (initialData) {
      const start = typeof initialData.startTime === 'string' ? new Date(initialData.startTime) : initialData.startTime;
      const end = initialData.endTime ? (typeof initialData.endTime === 'string' ? new Date(initialData.endTime) : initialData.endTime) : null;
      if (start) setStartTime(start);
      setEndTime(end);
      setAccumulatedTime(initialData.accumulatedTime || 0);
      setDescription(initialData.description || '');
    }
  }, [selectedProjectId, timerState, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedProjectId) {
      setError('Please select a project.');
      return;
    }

    // Calculate accumulatedTime if endTime is set, otherwise use current timer's accumulatedTime
    let finalAccumulatedTime = accumulatedTime;
    if (endTime) {
      const startTimestamp = startTime.getTime();
      const endTimestamp = endTime.getTime();
      finalAccumulatedTime = Math.floor((endTimestamp - startTimestamp) / 1000); // in seconds
    } else if (timerState.isRunning && timerState.projectId === selectedProjectId) {
      // If timer is running for this project, use its current elapsed time
      finalAccumulatedTime = timerState.elapsedSeconds; // From timer hook
    }

    const logData: Omit<LogIPC, 'id'> = {
      projectId: selectedProjectId,
      startTime: startTime.toISOString(),
      endTime: endTime ? endTime.toISOString() : null,
      accumulatedTime: finalAccumulatedTime,
      description,
    };

    try {
      await onSubmitLog(logData);
      onClose?.(); // Close form after successful submission
    } catch (err: any) {
      if (err.errors) {
        setError(`Validation failed: ${err.errors.map((e: any) => e.message).join(', ')}`);
      } else {
        setError(err.message || 'Failed to save log. Please check the details.');
      }
    }
  };

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    setSelectedProjectId(newProjectId);
    // If timer is running for a different project, maybe prompt to stop/save it first?
    // For now, we just switch the selected project for the form.
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = new Date(e.target.value);
    setStartTime(newStartTime);
    // Recalculate accumulated time if endTime is already set
    if (endTime && endTime > newStartTime) {
      const newAccumulatedTime = Math.floor((endTime.getTime() - newStartTime.getTime()) / 1000);
      setAccumulatedTime(newAccumulatedTime);
    } else {
      // If endTime is not set or is before newStartTime, reset accumulatedTime
      setAccumulatedTime(0);
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndTime = e.target.value ? new Date(e.target.value) : null;
    setEndTime(newEndTime);
    if (newEndTime && newEndTime > startTime) {
      const newAccumulatedTime = Math.floor((newEndTime.getTime() - startTime.getTime()) / 1000);
      setAccumulatedTime(newAccumulatedTime);
    } else {
      // If endTime is invalid or not set, reset accumulatedTime
      setAccumulatedTime(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">{initialData ? 'Edit Log Entry' : 'Log Time Entry'}</h2>
      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700">Project</label>
          <Select
            id="projectSelect"
            value={selectedProjectId}
            onChange={handleProjectChange}
            required
            disabled={!!initialData} // Disable if editing an existing log
          >
            <option value="" disabled>Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime.toISOString().slice(0, 16)} // Format for datetime-local input
              onChange={handleStartTimeChange}
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime ? endTime.toISOString().slice(0, 16) : ''}
              onChange={handleEndTimeChange}
              min={startTime.toISOString().slice(0, 16)} // End time must be after start time
            />
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: Task details..."
            rows={3}
          />
        </div>

        <div className="col-span-1 md:col-span-2 text-sm text-gray-600">
          Current Time Entry Duration: {Math.floor(accumulatedTime / 60)}m {accumulatedTime % 60}s
        </div>

        {projectForForm && (
          <div className="col-span-1 md:col-span-2 text-lg font-medium text-gray-900">
            Estimated Earnings: {calculateEarnings(accumulatedTime, projectForForm.hourlyRate).toFixed(2)} {projectForForm.currency}
          </div>
        )}
      </div>

      <div className="flex space-x-4 pt-4 border-t border-gray-200">
        <Button type="submit">{initialData ? 'Update Log' : 'Save Log Entry'}</Button>
        {onClose && <Button variant="outline" onClick={onClose}>Cancel</Button>}
      </div>
    </form>
  );
};

export default LogEntryForm;
