// src/main/handlers.ts

import { ipcMain, dialog, shell } from 'electron';
import * as fs from 'fs';
import { ProjectSchema, ProjectSchemaBase, LogSchema } from '../shared/schemas';
import type { ProjectIPC, LogIPC, InvoiceIPC, IPCResponse, TimerState } from '../shared/types';
import { getProjects, createProject, updateProject, deleteProject, getLogsByProject, saveLog, deleteLog, getLogsByDateRange, saveInvoice } from './services/ProjectService';

// Timer state stored in memory (could be persisted if needed)
let timerState: TimerState = {
  isRunning: false,
  elapsedSeconds: 0,
  accumulatedTime: 0,
  startTime: null,
  projectId: null,
  description: null,
  currentProjectName: null,
};

export function setupIpcHandlers() {
  // --- Project Handlers ---

  ipcMain.handle('get-projects', async (): Promise<IPCResponse<ProjectIPC[]>> => {
    try {
      const projects = await getProjects();
      const processedProjects: ProjectIPC[] = projects.map(p => ({
        ...p,
        createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      }));
      return { success: true, data: processedProjects };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      console.error('Error in get-projects IPC handler:', error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle('create-project', async (_, projectData: Omit<ProjectIPC, 'id' | 'createdAt'>): Promise<IPCResponse<ProjectIPC>> => {
    try {
      const validatedData = ProjectSchemaBase.omit({ id: true, createdAt: true }).parse(projectData);
      const newProject = await createProject(validatedData);
      const result: ProjectIPC = {
        ...newProject,
        createdAt: newProject.createdAt instanceof Date ? newProject.createdAt.toISOString() : String(newProject.createdAt),
      };
      return { success: true, data: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      console.error('Error in create-project IPC handler:', error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle('update-project', async (_, id: string, projectData: Partial<Omit<ProjectIPC, 'createdAt'>>): Promise<IPCResponse<ProjectIPC>> => {
    try {
      const existingProject = await getProjects().then(projects => projects.find(p => p.id === id));
      if (!existingProject) {
        throw new Error('Project not found.');
      }
      const validatedData = ProjectSchemaBase.omit({ createdAt: true }).partial().parse({ ...existingProject, ...projectData });
      const updatedProject = await updateProject(id, validatedData);
      const result: ProjectIPC = {
        ...updatedProject,
        createdAt: updatedProject.createdAt instanceof Date ? updatedProject.createdAt.toISOString() : String(updatedProject.createdAt),
      };
      return { success: true, data: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      console.error('Error in update-project IPC handler:', error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle('delete-project', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteProject(id);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      console.error('Error in delete-project IPC handler:', error);
      return { success: false, error: message };
    }
  });

  // --- Log Handlers ---

  ipcMain.handle('get-logs-by-project', async (_, projectId: string): Promise<IPCResponse<LogIPC[]>> => {
    try {
      const logs = await getLogsByProject(projectId);
      const processedLogs: LogIPC[] = logs.map(log => ({
        ...log,
        startTime: log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
        endTime: log.endTime ? (log.endTime instanceof Date ? log.endTime.toISOString() : String(log.endTime)) : null,
      }));
      return { success: true, data: processedLogs };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch logs for project';
      console.error('Error in get-logs-by-project IPC handler:', error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle('save-log', async (_, logData: Omit<LogIPC, 'id'>): Promise<IPCResponse<LogIPC>> => {
    try {
      const parsedData = {
        ...logData,
        startTime: new Date(logData.startTime),
        endTime: logData.endTime ? new Date(logData.endTime) : null,
      };
      const validatedData = LogSchema.omit({ id: true }).parse(parsedData);
      const savedLog = await saveLog(validatedData);
      const result: LogIPC = {
        ...savedLog,
        startTime: savedLog.startTime instanceof Date ? savedLog.startTime.toISOString() : String(savedLog.startTime),
        endTime: savedLog.endTime ? (savedLog.endTime instanceof Date ? savedLog.endTime.toISOString() : String(savedLog.endTime)) : null,
      };
      return { success: true, data: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save log';
      console.error('Error in save-log IPC handler:', error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle('delete-log', async (_, id: string): Promise<IPCResponse<void>> => {
    try {
      await deleteLog(id);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete log';
      console.error('Error in delete-log IPC handler:', error);
      return { success: false, error: message };
    }
  });

  // --- Invoice Handlers ---

  ipcMain.handle('get-logs-for-invoice', async (_, startDate: string, endDate: string): Promise<IPCResponse<LogIPC[]>> => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const logs = await getLogsByDateRange(start, end);
      const processedLogs: LogIPC[] = logs.map(log => ({
        ...log,
        startTime: log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
        endTime: log.endTime ? (log.endTime instanceof Date ? log.endTime.toISOString() : String(log.endTime)) : null,
      }));
      return { success: true, data: processedLogs };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch logs for invoice';
      console.error('Error in get-logs-for-invoice IPC handler:', error);
      return { success: false, error: message };
    }
  });

  ipcMain.handle('save-invoice', async (_, invoiceData: Omit<InvoiceIPC, 'id'>, pdfBuffer: ArrayBuffer): Promise<IPCResponse<InvoiceIPC>> => {
    try {
      const parsedInvoiceData = {
        ...invoiceData,
        issueDate: new Date(invoiceData.issueDate),
        dueDate: new Date(invoiceData.dueDate),
        logs: invoiceData.logs.map(log => ({
          ...log,
          startTime: new Date(log.startTime),
          endTime: log.endTime ? new Date(log.endTime) : null,
        })),
      };
      const savedInvoice = await saveInvoice(parsedInvoiceData);

      const result = await dialog.showSaveDialog({
        title: 'Save Invoice',
        defaultPath: `invoice-${savedInvoice.id}-${new Date().toISOString().split('T')[0]}.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });

      if (!result.canceled && result.filePath) {
        fs.writeFileSync(result.filePath, Buffer.from(pdfBuffer));
        console.log(`Invoice PDF successfully saved to: ${result.filePath}`);
      }

      const responseData: InvoiceIPC = {
        ...savedInvoice,
        issueDate: savedInvoice.issueDate instanceof Date ? savedInvoice.issueDate.toISOString() : String(savedInvoice.issueDate),
        dueDate: savedInvoice.dueDate instanceof Date ? savedInvoice.dueDate.toISOString() : String(savedInvoice.dueDate),
        logs: savedInvoice.logs.map(log => ({
          ...log,
          startTime: log.startTime instanceof Date ? log.startTime.toISOString() : String(log.startTime),
          endTime: log.endTime ? (log.endTime instanceof Date ? log.endTime.toISOString() : String(log.endTime)) : null,
        })),
      };
      return { success: true, data: responseData };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save invoice';
      console.error('Error in save-invoice IPC handler:', error);
      return { success: false, error: message };
    }
  });

  // --- Timer Handlers ---

  ipcMain.handle('get-timer-state', async (): Promise<IPCResponse<TimerState>> => {
    return { success: true, data: timerState };
  });

  ipcMain.handle('set-timer-state', async (_, state: TimerState): Promise<IPCResponse<void>> => {
    timerState = state;
    return { success: true };
  });

  ipcMain.handle('start-timer', async (_, projectId: string, description?: string): Promise<IPCResponse<TimerState>> => {
    const projects = await getProjects();
    const project = projects.find(p => p.id === projectId);
    timerState = {
      isRunning: true,
      elapsedSeconds: 0,
      accumulatedTime: 0,
      startTime: Date.now(),
      projectId,
      description: description || null,
      currentProjectName: project?.name || null,
    };
    return { success: true, data: timerState };
  });

  ipcMain.handle('pause-timer', async (): Promise<IPCResponse<TimerState>> => {
    if (timerState.isRunning && timerState.startTime) {
      const elapsed = Math.floor((Date.now() - timerState.startTime) / 1000);
      timerState = {
        ...timerState,
        isRunning: false,
        accumulatedTime: timerState.accumulatedTime + elapsed,
        startTime: null,
      };
    }
    return { success: true, data: timerState };
  });

  ipcMain.handle('resume-timer', async (): Promise<IPCResponse<TimerState>> => {
    if (!timerState.isRunning) {
      timerState = {
        ...timerState,
        isRunning: true,
        startTime: Date.now(),
      };
    }
    return { success: true, data: timerState };
  });

  ipcMain.handle('stop-timer', async (): Promise<IPCResponse<TimerState>> => {
    const finalState = { ...timerState };
    timerState = {
      isRunning: false,
      elapsedSeconds: 0,
      accumulatedTime: 0,
      startTime: null,
      projectId: null,
      description: null,
      currentProjectName: null,
    };
    return { success: true, data: finalState };
  });

  // --- Dialog Handlers ---

  ipcMain.handle('show-save-dialog', async (_, options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }): Promise<string | null> => {
    const result = await dialog.showSaveDialog({
      title: 'Save File',
      defaultPath: options.defaultPath,
      filters: options.filters,
    });
    return result.canceled ? null : result.filePath || null;
  });

  // --- Other Handlers ---

  ipcMain.handle('open-external', async (_, url: string): Promise<IPCResponse<void>> => {
    try {
      await shell.openExternal(url);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to open external link';
      console.error('Error in open-external IPC handler:', error);
      return { success: false, error: message };
    }
  });
}
