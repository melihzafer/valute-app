// src/renderer/src/components/ProjectTodos.tsx
// Proje bazli yapilacaklar listesi — Planner'daki tasks tablosunu projectId ile kullanir.

import React, { useEffect, useState } from 'react'
import { Plus, Trash2, CheckSquare, Loader2, Github, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { toast } from '../store/useToastStore'
import type { TaskIPC, ProjectIPC } from '../../../shared/types'

interface ProjectTodosProps {
  projectId: string
  /** true: Card sarmalayicisi olmadan render et (baska bir Card icine gomulurken) */
  embedded?: boolean
}

const ProjectTodos: React.FC<ProjectTodosProps> = ({ projectId, embedded = false }) => {
  const [todos, setTodos] = useState<TaskIPC[]>([])
  const [project, setProject] = useState<ProjectIPC | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [title, setTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const loadProject = async (): Promise<void> => {
    const res = await window.api.getProjectById(projectId)
    if (res.success && res.data) {
      setProject(res.data)
    }
  }

  const load = async (): Promise<void> => {
    const res = await window.api.getTasks()
    if (res.success && res.data) {
      setTodos(res.data.filter((t: TaskIPC) => t.projectId === projectId))
    }
    await loadProject()
    setIsLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleAdd = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    setIsAdding(true)
    const res = await window.api.createTask({ title: trimmed, projectId, area: 'work' })
    setIsAdding(false)
    if (res.success) {
      setTitle('')
      load()
    } else {
      toast.error(res.error || 'Failed to add todo')
    }
  }

  const toggle = async (t: TaskIPC): Promise<void> => {
    const res = await window.api.updateTask(t.id, {
      status: t.status === 'done' ? 'todo' : 'done'
    })
    if (res.success) load()
  }

  const remove = async (t: TaskIPC): Promise<void> => {
    const res = await window.api.deleteTask(t.id)
    if (res.success) {
      toast.success('Todo deleted')
      load()
    }
  }

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true)
    toast.info('Syncing issues from GitHub...')
    const res = await window.api.githubSyncIssues(projectId)
    setIsSyncing(false)
    if (res.success) {
      toast.success('Sync complete')
      load()
    } else {
      toast.error(res.error || 'Failed to sync with GitHub')
    }
  }

  const handleCreateIssue = async (todo: TaskIPC): Promise<void> => {
    toast.info('Creating GitHub issue...')
    const res = await window.api.githubCreateIssue(todo.id, projectId, todo.title, todo.notes)
    if (res.success && res.data) {
      toast.success(`GitHub issue #${res.data.issueNumber} created`)
      load()
    } else {
      toast.error(res.error || 'Failed to create GitHub issue')
    }
  }

  const open = todos.filter((t) => t.status !== 'done')
  const done = todos.filter((t) => t.status === 'done')

  return (
    <Card className={embedded ? 'border-0 shadow-none bg-transparent' : ''}>
      {!embedded && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              Todos
              {todos.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  {done.length}/{todos.length} done
                </span>
              )}
            </div>
            {project?.githubUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleSync}
                disabled={isSyncing}
                title="Sync issues from GitHub"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={embedded ? 'p-0 space-y-3' : 'space-y-3'}>
        <div className="flex gap-2">
          <form onSubmit={handleAdd} className="flex-1 flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a todo for this project…"
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding || !title.trim()} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </form>
          {embedded && project?.githubUrl && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync issues from GitHub"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No todos yet. Break the project into small steps.
          </p>
        ) : (
          <div className="space-y-1">
            {[...open, ...done].map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50 group transition-colors"
              >
                <input
                  type="checkbox"
                  checked={t.status === 'done'}
                  onChange={() => toggle(t)}
                  className="h-4 w-4 accent-[hsl(var(--primary))] cursor-pointer"
                />
                <span
                  className={`text-sm flex-1 ${
                    t.status === 'done' ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {t.title}
                </span>

                {project?.githubUrl && (
                  <div className="flex items-center gap-1.5">
                    {t.githubIssueNumber ? (
                      <a
                        href={t.githubIssueUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20"
                        title="View issue on GitHub"
                      >
                        <Github className="h-3 w-3" />
                        <span>#{t.githubIssueNumber}</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => handleCreateIssue(t)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-1"
                        title="Create GitHub issue"
                      >
                        <Github className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <button
                  onClick={() => remove(t)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                  title="Delete todo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ProjectTodos
