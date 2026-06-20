// src/main/services/TemplateService.ts
// M13 — ready-made starter templates per persona. Seeds realistic sample data
// so a new user can explore the app with their hands instead of a blank slate.

import { createClient } from './ClientService'
import { createProject } from './ProjectService'
import * as UniversityService from './UniversityService'
import * as TaskService from './TaskService'
import * as CalendarService from './CalendarService'

export type Persona = 'freelancer' | 'student' | 'creator'

function daysFromNow(days: number, hour = 9): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export interface TemplateResult {
  persona: Persona
  created: Record<string, number>
}

/** Seed sample data for a persona. Additive — does not delete anything. */
export async function applyTemplate(persona: Persona): Promise<TemplateResult> {
  const created: Record<string, number> = {}
  const bump = (k: string): void => {
    created[k] = (created[k] || 0) + 1
  }

  if (persona === 'freelancer') {
    const client = await createClient({
      name: 'Acme Studio',
      company: 'Acme Studio Ltd.',
      email: 'hello@acmestudio.example'
    } as any)
    bump('clients')

    await createProject({
      name: 'Acme Website Redesign',
      clientId: client.id,
      clientName: client.name,
      pricingModel: 'HOURLY',
      hourlyRate: 6000, // $60/hr in cents
      currency: 'USD',
      status: 'active',
      category: 'work'
    } as any)
    bump('projects')

    await TaskService.createTask({
      title: 'Send Acme the project proposal',
      area: 'work',
      priority: 'high',
      dueDate: daysFromNow(2)
    })
    await TaskService.createTask({
      title: 'Invoice Acme for last week',
      area: 'money',
      priority: 'medium',
      dueDate: daysFromNow(5)
    })
    created.tasks = 2

    await TaskService.createGoal({
      title: 'Monthly income',
      area: 'money',
      targetValue: 5000,
      currentValue: 0,
      unit: '$'
    })
    bump('goals')

    await CalendarService.createEvent({
      title: 'Client check-in call',
      area: 'work',
      startTime: daysFromNow(3, 14),
      reminderMinutes: 30
    })
    bump('events')

    await TaskService.createHabit({ name: 'Log my hours daily', area: 'work' })
    bump('habits')
  } else if (persona === 'student') {
    const cs = await UniversityService.createCourse({
      name: 'Intro to Computer Science',
      code: 'CS101',
      credits: 4,
      semester: 'Fall 2026'
    })
    const math = await UniversityService.createCourse({
      name: 'Calculus II',
      code: 'MATH201',
      credits: 3,
      semester: 'Fall 2026'
    })
    created.courses = 2

    await UniversityService.createAssignment({
      courseId: cs.id,
      title: 'Problem Set 1',
      dueDate: daysFromNow(4),
      weight: 10
    })
    await UniversityService.createAssignment({
      courseId: math.id,
      title: 'Midterm exam',
      dueDate: daysFromNow(10),
      weight: 30
    })
    created.assignments = 2

    await TaskService.createHabit({ name: 'Study 1 hour', area: 'uni' })
    bump('habits')
    await TaskService.createTask({
      title: 'Read chapter 3 before lecture',
      area: 'uni',
      priority: 'medium',
      dueDate: daysFromNow(1)
    })
    bump('tasks')
    await TaskService.createGoal({
      title: 'Finish semester with 3.5+ GPA',
      area: 'uni',
      targetValue: 4,
      currentValue: 0,
      unit: 'GPA'
    })
    bump('goals')

    await CalendarService.createEvent({
      title: 'CS101 lecture',
      area: 'uni',
      startTime: daysFromNow(1, 10),
      recurrence: 'weekly',
      reminderMinutes: 15
    })
    bump('events')
  } else if (persona === 'creator') {
    await createProject({
      name: 'YouTube Channel',
      pricingModel: 'HOURLY',
      hourlyRate: 0,
      currency: 'USD',
      status: 'active',
      category: 'hobby'
    } as any)
    bump('projects')

    await TaskService.createHabit({ name: 'Write for 30 minutes', area: 'hobby' })
    await TaskService.createHabit({ name: 'Read before bed', area: 'hobby' })
    created.habits = 2

    await TaskService.createGoal({
      title: 'Publish 12 videos this year',
      area: 'hobby',
      targetValue: 12,
      currentValue: 0,
      unit: 'videos'
    })
    bump('goals')
    await TaskService.createTask({
      title: 'Outline next video',
      area: 'hobby',
      priority: 'medium',
      dueDate: daysFromNow(3)
    })
    bump('tasks')
  }

  return { persona, created }
}
