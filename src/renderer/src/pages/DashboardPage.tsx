// src/renderer/src/pages/DashboardPage.tsx

import React, { useEffect, useState } from 'react';
import ProjectList from '../components/ProjectList';
import CreateProjectForm from '../components/CreateProjectForm';
import LogEntryForm from '../components/LogEntryForm';
import LogList from '../components/LogList';
import TimerWidget from '../components/TimerWidget';
import { useProjectStore } from '../store/useProjectStore';
import { useTimerStore } from '../store/useTimerStore';
import type { Project, Log, LogIPC } from '../../../shared/types';
import { Button } from '../components/ui/Button';
import { calculateEarnings } from '../lib/utils';

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
    <div className="p-8 w-full max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">Dashboard</h1>

      {/* Project Selection and Creation */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Projects</h2>
          <Button onClick={() => setIsProjectFormVisible(true)}>
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </Button>
        </div>

        {isProjectFormVisible && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg shadow-inner">
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
      </section>

      {/* Timer Widget and Controls */}
      <section className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            {currentProject ? `Tracking for: ${currentProject.name}` : 'Select a project to start'}
          </h2>
          {currentProject && (
            <p className="text-lg opacity-90">
              Rate: {currentProject.hourlyRate} {currentProject.currency}/hr
            </p>
          )}
        </div>
        <div className="flex flex-col items-center space-y-2">
          <TimerWidget timerState={timerState} />
          <div className="flex space-x-4 mt-4">
            {!timerState.isRunning ? (
              <Button onClick={handleStartTimer} disabled={!currentProject}>Start Timer</Button>
            ) : (
              <Button onClick={handlePauseTimer}>Pause Timer</Button>
            )}
            {timerState.isRunning && (
              <Button variant="outline" onClick={handleStopTimer}>Stop Timer</Button>
            )}
             {!timerState.isRunning && timerState.projectId && (
              <Button variant="outline" onClick={handleResumeTimer}>Resume Timer</Button>
            )}
          </div>
          {currentProject && timerState.isRunning && (
             <p className="mt-2 text-sm opacity-80">Current Earnings: {calculateEarnings(timerState.elapsedSeconds, currentProject.hourlyRate).toFixed(2)} {currentProject.currency}</p>
          )}
        </div>
      </section>

      {/* Log Entry Form and List */}
      <section className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Time Logs</h2>
          <Button onClick={handleLogTime} disabled={!currentProject}>Log Manual Time</Button>
        </div>
        {isLogFormVisible && (
          <div className="mb-6 p-6 bg-gray-50 rounded-lg shadow-inner">
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
      </section>
    </div>
  );
};

export default DashboardPage;
