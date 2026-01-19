// src/renderer/src/components/LogList.tsx

import React from 'react';
import { Project, Log } from '../../../shared/types';
import LogEntry from './LogEntry'; // Assuming LogEntry component will be created

interface LogListProps {
  logs: Log[];
  projects: Project[]; // To get project names for display
  onEditLog: (log: Log) => void;
  onDeleteLog: (logId: string) => void;
}

const LogList: React.FC<LogListProps> = ({ logs, projects, onEditLog, onDeleteLog }) => {
  if (!logs || logs.length === 0) {
    return <p className="text-center text-gray-500">No time logs found for this project.</p>;
  }

  // Helper to get project name by ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  // Sort logs by start time, most recent first
  const sortedLogs = [...logs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Project</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Start Time</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">End Time</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Duration</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Description</th>
            <th className="py-3 px-4 text-right text-sm font-medium text-gray-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedLogs.map((log) => (
            <LogEntry
              key={log.id}
              log={log}
              projectName={getProjectName(log.projectId)}
              onEdit={onEditLog}
              onDelete={onDeleteLog}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogList;
