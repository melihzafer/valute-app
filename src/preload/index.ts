import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Projects
  getProjects: () => ipcRenderer.invoke('get-projects'),
  createProject: (data: unknown) => ipcRenderer.invoke('create-project', data),
  updateProject: (id: string, data: unknown) => ipcRenderer.invoke('update-project', id, data),
  deleteProject: (id: string) => ipcRenderer.invoke('delete-project', id),

  // Logs
  getLogsByProject: (projectId: string) => ipcRenderer.invoke('get-logs-by-project', projectId),
  saveLog: (data: unknown) => ipcRenderer.invoke('save-log', data),
  deleteLog: (id: string) => ipcRenderer.invoke('delete-log', id),

  // Invoices
  getLogsForInvoice: (startDate: string, endDate: string) =>
    ipcRenderer.invoke('get-logs-for-invoice', startDate, endDate),
  saveInvoice: (data: unknown, pdfBuffer: ArrayBuffer) =>
    ipcRenderer.invoke('save-invoice', data, pdfBuffer),

  // Timer
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  setTimerState: (state: unknown) => ipcRenderer.invoke('set-timer-state', state),
  startTimer: (projectId: string, description?: string) =>
    ipcRenderer.invoke('start-timer', projectId, description),
  pauseTimer: () => ipcRenderer.invoke('pause-timer'),
  resumeTimer: () => ipcRenderer.invoke('resume-timer'),
  stopTimer: () => ipcRenderer.invoke('stop-timer'),

  // Dialogs
  showSaveDialog: (options: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('show-save-dialog', options),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
