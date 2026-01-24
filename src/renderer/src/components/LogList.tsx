// src/renderer/src/components/LogList.tsx

import React from 'react'
import { Project, Log } from '../../../shared/types'
import LogEntry from './LogEntry'

interface LogListProps {
  logs: Log[]
  projects: Project[]
  onEditLog: (log: Log) => void
  onDeleteLog: (logId: string) => void
}

const LogList: React.FC<LogListProps> = ({ logs, projects, onEditLog, onDeleteLog }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No time logs found.</p>
          <p className="text-sm text-muted-foreground">
            Start tracking time to see your logs here.
          </p>
        </div>
      </div>
    )
  }

  // Helper to get project name by ID
  const getProjectName = (projectId: string): string => {
    const project = projects.find((p) => p.id === projectId)
    return project ? project.name : 'Unknown Project'
  }

  // Sort logs by start time, most recent first
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full bg-card">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Project
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Start Time
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              End Time
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Duration
            </th>
            <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </th>
            <th className="py-3 px-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
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
  )
}

export default LogList
