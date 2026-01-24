// src/renderer/src/pages/ProjectsPage.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore'
import { useTimerStore } from '../store/useTimerStore'
import ProjectList from '../components/ProjectList'
import type { Project } from '../../../shared/types'
import { CreateProjectModal } from '../components/CreateProjectForm'
import EditProjectForm from '../components/EditProjectForm'
import { Dialog } from '../components/ui/Dialog'

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate()

  const {
    projects,
    currentProject,
    fetchProjects,
    selectProject,
    deleteProject,
    addProject,
    updateProject
  } = useProjectStore()

  const { startTimer } = useTimerStore()

  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleSelectProject = async (projectId: string) => {
    selectProject(projectId)

    // Start timer for this project
    try {
      await startTimer(projectId)
      console.log(`Timer started for project: ${projectId}`)
      // Navigate to dashboard to show running timer
      navigate('/')
    } catch (error) {
      console.error('Failed to start timer:', error)
      // Could show a toast notification here
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (
      window.confirm('Are you sure you want to delete this project? This action cannot be undone.')
    ) {
      await deleteProject(projectId)
      if (currentProject?.id === projectId) {
        selectProject('')
      }
    }
  }

  const handleProjectSubmit = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    if (editingProject) {
      await updateProject(editingProject.id, projectData)
      await fetchProjects() // Refresh the list
    } else {
      await addProject(projectData)
    }
    setEditingProject(null)
    setIsEditModalOpen(false)
  }

  const handleOpenEditModal = (project: Project) => {
    setEditingProject(project)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setEditingProject(null)
    setIsEditModalOpen(false)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <CreateProjectModal onSubmit={handleProjectSubmit} />
      </div>

      <ProjectList
        projects={projects}
        onSelectProject={handleSelectProject}
        onEditProject={handleOpenEditModal}
        onDeleteProject={handleDeleteProject}
      />

      {/* Edit Project Modal - Controlled by page state */}
      <Dialog
        trigger={<span style={{ display: 'none' }} />}
        title="Edit Project"
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseEditModal()
        }}
      >
        {editingProject && (
          <EditProjectForm
            projectToEdit={editingProject}
            onSubmit={handleProjectSubmit}
            onClose={handleCloseEditModal}
          />
        )}
      </Dialog>
    </div>
  )
}

export default ProjectsPage
