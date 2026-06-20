// src/renderer/src/store/useDashboardStore.ts
// Dashboard widget duzeni: siralama, gorunurluk ve proje filtresi kalici saklanir.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WidgetId =
  | 'clock'
  | 'timeStats'
  | 'kpis'
  | 'timer'
  | 'quickStart'
  | 'revenueChart'
  | 'recentActivity'
  | 'quickActions'
  | 'projectTodos'
  | 'whoOwesYou'
  | 'topEarners'
  | 'financeInvoices'
  | 'projectsList'
  | 'clientsList'
  | 'plannerTasks'
  | 'plannerGoals'
  | 'plannerHabits'
  | 'journalMood'
  | 'notesList'
  | 'ideasList'
  | 'hobbiesList'
  | 'universityCourses'
  | 'appLauncher'
  | 'repoOpener'
  | 'healthQuickLog'
  | 'githubStatus'
  | 'earningsTicker'
  | 'streak'
  | 'goalThermometer'
  | 'focusToday'
  | 'upcomingCalendar'
  | 'projectStatusBoard'
  | 'projectHub'

export const WIDGET_META: Record<
  WidgetId,
  { name: string; description: string; category: string }
> = {
  clock: { name: 'Clock', description: 'Current time and date', category: 'Dashboard' },
  timeStats: {
    name: 'Time Stats',
    description: 'Tracked time and earnings overview',
    category: 'Dashboard'
  },
  kpis: {
    name: 'Business KPIs',
    description: 'Revenue, unbilled, active projects & profit',
    category: 'Dashboard'
  },
  timer: {
    name: 'Time Tracker',
    description: 'Quick stopwatch to log your hours',
    category: 'Dashboard'
  },
  quickStart: {
    name: 'Quick Start',
    description: 'One-click timer per project',
    category: 'Dashboard'
  },
  revenueChart: { name: 'Revenue Trend', description: '30-day revenue chart', category: 'Finance' },
  recentActivity: {
    name: 'Recent Activity',
    description: 'Latest tracked work sessions',
    category: 'Dashboard'
  },
  quickActions: {
    name: 'Quick Actions',
    description: 'Shortcuts to common operations',
    category: 'Dashboard'
  },
  projectTodos: {
    name: 'Project Todos',
    description: 'Todo list of a chosen project',
    category: 'Projects'
  },
  whoOwesYou: {
    name: 'Who Owes You',
    description: 'Client balances and total outstanding',
    category: 'Finance'
  },
  topEarners: {
    name: 'Top Earners',
    description: 'Top revenue projects of last 30 days',
    category: 'Finance'
  },
  financeInvoices: {
    name: 'Recent Invoices',
    description: 'Latest invoices and payment status',
    category: 'Finance'
  },
  projectsList: {
    name: 'Projects List',
    description: 'List of all active/on hold projects',
    category: 'Projects'
  },
  clientsList: {
    name: 'Clients List',
    description: 'Quick overview of all client accounts',
    category: 'Clients'
  },
  plannerTasks: {
    name: 'Tasks List',
    description: 'Manage and check off your personal tasks',
    category: 'Planner'
  },
  plannerGoals: {
    name: 'Goals List',
    description: 'Track active personal goals and milestones',
    category: 'Planner'
  },
  plannerHabits: {
    name: 'Habits Checklist',
    description: 'Complete your daily habits routine',
    category: 'Planner'
  },
  journalMood: {
    name: 'Mood Journal',
    description: "Log today's mood and view recent logs",
    category: 'Journal'
  },
  notesList: {
    name: 'Recent Notes',
    description: 'Quick notebook access and search',
    category: 'Notes'
  },
  ideasList: {
    name: 'Brainstorm Ideas',
    description: 'Log and promote quick brainstorm ideas',
    category: 'Ideas'
  },
  hobbiesList: {
    name: 'Hobbies Tracker',
    description: 'Track progress on personal hobbies',
    category: 'Hobbies'
  },
  universityCourses: {
    name: 'University Tracker',
    description: 'GPA and active university courses',
    category: 'University'
  },
  appLauncher: {
    name: 'App Launcher',
    description: 'One-click shortcuts to your favorite apps',
    category: 'Dashboard'
  },
  repoOpener: {
    name: 'Repo & Directory Opener',
    description: 'One-click open project GitHub repos and local folders',
    category: 'Projects'
  },
  healthQuickLog: {
    name: 'Health Check-in',
    description: 'Log and track steps, water, sleep and workouts',
    category: 'Health'
  },
  githubStatus: {
    name: 'GitHub Repo Status',
    description: 'Monitor open GitHub issues and pull requests',
    category: 'Projects'
  },
  earningsTicker: {
    name: 'Earnings Ticker',
    description: 'Real-time ticker showing cents growing as timer runs',
    category: 'Dashboard'
  },
  streak: {
    name: 'Track Streak',
    description: 'Show consecutive days with tracked time',
    category: 'Dashboard'
  },
  goalThermometer: {
    name: 'Goal Thermometer',
    description: 'Progress bar of monthly financial goals',
    category: 'Finance'
  },
  focusToday: {
    name: 'Focus Today',
    description: 'Select your top 3 high-priority tasks',
    category: 'Planner'
  },
  upcomingCalendar: {
    name: 'Upcoming',
    description: 'Next events & deadlines across every life area',
    category: 'Planner'
  },
  projectStatusBoard: {
    name: 'Project Status Board',
    description: 'Counts of active, on-hold, done & archived projects',
    category: 'Projects'
  }
}

