// src/renderer/src/components/ProjectList.tsx

import React from 'react'
import { FolderKanban } from 'lucide-react'
import { Project } from '../../../shared/types'
import ProjectCard from './ProjectCard'
import { EmptyState } from './ui/EmptyState'

interface ProjectListProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
  onCreateProject: () => void
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onEditProject,
  onDeleteProject,
  onCreateProject
}) => {
  if (!projects || projects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects found"
        description="Create your first project to start tracking time, logs, and invoicing."
        actionLabel="Create Project"
        onActionClick={onCreateProject}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onSelectProject={onSelectProject}
          onEditProject={onEditProject}
          onDeleteProject={onDeleteProject}
        />
      ))}
    </div>
  )
}

export default ProjectList
