// src/renderer/src/components/LogEntry.tsx

import React from 'react';
import { Log } from '../../../shared/types';
import { Edit, Trash } from 'lucide-react';
import { Button } from './ui/Button';

interface LogEntryProps {
  log: Log;
  projectName: string;
  onEdit: (log: Log) => void;
  onDelete: (logId: string) => void;
}

const LogEntry: React.FC<LogEntryProps> = ({ log, projectName, onEdit, onDelete }) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  const startTime = new Date(log.startTime);
  const endTime = log.endTime ? new Date(log.endTime) : null;

  return (
    <tr className="border-b border-border hover:bg-accent/50 transition-colors">
      <td className="py-3 px-4 text-sm text-foreground truncate" title={projectName}>{projectName}</td>
      <td className="py-3 px-4 text-sm text-foreground">{startTime.toLocaleString()}</td>
      <td className="py-3 px-4 text-sm text-foreground">{endTime ? endTime.toLocaleString() : '-'}</td>
      <td className="py-3 px-4 text-sm font-medium text-foreground">{formatDuration(log.accumulatedTime)}</td>
      <td className="py-3 px-4 text-sm text-muted-foreground truncate" title={log.description}>{log.description || '-'}</td>
      <td className="py-3 px-4 text-right space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(log)}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(log.id)} className="text-destructive hover:bg-destructive/10">
          <Trash className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
};

export default LogEntry;