export const ALL_WIDGET_IDS: WidgetId[] = [
  'clock',
  'timeStats',
  'kpis',
  'timer',
  'quickStart',
  'revenueChart',
  'recentActivity',
  'quickActions',
  'projectTodos',
  'whoOwesYou',
  'topEarners',
  'financeInvoices',
  'projectsList',
  'clientsList',
  'plannerTasks',
  'plannerGoals',
  'plannerHabits',
  'journalMood',
  'notesList',
  'ideasList',
  'hobbiesList',
  'universityCourses',
  'appLauncher',
  'repoOpener',
  'healthQuickLog',
  'githubStatus',
  'earningsTicker',
  'streak',
  'goalThermometer',
  'focusToday',
  'upcomingCalendar',
  'projectStatusBoard'
]

const DEFAULT_ORDER: WidgetId[] = [...ALL_WIDGET_IDS]

const DEFAULT_HIDDEN: WidgetId[] = [
  'quickActions',
  'projectTodos',
  'whoOwesYou',
  'topEarners',
  'financeInvoices',
  'projectsList',
  'clientsList',
  'plannerTasks',
  'plannerGoals',
  'plannerHabits',
  'journalMood',
  'notesList',
  'ideasList',
  'hobbiesList',
  'universityCourses',
  'appLauncher',
  'repoOpener',
  'healthQuickLog',
  'upcomingCalendar',
  'projectStatusBoard'
]

export const IMPLEMENTED_WIDGET_IDS: WidgetId[] = [
  'clock',
  'timeStats',
  'kpis',
  'timer',
  'quickStart',
  'revenueChart',
  'recentActivity',
  'githubStatus',
  'earningsTicker',
  'streak',
  'goalThermometer',
  'focusToday',
  'upcomingCalendar',
  'plannerHabits',
  'notesList',
  'universityCourses',
  'repoOpener',
  'healthQuickLog',
  'projectsList',
  'projectTodos',
  'projectStatusBoard'
]

/** A user-saved dashboard layout: which widgets, their order, and per-widget config. */
export interface LayoutPreset {
  id: string
  name: string
  order: WidgetId[]
  hidden: WidgetId[]
  widgetConfig: Partial<Record<WidgetId, Record<string, string>>>
}

