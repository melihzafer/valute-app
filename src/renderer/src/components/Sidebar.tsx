// src/renderer/src/components/Sidebar.tsx

import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  ReceiptText,
  Settings,
  Users,
  Lightbulb,
  CheckSquare,
  GraduationCap,
  HeartPulse,
  Activity,
  BookOpen,
  StickyNote,
  DollarSign,
  Palette,
  Sparkles,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useUIStore } from '../store/useUIStore'

const ValuteLogoSVG: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 435 437" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M217.5 0L405.861 109.25V327.75L217.5 437L29.1395 327.75V109.25L217.5 0Z"
      fill="url(#paint0_linear_valut)"
    />
    <path
      d="M217.5 34L376.416 126V310L217.5 402L58.5843 310V126L217.5 34Z"
      fill="hsl(var(--card))"
    />
    <path
      d="M136.038 141.497C136.59 142.454 136.263 143.677 135.306 144.229L121.77 152.044C120.814 152.596 120.486 153.819 121.038 154.776L213.976 315.748C214.745 317.082 216.67 317.082 217.44 315.748L310.377 154.776C310.929 153.819 310.602 152.596 309.645 152.044L283.77 137.105C282.814 136.553 281.59 136.881 281.038 137.837L217.44 247.993C216.67 249.326 214.745 249.326 213.976 247.993L135.737 112.48C135.185 111.524 135.513 110.301 136.469 109.748L214.708 64.5774C215.326 64.2201 216.089 64.2201 216.708 64.5774L258.306 88.5943C259.263 89.1466 259.59 90.3697 259.038 91.3263L247.093 112.016C246.541 112.973 245.317 113.301 244.361 112.748L216.708 96.7827C216.089 96.4254 215.326 96.4254 214.708 96.7827L176.27 118.975C175.314 119.527 174.986 120.75 175.538 121.707L214.533 189.248C215.303 190.582 217.228 190.582 217.997 189.248L270.716 97.9374C271.268 96.9808 272.491 96.6531 273.448 97.2054L347.538 139.981C348.157 140.339 348.538 140.999 348.538 141.713V294.094C348.538 294.808 348.157 295.468 347.538 295.826L252.502 350.695C250.73 351.718 248.747 349.735 249.77 347.963L274.452 305.212C274.628 304.908 274.88 304.656 275.184 304.48L318.538 279.45C319.157 279.093 319.538 278.432 319.538 277.718V206.212C319.538 204.166 316.829 203.44 315.806 205.212L220.368 370.516C219.816 371.473 218.592 371.801 217.636 371.248L87 295.826C86.3812 295.468 86 294.808 86 294.094V141.713C86 140.999 86.3812 140.339 87 139.981L121.39 120.126C122.347 119.574 123.57 119.902 124.122 120.858L136.038 141.497Z"
      fill="url(#paint1_linear_valut)"
    />
    <path
      d="M113.038 207.964C113.038 205.918 115.747 205.192 116.77 206.964L176.856 311.036C177.879 312.808 175.896 314.791 174.124 313.768L114.038 279.077C113.419 278.72 113.038 278.06 113.038 277.345V207.964Z"
      fill="hsl(var(--card))"
    />
    <defs>
      <linearGradient
        id="paint0_linear_valut"
        x1="217.5"
        y1="0"
        x2="217.5"
        y2="437"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(var(--primary) / 0.4)" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_valut"
        x1="217.269"
        y1="64"
        x2="217.269"
        y2="372.248"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="hsl(var(--primary))" />
        <stop offset="1" stopColor="hsl(var(--primary) / 0.4)" />
      </linearGradient>
    </defs>
  </svg>
)

const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  const navSections: {
    title: string
    items: { path: string; label: string; icon: typeof CalendarDays; end?: boolean }[]
  }[] = [
    {
      title: 'Work',
      items: [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { path: '/assistant', label: 'Assistant', icon: Sparkles },
        { path: '/finance', label: 'Finance', icon: DollarSign },
        { path: '/projects', label: 'Projects', icon: Package },
        { path: '/clients', label: 'Clients', icon: Users },
        { path: '/reports', label: 'Reports', icon: ReceiptText },
        { path: '/ideas', label: 'Ideas', icon: Lightbulb }
      ]
    },
    {
      title: 'Life',
      items: [
        { path: '/life', label: 'Life Dashboard', icon: HeartPulse },
        { path: '/calendar', label: 'Calendar', icon: CalendarDays },
        { path: '/health', label: 'Health', icon: Activity },
        { path: '/planner', label: 'Planner', icon: CheckSquare },
        { path: '/university', label: 'University', icon: GraduationCap },
        { path: '/journal', label: 'Journal', icon: BookOpen },
        { path: '/notes', label: 'Notes', icon: StickyNote },
        { path: '/hobbies', label: 'Hobbies', icon: Palette }
      ]
    }
  ]

  const linkClass = (isActive: boolean): string =>
    `flex items-center rounded-lg text-sm font-medium transition-all ${
      sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
    }  ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-foreground hover:bg-accent/50 hover:text-accent-foreground'
    }`

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-16' : 'w-60'
      } bg-card/95 backdrop-blur-sm border-r border-border min-h-screen flex flex-col transition-all duration-200`}
    >
      <div
        className={`p-4 border-b border-border flex items-center ${
          sidebarCollapsed ? 'justify-center' : 'gap-3'
        }`}
      >
        <ValuteLogoSVG className="w-8 h-8 shrink-0 rounded-lg" />
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Valute
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">Your life, organized</p>
          </div>
        )}
      </div>
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto overflow-x-hidden">
        {navSections.map((section) => (
          <div key={section.title}>
            {!sidebarCollapsed && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border space-y-1">
        <ThemeToggle compact={sidebarCollapsed} />
        <NavLink
          to="/settings"
          title={sidebarCollapsed ? 'Settings' : undefined}
          className={({ isActive }) => linkClass(isActive)}
        >
          <Settings className={`h-5 w-5 shrink-0 ${sidebarCollapsed ? '' : 'mr-3'}`} />
          {!sidebarCollapsed && 'Settings'}
        </NavLink>
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`w-full flex items-center rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all ${
            sidebarCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
          }`}
        >
          {sidebarCollapsed ? (
            <ChevronsRight className="h-5 w-5 shrink-0" />
          ) : (
            <>
              <ChevronsLeft className="h-5 w-5 shrink-0 mr-3" />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
