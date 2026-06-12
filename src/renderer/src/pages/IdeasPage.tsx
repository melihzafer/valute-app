// src/renderer/src/pages/IdeasPage.tsx
// Brainstorm space: capture ideas (markdown body + tags + status) and promote
// promising ones into real projects.

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IdeaIPC, IdeaStatus } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { Dialog } from '../components/ui/Dialog'
import { Lightbulb, Plus, Trash2, Rocket } from 'lucide-react'

const STATUSES: { id: IdeaStatus; label: string }[] = [
  { id: 'spark', label: 'Spark' },
  { id: 'exploring', label: 'Exploring' },
  { id: 'parked', label: 'Parked' },
  { id: 'promoted', label: 'Promoted' }
]

const statusStyle: Record<IdeaStatus, string> = {
  spark: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  exploring: 'text-primary border-primary/30 bg-primary/10',
  parked: 'text-muted-foreground border-border bg-muted',
  promoted: 'text-green-500 border-green-500/30 bg-green-500/10'
}

const IdeasPage: React.FC = () => {
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<IdeaIPC[]>([])
  const [filter, setFilter] = useState<'all' | IdeaStatus>('all')
  const [isAddOpen, setIsAddOpen] = useState(false)

  // New-idea form state
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [status, setStatus] = useState<IdeaStatus>('spark')

  const refresh = useCallback(async () => {
    const res = await window.api.getIdeas()
    if (res.success && res.data) setIdeas(res.data)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const resetForm = () => {
    setTitle('')
    setBody('')
    setTags('')
    setStatus('spark')
  }

  const handleAdd = async () => {
    if (!title.trim()) return
    await window.api.createIdea({
      title: title.trim(),
      body: body.trim() || null,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status
    })
    resetForm()
    setIsAddOpen(false)
    await refresh()
  }

  const handleStatusChange = async (id: string, newStatus: IdeaStatus) => {
    await window.api.updateIdea(id, { status: newStatus })
    await refresh()
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this idea?')) return
    await window.api.deleteIdea(id)
    await refresh()
  }

  const handlePromote = async (idea: IdeaIPC) => {
    if (!window.confirm(`Promote "${idea.title}" into a new project?`)) return
    const res = await window.api.promoteIdea(idea.id)
    if (res.success && res.data) {
      navigate(`/projects/${res.data.projectId}`)
    }
  }

  const visible = ideas.filter((i) => filter === 'all' || i.status === filter)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Ideas</h1>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Idea
        </Button>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ id: 'all', label: 'All' }, ...STATUSES].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id as 'all' | IdeaStatus)}
            className={
              'px-3 py-1.5 text-sm rounded-full border transition-colors ' +
              (filter === chip.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:text-foreground')
            }
          >
            {chip.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Lightbulb className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No ideas here yet. Capture your first spark.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((idea) => (
            <div
              key={idea.id}
              className="bg-card border border-border/50 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground">{idea.title}</h3>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm border capitalize ${statusStyle[idea.status]}`}
                >
                  {idea.status}
                </span>
              </div>

              {idea.body && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">
                  {idea.body}
                </p>
              )}

              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-border/50">
                <Select
                  value={idea.status}
                  onChange={(e) => handleStatusChange(idea.id, e.target.value as IdeaStatus)}
                  disabled={idea.status === 'promoted'}
                  className="text-xs h-8 py-0 w-32"
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
                <div className="flex items-center gap-1">
                  {idea.status !== 'promoted' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Promote to project"
                      onClick={() => handlePromote(idea)}
                    >
                      <Rocket className="h-4 w-4" />
                    </Button>
                  ) : (
                    idea.promotedProjectId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/projects/${idea.promotedProjectId}`)}
                      >
                        Open
                      </Button>
                    )
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(idea.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Idea modal */}
      <Dialog
        trigger={<span style={{ display: 'none' }} />}
        title="New Idea"
        open={isAddOpen}
        onOpenChange={(open) => {
          setIsAddOpen(open)
          if (!open) resetForm()
        }}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Newsletter automation service"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Notes (markdown)
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What is it? Why might it work?"
              className="min-h-[120px] resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Tags (comma-separated)
            </label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="saas, automation"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status</label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as IdeaStatus)}>
              {STATUSES.filter((s) => s.id !== 'promoted').map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!title.trim()}>
              Add Idea
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default IdeasPage
