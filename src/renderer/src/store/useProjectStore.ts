// src/renderer/src/store/useProjectStore.ts

import { create } from 'zustand';
import type { Project } from '../../../shared/types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  selectProject: (projectId: string) => void;
  addProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, projectData: Partial<Omit<Project, 'createdAt'>>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.getProjects();
      if (response.success && response.data) {
        // Ensure dates are parsed correctly if they come as strings from backend
        const parsedProjects = response.data.map(p => ({ ...p, createdAt: new Date(p.createdAt) }));
        set({ projects: parsedProjects, isLoading: false });
      } else {
        set({ error: response.error || 'Failed to fetch projects', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  selectProject: (projectId: string) => {
    const project = get().projects.find(p => p.id === projectId);
    set({ currentProject: project || null });
  },

  addProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔵 Store: Calling window.api.createProject with:', projectData);
      const response = await window.api.createProject(projectData);
      console.log('🔵 Store: API response:', response);

      if (response.success && response.data) {
        const newProject = { ...response.data, createdAt: new Date(response.data.createdAt) };
        console.log('✅ Store: Adding project to state:', newProject);
        set(state => ({ projects: [...state.projects, newProject], isLoading: false }));
        console.log('✅ Store: Project added successfully');
      } else {
        console.error('❌ Store: API returned error:', response.error);
        set({ error: response.error || 'Failed to add project', isLoading: false });
        throw new Error(response.error || 'Failed to add project');
      }
    } catch (error: any) {
      console.error('❌ Store: Exception caught:', error);
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.updateProject(id, projectData);
      if (response.success && response.data) {
        const updatedProject = { ...response.data, createdAt: new Date(response.data.createdAt) };
        set(state => ({
          projects: state.projects.map(p => (p.id === id ? updatedProject : p)),
          currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
          isLoading: false,
        }));
      } else {
        set({ error: response.error || 'Failed to update project', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.api.deleteProject(id);
      if (response.success) {
        set(state => {
          const updatedProjects = state.projects.filter(p => p.id !== id);
          return {
            projects: updatedProjects,
            currentProject: state.currentProject?.id === id ? null : state.currentProject,
            isLoading: false,
          };
        });
      } else {
        set({ error: response.error || 'Failed to delete project', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'An unexpected error occurred', isLoading: false });
    }
  },
}));
