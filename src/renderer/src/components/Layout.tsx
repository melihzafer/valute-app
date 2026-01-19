// src/renderer/src/components/Layout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TimerWidget from './TimerWidget';
import { useTimerStore } from '../store/useTimerStore';
import { useProjectStore } from '../store/useProjectStore';

const Layout: React.FC = () => {
  const { timerState, pauseTimer, resumeTimer, stopTimer } = useTimerStore();
  const { projects } = useProjectStore();

  // Get current project's hourly rate
  const currentProject = projects.find(p => p.id === timerState.projectId);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
      <TimerWidget
        timerState={timerState}
        hourlyRate={currentProject?.hourlyRate}
        currency={currentProject?.currency}
        onPause={pauseTimer}
        onResume={resumeTimer}
        onStop={stopTimer}
      />
    </div>
  );
};

export default Layout;
