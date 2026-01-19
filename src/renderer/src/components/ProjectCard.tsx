// src/renderer/src/components/ProjectCard.tsx

import React from 'react';
import { Project } from '../../../shared/types';
import { formatCurrency } from '../lib/utils';
import { MoreHorizontal, Edit, Trash } from 'lucide-react';
import { Button } from './ui/Button';

interface ProjectCardProps {
  project: Project;
  onSelectProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelectProject,
  onEditProject,
  onDeleteProject,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between transition-transform hover:scale-105">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 truncate" title={project.name}>
            {project.name}
          </h3>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
              <MoreHorizontal className="h-5 w-5" />
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={() => onEditProject(project)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Project
                </a>
              </li>
              <li>
                <a onClick={() => onDeleteProject(project.id)} className="text-red-500 hover:!bg-red-50 hover:!text-red-700">
                  <Trash className="h-4 w-4 mr-2" /> Delete Project
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mb-2 text-sm text-gray-600">
          Status: <span className="font-medium capitalize">{project.status}</span>
        </div>
        <div className="text-lg font-medium text-gray-900">
          {formatCurrency(project.hourlyRate, project.currency)} / hr
        </div>
      </div>
      <div className="mt-6">
        <Button
          onClick={() => onSelectProject(project.id)}
          className="w-full"
        >
          Track Time
        </Button>
      </div>
    </div>
  );
};

export default ProjectCard;
