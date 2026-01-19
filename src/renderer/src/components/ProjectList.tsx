// src/renderer/src/components/ProjectList.tsx

import React from 'react';
import { Project } from '../../../shared/types';
import ProjectCard from './ProjectCard';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onSelectProject,
  onEditProject,
  onDeleteProject,
}) => {
  if (!projects || projects.length === 0) {
    return <p className="text-center text-gray-500">No projects found. Create one to get started!</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
  );
};

export default ProjectList;
