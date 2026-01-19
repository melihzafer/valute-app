// src/renderer/src/pages/ProjectsPage.tsx

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import ProjectList from '../components/ProjectList';
import type { Project } from '../../../shared/types';
import { CreateProjectModal } from '../components/CreateProjectForm'; // Import the modal wrapper
import { EditProjectModal } from '../components/EditProjectForm'; // Import the edit modal wrapper

const ProjectsPage: React.FC = () => {
  const {
    projects,
    currentProject,
    fetchProjects,
    selectProject,
    deleteProject,
    addProject,
    updateProject,
  } = useProjectStore();

  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    // Optionally navigate to dashboard or timer view
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(projectId);
      if (currentProject?.id === projectId) {
        selectProject(''); // Clear selection if the current project is deleted
      }
    }
  };

  const handleProjectSubmit = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData);
    } else {
      await addProject(projectData);
    }
    setEditingProject(null);
  };

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <CreateProjectModal onSubmit={handleProjectSubmit} />
      </div>

      <ProjectList
        projects={projects}
        onSelectProject={handleSelectProject}
        onEditProject={handleOpenEditModal} // Pass the handler to open the edit modal
        onDeleteProject={handleDeleteProject}
      />

      {/* Edit Project Modal (conditionally rendered based on editingProject state) */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onSubmit={handleProjectSubmit}
          // No onClose prop needed here as the modal handles its own closing
        />
      )}
    </div>
  );
};

export default ProjectsPage;
