// src/renderer/src/pages/UniversityPage.tsx
// M3 — University: courses, assignments, deadlines, grades and a GPA-style snapshot.

import React, { useState, useEffect, useCallback } from 'react'
import type { CourseIPC, AssignmentIPC, AssignmentStatus } from '../../../shared/types'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Dialog } from '../components/ui/Dialog'
import { GraduationCap, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

const UniversityPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseIPC[]>([])
  const [assignments, setAssignments] = useState<AssignmentIPC[]>([])
  const [gpa, setGpa] = useState<{ gradeAvg: number | null; totalCredits: number }>({
    gradeAvg: null,
    totalCredits: 0
  })
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [courseOpen, setCourseOpen] = useState(false)

  // course form
  const [cName, setCName] = useState('')
  const [cCode, setCCode] = useState('')
  const [cInstructor, setCInstructor] = useState('')
  const [cCredits, setCCredits] = useState('')
  const [cSemester, setCSemester] = useState('')

  const refresh = useCallback(async () => {
    const [c, a, g] = await Promise.all([
      window.api.getCourses(),
      window.api.getAssignments(),
      window.api.getGpa()
    ])
    if (c.success && c.data) setCourses(c.data)
    if (a.success && a.data) setAssignments(a.data)
    if (g.success && g.data) setGpa(g.data)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addCourse = async () => {
    if (!cName.trim()) return
    await window.api.createCourse({
      name: cName.trim(),
      code: cCode.trim() || null,
      instructor: cInstructor.trim() || null,
      credits: cCredits ? Number(cCredits) : null,
      semester: cSemester.trim() || null
    })
    setCName('')
    setCCode('')
    setCInstructor('')
    setCCredits('')
    setCSemester('')
    setCourseOpen(false)
    await refresh()
  }

  const removeCourse = async (id: string) => {
    if (!window.confirm('Delete this course and all its assignments?')) return
    await window.api.deleteCourse(id)
    await refresh()
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const upcoming = assignments
    .filter((a) => a.status !== 'done' && a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  const courseName = (id: string) => courses.find((c) => c.id === id)?.name ?? ''

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">University</h1>
        </div>
        <Button onClick={() => setCourseOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </div>

      {/* Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Current grade" value={gpa.gradeAvg != null ? `${gpa.gradeAvg}` : '—'} />
        <StatCard label="Credits tracked" value={`${gpa.totalCredits}`} />
        <StatCard label="Courses" value={`${courses.length}`} />
      </div>

      {/* Upcoming deadlines */}
      {upcoming.length > 0 && (
        <div className="bg-card border border-border/50 rounded-lg p-4 mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">
            Upcoming deadlines
          </p>
          <div className="space-y-2">
            {upcoming.map((a) => {
              const overdue = new Date(a.dueDate!) < new Date()
              return (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-muted-foreground">{courseName(a.courseId)} · </span>
                    {a.title}
                  </span>
                  <span className={overdue ? 'text-red-500' : 'text-muted-foreground'}>
                    {new Date(a.dueDate!).toLocaleDateString()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Courses */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <GraduationCap className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No courses yet. Add your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <CourseRow
              key={c.id}
              course={c}
              assignments={assignments.filter((a) => a.courseId === c.id)}
              expanded={expanded.has(c.id)}
              onToggle={() => toggleExpand(c.id)}
              onDelete={() => removeCourse(c.id)}
              refresh={refresh}
            />
          ))}
        </div>
      )}

      <Dialog
        trigger={<span style={{ display: 'none' }} />}
        title="New Course"
        open={courseOpen}
        onOpenChange={setCourseOpen}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input value={cName} onChange={(e) => setCName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <Input value={cCode} onChange={(e) => setCCode(e.target.value)} placeholder="CS101" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Credits</label>
              <Input
                type="number"
                value={cCredits}
                onChange={(e) => setCCredits(e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Instructor</label>
              <Input value={cInstructor} onChange={(e) => setCInstructor(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Semester</label>
              <Input
                value={cSemester}
                onChange={(e) => setCSemester(e.target.value)}
                placeholder="Fall 2026"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setCourseOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addCourse} disabled={!cName.trim()}>
              Add Course
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-card border border-border/50 rounded-lg p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
)

const CourseRow: React.FC<{
  course: CourseIPC
  assignments: AssignmentIPC[]
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  refresh: () => Promise<void>
}> = ({ course, assignments, expanded, onToggle, onDelete, refresh }) => {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [weight, setWeight] = useState('')

  const addAssignment = async () => {
    if (!title.trim()) return
    await window.api.createAssignment({
      courseId: course.id,
      title: title.trim(),
      dueDate: due ? new Date(due).toISOString() : null,
      weight: weight ? Number(weight) : null
    })
    setTitle('')
    setDue('')
    setWeight('')
    await refresh()
  }

  const setStatus = async (a: AssignmentIPC, status: AssignmentStatus) => {
    await window.api.updateAssignment(a.id, { status })
    await refresh()
  }

  const setGrade = async (a: AssignmentIPC, grade: string) => {
    await window.api.updateAssignment(a.id, { grade: grade ? Number(grade) : null })
    await refresh()
  }

  const removeAssignment = async (id: string) => {
    await window.api.deleteAssignment(id)
    await refresh()
  }

  return (
    <div className="bg-card border border-border/50 rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">
            {course.code && <span className="text-muted-foreground">{course.code} · </span>}
            {course.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {course.instructor && `${course.instructor} · `}
            {course.semester}
            {course.credits != null && ` · ${course.credits} cr`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold">
            {course.currentGrade != null ? course.currentGrade : '—'}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {course.openCount} open / {course.assignmentCount}
          </div>
        </div>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-3 bg-muted/20">
          {assignments.length === 0 && (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          )}
          {assignments.map((a) => {
            const overdue = a.dueDate && a.status !== 'done' && new Date(a.dueDate) < new Date()
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={a.status === 'done'}
                  onChange={() => setStatus(a, a.status === 'done' ? 'todo' : 'done')}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <span
                  className={
                    'flex-1 min-w-[140px] ' +
                    (a.status === 'done' ? 'line-through text-muted-foreground' : '')
                  }
                >
                  {a.title}
                </span>
                {a.dueDate && (
                  <span
                    className={'text-xs ' + (overdue ? 'text-red-500' : 'text-muted-foreground')}
                  >
                    {new Date(a.dueDate).toLocaleDateString()}
                  </span>
                )}
                {a.weight != null && (
                  <span className="text-xs text-muted-foreground">{a.weight}%</span>
                )}
                <Input
                  type="number"
                  defaultValue={a.grade ?? ''}
                  onBlur={(e) => setGrade(a, e.target.value)}
                  placeholder="grade"
                  className="w-20 h-8 text-xs"
                />
                <button
                  onClick={() => removeAssignment(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}

          {/* Add assignment */}
          <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-border/50">
            <div className="flex-1 min-w-[160px]">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAssignment()}
                placeholder="New assignment"
                className="h-9"
              />
            </div>
            <Input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-40 h-9"
            />
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="weight %"
              className="w-24 h-9"
            />
            <Button size="sm" onClick={addAssignment} disabled={!title.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UniversityPage
