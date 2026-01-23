// src/renderer/src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react';
import ProjectList from '../components/ProjectList';
import CreateProjectForm from '../components/CreateProjectForm';
import LogEntryForm from '../components/LogEntryForm';
import LogList from '../components/LogList';
import { useProjectStore } from '../store/useProjectStore';
import { useTimerStore } from '../store/useTimerStore';
import type { Project, Log, LogIPC } from '../../../shared/types';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { calculateEarnings } from '../lib/utils';
import { Plus, Play, Pause, Square, RotateCcw, Clock } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const {
    projects,
    currentProject,
    fetchProjects,
    selectProject,
    deleteProject,
    addProject,
    updateProject,
  } = useProjectStore();

  const { timerState, loadTimerState, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimerStore();

  // Fetch projects and timer state on mount
  useEffect(() => {
    fetchProjects();
    loadTimerState();
  }, [fetchProjects, loadTimerState]);

  // State for managing the form visibility (for adding/editing projects and logs)
  const [isProjectFormVisible, setIsProjectFormVisible] = useState(false);
  const [isLogFormVisible, setIsLogFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingLog, setEditingLog] = useState<Log | null>(null);
  const [logsForProject, setLogsForProject] = useState<Log[]>([]);

  // Handlers for Project actions
  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    // Potentially fetch logs for the selected project here
    fetchLogsForProject(projectId);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(projectId);
      if (currentProject?.id === projectId) {
        selectProject(''); // Clear selection if the current project is deleted
      }
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsProjectFormVisible(true);
  };

  const handleProjectFormSubmit = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
      setEditingProject(null);
    } else {
      await addProject(projectData);
    }
    setIsProjectFormVisible(false);
  };

  const handleCloseProjectForm = () => {
    setEditingProject(null);
    setIsProjectFormVisible(false);
  };

  // Handlers for Log actions
  const handleLogTime = () => {
    if (!currentProject) {
      alert('Please select a project first to log time.');
      return;
    }
    setIsLogFormVisible(true);
  };

  const fetchLogsForProject = async (projectId: string) => {
    try {
      const response = await window.api.getLogsByProject(projectId);
      if (response.success && response.data) {
        const parsedLogs = response.data.map(log => ({ ...log, startTime: new Date(log.startTime), endTime: log.endTime ? new Date(log.endTime) : null }));
        setLogsForProject(parsedLogs);
      } else {
        console.error("Failed to fetch logs:", response.error);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const handleSubmitLog = async (logData: Omit<LogIPC, 'id'>) => {
    await window.api.saveLog(logData);
    // Refresh logs after saving
    if (currentProject?.id) {
      fetchLogsForProject(currentProject.id);
    }
    setIsLogFormVisible(false);
  };

  const handleDeleteLog = async (logId: string) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      await window.api.deleteLog(logId);
      // Refresh logs after deleting
      if (currentProject?.id) {
        fetchLogsForProject(currentProject.id);
      }
    }
  };

  const handleEditLog = (log: Log) => {
    setEditingLog(log);
    setIsLogFormVisible(true);
  };

  const handleCloseLogForm = () => {
    setEditingLog(null);
    setIsLogFormVisible(false);
  };

  // Timer controls
  const handleStartTimer = () => {
    if (currentProject) {
      startTimer(currentProject.id, currentProject.name); // Pass project ID and name
    } else {
      alert('Please select a project to start the timer.');
    }
  };

  const handlePauseTimer = () => {
    pauseTimer();
  };

  const handleResumeTimer = () => {
    resumeTimer();
  };

  const handleStopTimer = () => {
    stopTimer();
    // After stopping, refresh logs if a project was active
    if (currentProject?.id) {
      fetchLogsForProject(currentProject.id);
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent w-fit">Dashboard</h1>
        <p className="text-muted-foreground">Manage your projects and track your time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Timer Widget Card - Prominent */}
        <Card className="col-span-full bg-gradient-to-br from-card/80 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Active Session</CardTitle>
              <CardDescription className="text-base">
                {currentProject ? `Tracking: ${currentProject.name}` : 'Select a project to start'}
              </CardDescription>
            </div>
            {currentProject && (
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {calculateEarnings(timerState.elapsedSeconds, currentProject.hourlyRate).toFixed(2)} {currentProject.currency}
                </div>
                <div className="text-xs text-muted-foreground">Current Earnings</div>
              </div>
            )}
          </CardHeader>
          <CardContent>
             <div className="flex flex-col items-center justify-center space-y-6 py-4">
                <div className="text-5xl font-mono font-bold text-foreground tabular-nums">
                  {Math.floor(timerState.elapsedSeconds / 3600).toString().padStart(2, '0')}:
                  {Math.floor((timerState.elapsedSeconds % 3600) / 60).toString().padStart(2, '0')}:
                  {(timerState.elapsedSeconds % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex space-x-4">
                  {!timerState.isRunning ? (
                    <Button size="lg" className="w-32" onClick={handleStartTimer} disabled={!currentProject}>
                      <Play className="mr-2 h-4 w-4" /> Start
                    </Button>
                  ) : (
                    <Button size="lg" variant="secondary" className="w-32" onClick={handlePauseTimer}>
                      <Pause className="mr-2 h-4 w-4" /> Pause
                    </Button>
                  )}
                  {timerState.isRunning && (
                    <Button size="lg" variant="destructive" onClick={handleStopTimer}>
                      <Square className="mr-2 h-4 w-4" /> Stop
                    </Button>
                  )}
                   {!timerState.isRunning && timerState.projectId && (
                    <Button size="lg" variant="outline" onClick={handleResumeTimer}>
                      <RotateCcw className="mr-2 h-4 w-4" /> Resume
                    </Button>
                  )}
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Projects Card */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Projects</CardTitle>
            <Button size="sm" onClick={() => setIsProjectFormVisible(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </CardHeader>
          <CardContent>
             {isProjectFormVisible && (
              <div className="mb-6 p-4 border rounded-md bg-accent/20">
                <CreateProjectForm
                  onSubmit={handleProjectFormSubmit}
                  initialData={editingProject}
                  onClose={handleCloseProjectForm}
                />
              </div>
            )}
            <ProjectList
              projects={projects}
              onSelectProject={handleSelectProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
            />
          </CardContent>
        </Card>

        {/* Recent Logs Card */}
        <Card className="col-span-1 h-full">
           <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Logs</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleLogTime} disabled={!currentProject} title="Log Manual Time">
               <Clock className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
             {isLogFormVisible && (
              <div className="mb-4 p-4 border rounded-md bg-accent/20">
                <LogEntryForm
                  onSubmitLog={handleSubmitLog}
                  initialData={editingLog ? {
                    ...editingLog,
                    startTime: editingLog.startTime instanceof Date ? editingLog.startTime.toISOString() : String(editingLog.startTime),
                    endTime: editingLog.endTime ? (editingLog.endTime instanceof Date ? editingLog.endTime.toISOString() : String(editingLog.endTime)) : null,
                  } : undefined}
                  projectId={currentProject?.id}
                  onClose={handleCloseLogForm}
                />
              </div>
            )}
            <LogList
              logs={logsForProject}
              projects={projects}
              onEditLog={handleEditLog}
              onDeleteLog={handleDeleteLog}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
