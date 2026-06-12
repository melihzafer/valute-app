// src/renderer/src/pages/HobbiesPage.tsx
// M6 — Hobbies & personal projects. Same time-tracking engine as paid work,
// kept in its own space via the project `category` field.

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectIPC, ProjectCategory } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Dialog } from '../components/ui/Dialog'
import { Palette, Plus, Trash2, Clock } from 'lucide-react'

const HobbiesPage: React.FC = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectIPC[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ProjectCategory>('hobby')
  const [filter, setFilter] = useState<'all' | ProjectCategory>('all')

  const refresh = useCallback(async () => {
    const res = await window.api.getProjects()
    if (res.success && res.data) {
      // Only personal life-areas here; paid work lives on the Projects page.
      setProjects(res.data.filter((p) => p.category === 'hobby' || p.category === 'personal'))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const add = async () => {
    if (!name.trim()) return
    await window.api.createProject({
      name: name.trim(),
      pricingModel: 'HOURLY',
      hourlyRate: 0,
      currency: 'USD',
      status: 'active',
      workflowStatus: 'active',
      category
    } as Omit<ProjectIPC, 'id' | 'createdAt'>)
    setName('')
    setCategory('hobby')
    setOpen(false)
    await refresh()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this and all its time logs?')) return
    await window.api.deleteProject(id)
    await refresh()
  }

  const visible = projects.filter((p) => filter === 'all' || p.category === filter)

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <Palette className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Hobbies & Personal</h1>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Track personal projects and hobbies with the same timer as your paid work — no invoicing,
        just progress.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'hobby', label: 'Hobbies' },
          { id: 'personal', label: 'Personal' }
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilter(chip.id as 'all' | ProjectCategory)}
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
          <Palette className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            Nothing here yet. Add a hobby or personal project.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-border/50 rounded-lg p-4 flex flex-col gap-3 group cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => navigate(`/projects/${p.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{p.name}</h3>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm border capitalize text-primary border-primary/30 bg-primary/10">
                  {p.category}
                </span>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Open to track time
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    remove(p.id)
                  }}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        trigger={<span style={{ display: 'none' }} />}
        title="New Hobby / Personal Project"
        open={open}
        onOpenChange={setOpen}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="e.g., Learn guitar"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProjectCategory)}
            >
              <option value="hobby">Hobby</option>
              <option value="personal">Personal project</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={add} disabled={!name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default HobbiesPage
