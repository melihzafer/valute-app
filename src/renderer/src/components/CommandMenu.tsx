// src/renderer/src/components/CommandMenu.tsx
// Global Command Menu using cmdk library with Linear-style aesthetic

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  Home,
  FolderKanban,
  BarChart3,
  Settings,
  Plus,
  FileText,
  Folder,
  Play,
  Palette
} from 'lucide-react'
import { useUIStore } from '../store/useUIStore'
import { useProjectStore } from '../store/useProjectStore'
import { useTimerStore } from '../store/useTimerStore'
import { toast } from '../store/useToastStore'
import { THEME_PRESETS } from '../lib/themes'

export function CommandMenu() {
  const navigate = useNavigate()
  const { isCmdkOpen, setCmdkOpen, toggleCmdk, requestNewProject, setTheme } = useUIStore()
  const { projects, fetchProjects } = useProjectStore()
  const { startTimer } = useTimerStore()

  const [screen, setScreen] = useState<
    'main' | 'start-timer' | 'add-todo-select-project' | 'add-todo-title' | 'switch-theme'
  >('main')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

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

  // Reset menu state when closed
  useEffect(() => {
    if (!isCmdkOpen) {
      setScreen('main')
      setSelectedProjectId(null)
      setInputValue('')
    }
  }, [isCmdkOpen])

  // Helper function to run command and close menu
  const runCommand = (callback: () => void) => {
    setCmdkOpen(false)
    callback()
  }

  const handleAddTodo = async (projectId: string, title: string) => {
    try {
      const res = await window.api.createTask({
        title,
        projectId,
        area: 'work'
      })
      if (res.success) {
        toast.success(`Added todo: "${title}"`)
        setCmdkOpen(false)
      } else {
        toast.error(res.error || 'Failed to add todo')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to add todo')
    }
  }

  const getPlaceholder = () => {
    switch (screen) {
      case 'start-timer':
        return 'Select a project to start timer...'
      case 'add-todo-select-project':
        return 'Select a project to add a todo...'
      case 'add-todo-title':
        return 'Type todo title and press Enter...'
      case 'switch-theme':
        return 'Select a theme...'
      default:
        return 'Type a command or search...'
    }
  }

  if (!isCmdkOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in"
      onClick={() => setCmdkOpen(false)}
    >
      <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl">
        <Command
          filter={(value, search) => {
            if (screen === 'add-todo-title') return 1
            if (value.toLowerCase().includes(search.toLowerCase())) return 1
            return 0
          }}
          className="rounded-lg border border-border bg-popover shadow-2xl overflow-hidden animate-in fade-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {screen !== 'main' && (
            <div className="px-4 py-1.5 text-[10px] text-muted-foreground border-b border-border bg-muted/30 flex justify-between items-center select-none">
              <span>
                Screen:{' '}
                <span className="text-foreground capitalize">{screen.replace(/-/g, ' ')}</span>
              </span>
              <span>
                Press{' '}
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  Esc
                </kbd>{' '}
                to go back
              </span>
            </div>
          )}

          <div className="flex items-center border-b border-border px-4">
            <Command.Input
              placeholder={getPlaceholder()}
              value={inputValue}
              onValueChange={setInputValue}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && screen === 'add-todo-title') {
                  e.preventDefault()
                  if (!inputValue.trim()) return
                  handleAddTodo(selectedProjectId!, inputValue.trim())
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  if (screen !== 'main') {
                    setScreen('main')
                    setInputValue('')
                  } else {
                    setCmdkOpen(false)
                  }
                }
              }}
              className="flex h-12 w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {/* main screen */}
            {screen === 'main' && (
              <>
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
                    onSelect={() => runCommand(() => navigate('/finance'))}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Finance</span>
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
                    onSelect={() => setScreen('start-timer')}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <Play className="w-4 h-4 text-emerald-500" />
                    <span>Start Timer for Project...</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => setScreen('add-todo-select-project')}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Todo...</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => setScreen('switch-theme')}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <Palette className="w-4 h-4 text-primary" />
                    <span>Switch Theme...</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() =>
                      runCommand(() => {
                        navigate('/projects')
                        requestNewProject()
                      })
                    }
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Project</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => runCommand(() => navigate('/reports'))}
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
              </>
            )}

            {/* start timer screen */}
            {screen === 'start-timer' && (
              <Command.Group heading="Select Project to Start Timer">
                {projects
                  .filter((p) => p.status === 'active')
                  .map((project) => (
                    <Command.Item
                      key={project.id}
                      onSelect={() =>
                        runCommand(async () => {
                          await startTimer(project.id)
                          toast.success(`Started timer for ${project.name}`)
                        })
                      }
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                    >
                      <Folder className="w-4 h-4" />
                      <span>{project.name}</span>
                    </Command.Item>
                  ))}
                {projects.filter((p) => p.status === 'active').length === 0 && (
                  <Command.Item disabled className="px-3 py-2 text-sm text-muted-foreground">
                    No active projects found.
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {/* add todo: select project screen */}
            {screen === 'add-todo-select-project' && (
              <Command.Group heading="Select Project for Todo">
                {projects
                  .filter((p) => p.status === 'active')
                  .map((project) => (
                    <Command.Item
                      key={project.id}
                      onSelect={() => {
                        setSelectedProjectId(project.id)
                        setScreen('add-todo-title')
                        setInputValue('')
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                    >
                      <Folder className="w-4 h-4" />
                      <span>{project.name}</span>
                    </Command.Item>
                  ))}
                {projects.filter((p) => p.status === 'active').length === 0 && (
                  <Command.Item disabled className="px-3 py-2 text-sm text-muted-foreground">
                    No active projects found.
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {/* add todo: enter title screen */}
            {screen === 'add-todo-title' && (
              <Command.Group heading="Create New Todo">
                <Command.Item disabled className="px-3 py-2.5 text-sm text-foreground">
                  <span className="text-muted-foreground mr-1">Project:</span>{' '}
                  <span className="font-semibold">
                    {projects.find((p) => p.id === selectedProjectId)?.name}
                  </span>
                </Command.Item>
                <Command.Item disabled className="px-3 py-2.5 text-xs text-muted-foreground italic">
                  Type the todo title in the search box above and press Enter to save.
                </Command.Item>
              </Command.Group>
            )}

            {/* switch theme screen */}
            {screen === 'switch-theme' && (
              <Command.Group heading="Select Theme">
                {THEME_PRESETS.map((preset) => (
                  <Command.Item
                    key={preset.id}
                    onSelect={() =>
                      runCommand(() => {
                        setTheme(preset.id)
                        toast.success(`Theme switched to ${preset.name}`)
                      })
                    }
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-foreground rounded-md cursor-pointer transition-colors aria-selected:bg-accent aria-selected:text-primary"
                  >
                    <span>{preset.name}</span>
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
