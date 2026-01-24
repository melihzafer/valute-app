// src/renderer/src/components/CommandMenu.tsx
// Global Command Menu using cmdk library with Linear-style aesthetic

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { Home, FolderKanban, BarChart3, Settings, Plus, FileText, Folder } from 'lucide-react'
import { useUIStore } from '../store/useUIStore'
import { useProjectStore } from '../store/useProjectStore'

export function CommandMenu() {
  const navigate = useNavigate()
  const { isCmdkOpen, setCmdkOpen, toggleCmdk } = useUIStore()
  const { projects, fetchProjects } = useProjectStore()

  // Listen for Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCmdk()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toggleCmdk])

  // Load projects when menu opens
  useEffect(() => {
    if (isCmdkOpen) {
      fetchProjects()
    }
  }, [isCmdkOpen, fetchProjects])

  // Helper function to run command and close menu
  const runCommand = (callback: () => void) => {
    setCmdkOpen(false)
    callback()
  }

  if (!isCmdkOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={() => setCmdkOpen(false)}
    >
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl">
        <Command
          className="rounded-lg border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-border px-4">
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* Navigation Group */}
            <Command.Group
              heading="Navigation"
              className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              <Command.Item
                onSelect={() => runCommand(() => navigate('/'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/projects'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
              >
                <FolderKanban className="w-4 h-4" />
                <span>Projects</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/reports'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </Command.Item>

              <Command.Item
                onSelect={() => runCommand(() => navigate('/settings'))}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>

            {/* Actions Group */}
            <Command.Group
              heading="Actions"
              className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2"
            >
              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    navigate('/projects')
                    // TODO: Trigger new project modal
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Command.Item>

              <Command.Item
                onSelect={() =>
                  runCommand(() => {
                    navigate('/reports')
                    // TODO: Trigger invoice generation
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Invoice</span>
              </Command.Item>
            </Command.Group>

            {/* Go to Project Group */}
            {projects.length > 0 && (
              <Command.Group
                heading="Go to Project"
                className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-2"
              >
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    onSelect={() => runCommand(() => navigate(`/projects/${project.id}`))}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <Folder className="w-4 h-4" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate">{project.name}</span>
                      {project.status === 'archived' && (
                        <span className="text-xs text-muted-foreground">Archived</span>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
