// src/renderer/src/components/ProjectCard.tsx

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Project } from '../../../shared/types'
import { formatCurrency } from '../lib/utils'
import { MoreVertical, Edit, Trash2, Clock, DollarSign } from 'lucide-react'
import { Button } from './ui/Button'

interface ProjectCardProps {
  project: Project
  onSelectProject: (projectId: string) => void
  onEditProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelectProject,
  onEditProject,
  onDeleteProject
}) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = React.useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking menu or button
    if ((e.target as HTMLElement).closest('button')) return
    navigate(`/projects/${project.id}`)
  }

  const getPricingModelBadge = () => {
    const badges = {
      HOURLY: { label: 'Hourly', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      FIXED: { label: 'Fixed Price', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
      UNIT_BASED: {
        label: 'Unit Based',
        color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      },
      SUBSCRIPTION: {
        label: 'Subscription',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      }
    }
    const badge = badges[project.pricingModel] || badges.HOURLY
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-xl p-6 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate mb-2" title={project.name}>
            {project.name}
          </h3>
          {project.clientName && (
            <p className="text-sm text-muted-foreground truncate" title={project.clientName}>
              {project.clientName}
            </p>
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    onEditProject(project)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Project
                </button>
                <button
                  onClick={() => {
                    onDeleteProject(project.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-destructive/10 text-destructive flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Project
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pricing Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          {getPricingModelBadge()}
          <span
            className={`text-xs font-medium ${project.status === 'active' ? 'text-green-500 dark:text-green-400' : 'text-muted-foreground'}`}
          >
            {project.status === 'active' ? '● Active' : '○ Archived'}
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 text-foreground">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {formatCurrency(
              (project.hourlyRate || project.fixedPrice || 0) / 100,
              project.currency
            )}
          </span>
          <span className="text-sm text-muted-foreground">
            {project.pricingModel === 'HOURLY'
              ? 'hourly'
              : project.pricingModel === 'UNIT_BASED'
                ? `/ ${project.unitName || 'unit'}`
                : ''}
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={() => onSelectProject(project.id)}
        className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all"
        size="sm"
      >
        <Clock className="mr-2 h-4 w-4" />
        Track Time
      </Button>
    </div>
  )
}

export default ProjectCard
