// src/renderer/src/components/ProjectList.tsx

import React from 'react'
import { Project } from '../../../shared/types'
import ProjectCard from './ProjectCard'

interface ProjectListProps {
  projects: Project[]
  onSelectProject: (projectId: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onEditProject,
  onDeleteProject
}) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">No projects found.</p>
          <p className="text-sm text-muted-foreground">Create your first project to get started!</p>
        </div>
      </div>
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
