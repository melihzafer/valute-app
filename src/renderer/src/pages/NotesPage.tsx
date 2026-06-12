// src/renderer/src/pages/NotesPage.tsx
// M7 — Notion-style notes: a personal knowledge base. Two-pane: list + editor.

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { NoteIPC, LifeArea } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Select } from '../components/ui/Select'
import { LIFE_AREAS, areaColor } from '../lib/lifeAreas'
import { FileText, Plus, Trash2, Pin, Search } from 'lucide-react'

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<NoteIPC[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // editor local state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [area, setArea] = useState<LifeArea>('general')

  const refresh = useCallback(async () => {
    const res = await window.api.getNotes()
    if (res.success && res.data) setNotes(res.data)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const selected = notes.find((n) => n.id === selectedId) || null

  // load editor when selection changes
  useEffect(() => {
    if (selected) {
      setTitle(selected.title)
      setContent(selected.content ?? '')
      setArea(selected.area)
    }
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const create = async () => {
    const res = await window.api.createNote({ title: 'Untitled', content: '', area: 'general' })
    if (res.success && res.data) {
      await refresh()
      setSelectedId(res.data.id)
    }
  }

  const persist = useCallback(
    (id: string, data: Partial<NoteIPC>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(async () => {
        await window.api.updateNote(id, data)
        await refresh()
      }, 400)
    },
    [refresh]
  )

  const onTitle = (v: string) => {
    setTitle(v)
    if (selected) persist(selected.id, { title: v || 'Untitled' })
  }
  const onContent = (v: string) => {
    setContent(v)
    if (selected) persist(selected.id, { content: v })
  }
  const onArea = async (v: LifeArea) => {
    setArea(v)
    if (selected) {
      await window.api.updateNote(selected.id, { area: v })
      await refresh()
    }
  }

  const togglePin = async (n: NoteIPC) => {
    await window.api.updateNote(n.id, { pinned: !n.pinned })
    await refresh()
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this note?')) return
    await window.api.deleteNote(id)
    if (selectedId === id) setSelectedId(null)
    await refresh()
  }

  const visible = notes.filter(
    (n) =>
      !query ||
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      (n.content ?? '').toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* List pane */}
      <div className="w-72 border-r border-border flex flex-col shrink-0">
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="font-bold text-lg">Notes</h1>
            </div>
            <Button size="sm" onClick={create}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="pl-8 h-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 && <p className="text-sm text-muted-foreground p-4">No notes.</p>}
          {visible.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={
                'w-full text-left px-4 py-3 border-b border-border/50 group flex items-start gap-2 ' +
                (selectedId === n.id ? 'bg-primary/10' : 'hover:bg-muted/50')
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: areaColor(n.area) }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {n.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                  <span className="font-medium text-sm truncate">{n.title}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {(n.content ?? '').replace(/\n/g, ' ') || 'No content'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor pane */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <>
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Input
                value={title}
                onChange={(e) => onTitle(e.target.value)}
                className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-0"
                placeholder="Untitled"
              />
              <Select
                value={area}
                onChange={(e) => onArea(e.target.value as LifeArea)}
                className="w-32"
              >
                {LIFE_AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePin(selected)}
                className={selected.pinned ? 'text-primary' : 'text-muted-foreground'}
              >
                <Pin className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(selected.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={content}
              onChange={(e) => onContent(e.target.value)}
              placeholder="Start writing… markdown welcome."
              className="flex-1 border-0 shadow-none focus-visible:ring-0 rounded-none resize-none p-6 text-sm leading-relaxed"
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Select a note or create a new one.</p>
            <Button onClick={create}>
              <Plus className="mr-2 h-4 w-4" /> New Note
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotesPage
