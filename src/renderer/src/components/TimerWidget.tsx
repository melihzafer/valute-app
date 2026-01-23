// src/renderer/src/components/TimerWidget.tsx

import React from 'react';
import { Play, Pause, Square, Timer } from 'lucide-react';
import type { TimerState } from '../../../shared/types';
import { calculateEarnings, formatCurrency } from '../lib/utils';
import { useProjectStore } from '../store/useProjectStore';
import { UnitCounter } from './UnitCounter';
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
  const { projects } = useProjectStore();

  // Find the active project to check its pricing model
  const activeProject = projects.find(p => p.id === timerState.projectId);

  const currentEarnings = calculateEarnings(timerState.elapsedSeconds, hourlyRate);

  if (!timerState.projectId && !timerState.isRunning) {
    return null; // Don't show widget if no timer is active
  }

  // If the active project is UNIT_BASED, render the UnitCounter instead
  if (activeProject?.pricingModel === 'UNIT_BASED') {
    return (
      <UnitCounter
        projectId={activeProject.id}
        rate={activeProject.hourlyRate} // This is price per unit for UNIT_BASED
        unitName={activeProject.unitName || 'Unit'}
        currency={activeProject.currency}
        onClose={onStop}
      />
    );
  }

  // Otherwise, render the traditional timer for HOURLY projects
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Status Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Timer className={`h-5 w-5 ${timerState.isRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium text-foreground">
              {timerState.isRunning ? 'Running' : 'Paused'}
            </span>
          </div>
          {timerState.currentProjectName && (
            <span className="text-xs text-muted-foreground max-w-32 truncate">
              {timerState.currentProjectName}
            </span>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-foreground tabular-nums">
            {formatTime(timerState.elapsedSeconds)}
          </div>
          {hourlyRate > 0 && (
            <div className="text-lg font-semibold text-primary mt-2">
              {formatCurrency(currentEarnings, currency)}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-2">
          {timerState.isRunning ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPause}
              className="hover:bg-accent"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResume}
              className="hover:bg-accent"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onStop}
            className="text-destructive hover:bg-destructive/10"
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TimerWidget;