interface DashboardState {
  order: WidgetId[]
  hidden: WidgetId[]
  /** '' = all projects */
  projectFilter: string
  editMode: boolean
  isCanvasLocked: boolean
  /** Widget basina ayarlar (or. projectTodos icin secili proje) */
  widgetConfig: Partial<Record<WidgetId, Record<string, string>>>
  /** User-defined layout presets */
  customPresets: LayoutPreset[]
  setProjectFilter: (id: string) => void
  setEditMode: (on: boolean) => void
  setCanvasLocked: (locked: boolean) => void
  moveWidget: (from: WidgetId, to: WidgetId) => void
  toggleWidget: (id: WidgetId) => void
  setWidgetConfig: (id: WidgetId, config: Record<string, string>) => void
  resetLayout: () => void
  /** Save the current layout (order + visibility + widget config) as a named preset. */
  saveCustomPreset: (name: string) => void
  /** Replace the current layout with a saved preset. */
  applyCustomPreset: (id: string) => void
  deleteCustomPreset: (id: string) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      order: DEFAULT_ORDER,
      hidden: DEFAULT_HIDDEN,
      projectFilter: '',
      editMode: false,
      isCanvasLocked: false,
      widgetConfig: {},
      customPresets: [],
      setWidgetConfig: (id, config) =>
        set((state) => ({
          widgetConfig: { ...state.widgetConfig, [id]: { ...state.widgetConfig[id], ...config } }
        })),
      setProjectFilter: (id) => set({ projectFilter: id }),
      setEditMode: (on) => set({ editMode: on }),
      setCanvasLocked: (locked) => set({ isCanvasLocked: locked }),
      moveWidget: (from, to) =>
        set((state) => {
          if (from === to) return state
          const order = [...state.order]
          const fromIdx = order.indexOf(from)
          const toIdx = order.indexOf(to)
          if (fromIdx === -1 || toIdx === -1) return state
          order.splice(fromIdx, 1)
          order.splice(toIdx, 0, from)
          return { order }
        }),
      toggleWidget: (id) =>
        set((state) => ({
          hidden: state.hidden.includes(id)
            ? state.hidden.filter((w) => w !== id)
            : [...state.hidden, id]
        })),
      resetLayout: () =>
        set({ order: DEFAULT_ORDER, hidden: DEFAULT_HIDDEN, isCanvasLocked: false }),
      saveCustomPreset: (name) =>
        set((state) => {
          const id =
            globalThis.crypto?.randomUUID?.() ?? `preset-${state.customPresets.length + 1}-${name}`
          const preset: LayoutPreset = {
            id,
            name: name.trim() || 'Untitled layout',
            order: [...state.order],
            hidden: [...state.hidden],
            widgetConfig: JSON.parse(JSON.stringify(state.widgetConfig))
          }
          return { customPresets: [...state.customPresets, preset] }
        }),
      applyCustomPreset: (id) =>
        set((state) => {
          const p = state.customPresets.find((x) => x.id === id)
          if (!p) return state
          return {
            order: [...p.order],
            hidden: [...p.hidden],
            widgetConfig: JSON.parse(JSON.stringify(p.widgetConfig))
          }
        }),
      deleteCustomPreset: (id) =>
        set((state) => ({ customPresets: state.customPresets.filter((x) => x.id !== id) }))
    }),
    {
      name: 'valute-dashboard-layout',
      merge: (persisted: any, current) => {
        const merged = { ...current, ...(persisted ?? {}) }
        const order: WidgetId[] = Array.isArray(merged.order)
          ? merged.order.filter((id: WidgetId) => ALL_WIDGET_IDS.includes(id))
          : DEFAULT_ORDER
        for (const id of ALL_WIDGET_IDS) if (!order.includes(id)) order.push(id)
        const customPresets = Array.isArray(merged.customPresets) ? merged.customPresets : []
        return { ...merged, order, customPresets, editMode: false }
      }
    }
  )
)
