// src/renderer/src/components/TimerWidget.tsx

import React from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';
import type { TimerState } from '../../../shared/types';
import { calculateEarnings, formatCurrency } from '../lib/utils';
import { Button } from './ui/Button';

interface TimerWidgetProps {
  timerState: TimerState;
  hourlyRate?: number;
  currency?: string;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const paddedHours = String(hours).padStart(2, '0');
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
};

const TimerWidget: React.FC<TimerWidgetProps> = ({
  timerState,
  hourlyRate = 0,
  currency = 'USD',
  onPause,
  onResume,
  onStop,
}) => {
  const currentEarnings = calculateEarnings(timerState.elapsedSeconds, hourlyRate);

  if (!timerState.projectId && !timerState.isRunning) {
    return null; // Don't show widget if no timer is active
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-gray-800 text-white rounded-lg shadow-lg flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Timer className={`h-6 w-6 ${timerState.isRunning ? 'text-green-400 animate-pulse' : 'text-yellow-400'}`} />
        <span className="font-semibold text-sm">
          {timerState.isRunning ? 'Running' : 'Paused'}
        </span>
      </div>

      <div className="text-2xl font-mono font-bold">
        {formatTime(timerState.elapsedSeconds)}
      </div>

      {hourlyRate > 0 && (
        <div className="text-lg font-semibold text-green-400">
          {formatCurrency(currentEarnings, currency)}
        </div>
      )}

      {timerState.currentProjectName && (
        <div className="text-sm text-gray-300 max-w-32 truncate">
          {timerState.currentProjectName}
        </div>
      )}

      <div className="flex items-center space-x-2 ml-2">
        {timerState.isRunning ? (
          <Button variant="ghost" size="sm" onClick={onPause} className="text-yellow-400 hover:text-yellow-300">
            <Pause className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={onResume} className="text-green-400 hover:text-green-300">
            <Play className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onStop} className="text-red-400 hover:text-red-300">
          <Square className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default TimerWidget;
